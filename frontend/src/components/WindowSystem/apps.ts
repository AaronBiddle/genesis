import type { Component } from 'vue'; // Import Component type
import IconViewer from '@/components/Icons/IconViewer.vue'; // Import IconViewer
import DocumentEditor from '@/components/DocumentEditor/DocumentEditor.vue'; // Import DocumentEditor
import HttpInspector from '@/components/HTTP/HttpInspector.vue'; // Import HttpInspector
import FileServiceTester from '@/components/FileService/FileServiceTester.vue'; // Import FileServiceTester

export interface App {
  id: string; // Unique identifier (e.g., 'text-editor', 'web-browser') - Essential
  title: string; // Human-readable name (e.g., 'Text Editor', 'Browser') - Essential
  iconId: string; // ID to look up the icon in your svgIconsMap (e.g., 'Docs', 'Chat') - Essential
  appComponent: Component; // The actual Vue component to render for this app - Essential
  iconColor?: string; // Optional Tailwind class for the icon color (e.g., 'text-blue-500')
  titleBarColor?: string; // Optional Tailwind class for the title bar background (e.g., 'bg-blue-200')
  titleColor?: string; // Optional Tailwind class for the title text color (e.g., 'text-gray-800')
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
    id: "document-editor",
    title: "Document Editor",
    iconId: "document", // Assuming 'docs' icon exists
    appComponent: DocumentEditor,
    initialWidth: 450,
    initialHeight: 500,
  },
  {
    id: "icons",
    title: "Icons",
    iconId: "icons",
    appComponent: IconViewer, // Use the imported IconViewer component
    iconColor: 'text-blue-500', // Tailwind class
    titleBarColor: 'bg-blue-200', // Tailwind class
    titleColor: 'text-gray-800', // Tailwind class
    category: 'Utilities',
  },
  {
    id: "http-inspector",
    title: "HTTP Inspector",
    iconId: "http", // Using 'http' icon as requested
    appComponent: HttpInspector,
    iconColor: 'text-purple-500', // Purple for the icon
    titleBarColor: 'bg-purple-200', // Light purple for the title bar
    titleColor: 'text-purple-900', // Dark purple for the title text
    initialWidth: 700, // A bit wider for the log display
    initialHeight: 600, // Taller to show more log entries
    category: 'Utilities',
  },
  {
    id: "file-service-tester",
    title: "File Service Tester",
    iconId: "file", // Use 'file' icon
    appComponent: FileServiceTester,
    iconColor: 'text-green-600', // Green theme
    titleBarColor: 'bg-green-200',
    titleColor: 'text-green-900',
    initialWidth: 500,
    initialHeight: 550,
    category: 'Utilities',
  }
];