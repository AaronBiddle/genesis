import { svgIcons } from "@/components/Icons/SvgIcons";

export interface App {
    name: string;
    icon: string; // SVG as a string
  }
  
  export const apps: App[] = [
    {
      name: "Chat",
      icon: svgIcons.get("Chat") || "",
    },
    {
      name: "Settings",
      icon: svgIcons.get("Settings") || "",
    },
    {
      name: "Docs",
      icon: svgIcons.get("Docs") || "",
    },
    {
      name: "Icons",
      icon: svgIcons.get("Icons") || "",
    },
  ];