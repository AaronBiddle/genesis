import type { Component } from 'vue'; // Import Component type
import IconViewer from '@/components/Icons/IconViewer.vue'; // Import IconViewer

export interface App {
  id: string; // Unique identifier (e.g., 'text-editor', 'web-browser') - Essential
  title: string; // Human-readable name (e.g., 'Text Editor', 'Browser') - Essential
  iconId: string; // ID to look up the icon in your svgIconsMap (e.g., 'Docs', 'Chat') - Essential
  appComponent: Component; // The actual Vue component to render for this app - Essential
  iconColor?: string; // Optional color for the icon background/element
  titleBarColor?: string; // Optional color for the window title bar
  titleColor?: string; // Optional color for the window title text
  initialWidth?: number; // Optional starting width in pixels
  initialHeight?: number; // Optional starting height in pixels
  resizable?: boolean; // Can the window be resized? (Default: true)
  maximizable?: boolean; // Can the window be maximized? (Default: true)
  minimizable?: boolean; // Can the window be minimized? (Default: true)
  allowMultipleInstances?: boolean; // Can multiple windows of this app be open? (Default: true)
  category?: string; // For grouping (e.g., 'Utilities', 'Games', 'Development')
  initialPosition?: { x: number; y: number }; // Specific starting position? (For relative window positions like file dialogues)
}

export const apps: App[] = [  
  {
    id: "icons",
    title: "Icons",
    iconId: "Icons",
    appComponent: IconViewer, // Use the imported IconViewer component
    iconColor: '#4299E1', // Blue 500
    titleBarColor: '#e3f2fd', // Blue 200
    titleColor: '#1A202C', // Gray 800
  },
];