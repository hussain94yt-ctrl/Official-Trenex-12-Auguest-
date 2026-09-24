import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { execFileSync } from "child_process";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const port = 3000;
const basePath = process.env.BASE_PATH || "/";

/* ══════════════════════════════════════════════════════
   PORTFOLIO FOLDER MANIFESTS
   Exposes the list of images in a public/portfolio/<folder>/
   directory as a virtual module, so galleries load whatever
   is dropped in that folder without any code changes.
   Each entry carries its intrinsic pixel dimensions (read via
   ImageMagick `identify`, cached by mtime) so <img> tags can
   ship width/height up front and avoid layout shift while the
   file itself lazy-loads. Hot-reloads in dev when files in the
   watched folder change.
══════════════════════════════════════════════════════ */
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"]);

export interface PortfolioImageMeta {
  file: string;
  width: number;
  height: number;
}

const dimensionCache = new Map<string, { mtimeMs: number; width: number; height: number }>();

function readDimensions(fullPath: string, mtimeMs: number): { width: number; height: number } {
  const cached = dimensionCache.get(fullPath);
  if (cached && cached.mtimeMs === mtimeMs) return cached;
  let width = 0;
  let height = 0;
  try {
    const out = execFileSync("identify", ["-format", "%w %h", fullPath], {
      encoding: "utf8",
    }).trim();
    const [w, h] = out.split(/\s+/).map(Number);
    if (Number.isFinite(w) && Number.isFinite(h)) {
      width = w;
      height = h;
    }
  } catch {
    // ImageMagick unavailable or unreadable file — fall back to 0x0
    // (consumers treat 0 as "no intrinsic size available").
  }
  const result = { mtimeMs, width, height };
  dimensionCache.set(fullPath, result);
  return result;
}

function portfolioFolderManifest(folder: string, exportName: string): Plugin {
  const virtualModuleId = `virtual:portfolio-${folder}`;
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  const dir = path.resolve(import.meta.dirname, "public/portfolio", folder);

  function listFiles(): PortfolioImageMeta[] {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((file) => {
        const fullPath = path.join(dir, file);
        const { mtimeMs } = fs.statSync(fullPath);
        const { width, height } = readDimensions(fullPath, mtimeMs);
        return { file, width, height };
      });
  }

  return {
    name: `portfolio-${folder}-manifest`,
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `export const ${exportName} = ${JSON.stringify(listFiles())};`;
      }
    },
    configureServer(server) {
      server.watcher.add(dir);
      server.watcher.on("all", (_event, changedPath) => {
        if (path.resolve(changedPath).startsWith(dir)) {
          const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: "full-reload" });
          }
        }
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    portfolioFolderManifest("fiverr-gigs", "fiverrGigFiles"),
    portfolioFolderManifest("thumbnails", "thumbnailFiles"),
    portfolioFolderManifest("social-media-posts", "socialMediaFiles"),
    portfolioFolderManifest("logos", "logoFiles"),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          /* Three.js ecosystem — heaviest dependency, cache independently */
          "vendor-three":  ["three", "@react-three/fiber", "@react-three/drei"],
          /* Animation libraries */
          "vendor-framer": ["framer-motion"],
          "vendor-gsap":   ["gsap"],
          /* React core — changes infrequently, long-lived cache */
          "vendor-react":  ["react", "react-dom"],
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
