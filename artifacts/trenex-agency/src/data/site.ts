/**
 * Central place for static site content (copy, nav links, service data, etc.)
 * Populate this as sections are built so components stay presentation-only.
 */

export const siteConfig = {
  name: "TRENEX AGENCY",
  headline: "We Build Digital Experiences.",
  subheadline: "Design. Motion. Code.",
  description:
    "TRENEX is a futuristic creative agency engineering premium brands, cinematic motion, and high-performance digital products.",
};

export const navLinks: { label: string; href: string }[] = [
  { label: "Home",      href: "#hero" },
  { label: "Services",  href: "#services" },
  { label: "Signature", href: "#signature" },
  { label: "Contact",   href: "#contact" },
];

export const contactInfo = {
  email: "trenexagency@gmail.com",
  whatsapp: "https://wa.me/923323848135",
};

export interface SocialLink {
  id: string;
  label: string;
  href: string | null;
  disabled?: boolean;
}

export const socialLinks: SocialLink[] = [
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/profile.php?id=61590931302050" },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/trenexagency/" },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@TrenexAgency" },
  { id: "linkedin", label: "LinkedIn", href: null, disabled: true },
  { id: "whatsapp", label: "WhatsApp", href: "https://wa.me/923323848135" },
  { id: "email", label: "Email", href: "mailto:trenexagency@gmail.com" },
];

export interface Service {
  title: string;
  tagline: string;
  description: string;
  index: string;
  capabilities: string[];
  /** Opens in a new tab — the homepage stays open in the original tab. */
  href?: string;
}

export interface ExpertiseTool {
  name: string;
  description: string;
  icon: string;
}

export interface ExpertiseCategory {
  title: string;
  tools: ExpertiseTool[];
}

export const expertise: ExpertiseCategory[] = [
  {
    title: "Design",
    tools: [
      { name: "Photoshop", description: "Pixel-perfect retouching & compositing", icon: "photoshop" },
      { name: "Illustrator", description: "Vector art & scalable brand assets", icon: "illustrator" },
      { name: "Figma", description: "Collaborative UI/UX design systems", icon: "figma" },
      { name: "InDesign", description: "Layout & print-ready publications", icon: "indesign" },
    ],
  },
  {
    title: "Video & Motion",
    tools: [
      { name: "Premiere Pro", description: "Cinematic editing & storytelling", icon: "premiere" },
      { name: "After Effects", description: "Motion graphics & visual effects", icon: "aftereffects" },
      { name: "DaVinci Resolve", description: "Professional color grading", icon: "davinci" },
      { name: "CapCut", description: "Fast-turnaround social edits", icon: "capcut" },
    ],
  },
  {
    title: "Development",
    tools: [
      { name: "HTML5", description: "Semantic, accessible foundations", icon: "html5" },
      { name: "CSS3", description: "Modern, responsive styling", icon: "css3" },
      { name: "JavaScript", description: "Dynamic, interactive experiences", icon: "javascript" },
      { name: "React", description: "Scalable component architecture", icon: "react" },
      { name: "Node.js", description: "High-performance backend systems", icon: "nodejs" },
      { name: "GitHub", description: "Version control & collaboration", icon: "github" },
    ],
  },
];

export const services: Service[] = [
  {
    index: "01",
    title: "Graphic Design",
    tagline: "Identity Systems",
    description:
      "Strategic brand identities and visual systems designed to make your business instantly recognizable, memorable, and trusted.",
    capabilities: ["Brand Identity", "Logo Design", "Brand Guidelines"],
    href: "/graphic-design",
  },
  {
    index: "02",
    title: "Video Editing",
    tagline: "Motion & Story",
    description:
      "High-impact video content crafted to capture attention, increase engagement, and tell your story with cinematic precision.",
    capabilities: ["Commercial Editing", "Motion Graphics", "Color Grading"],
    /** Opens in a new tab (see ServiceCard.tsx) — the homepage stays open in the original tab. */
    href: "/video-editing",
  },
  {
    index: "03",
    title: "Web, App & Software Development",
    tagline: "Digital Engineering",
    description:
      "Scalable digital solutions built for performance, usability, and business growth.",
    capabilities: ["Web Development", "App Development", "Software Development"],
    /** Opens in a new tab (see ServiceCard.tsx) — the homepage stays open in the original tab. */
    href: "/web-development",
  },
];
