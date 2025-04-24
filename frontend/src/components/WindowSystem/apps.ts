import type { Component } from 'vue'; // Import Component type
import IconViewer from '@/components/Icons/IconViewer.vue'; // Import IconViewer
import DocumentEditor from '@/components/DocumentEditor/DocumentEditor.vue'; // Import DocumentEditor
import HttpInspector from '@/components/HTTP/HttpInspector.vue'; // Import HttpInspector
import FileServiceTester from '@/components/FileService/FileServiceTester.vue'; // Import FileServiceTester
import FileManager from '@/components/FileService/FileManager.vue'; // Import FileManager
import EventBusInspecter from './EventBusInspecter.vue'; // Import EventBusInspector
import Logger from '@/components/Logger/Logger.vue'; // Import Logger
import WindowInspecter from './WindowInspecter.vue'; // Import the new Window Inspector
import ChatApp from '@/components/ChatApp/ChatApp.vue'; // Import ChatApp
import AIServiceTester from '@/components/AI/AIServiceTester.vue'; // Import AI Service Tester
import WsInspecter from '@/components/WS/WsInspecter.vue'; // Import WS Service Tester

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
  minimumWidth?: number; // Optional minimum width in pixels
  minimumHeight?: number; // Optional minimum height in pixels
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
    iconColor: 'text-blue-600', // Blue theme for icon
    titleBarColor: 'bg-blue-100', // Light blue for title bar
    titleColor: 'text-blue-900', // Dark blue for title text
    initialWidth: 450,
    initialHeight: 500,
  },
  {
    id: "chat-app",
    title: "Chat App",
    iconId: "chat", // Use 'chat' icon
    appComponent: ChatApp,
    iconColor: 'text-cyan-600', // Cyan theme
    titleBarColor: 'bg-cyan-100',
    titleColor: 'text-cyan-900',
    initialWidth: 450,
    initialHeight: 500,
    minimumWidth: 450,
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
    initialWidth: 300,
    initialHeight: 400
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
    initialHeight: 700,
    category: 'Utilities',
  },
  {
    id: "file-manager",
    title: "File Manager",
    iconId: "file", // Using file icon
    appComponent: FileManager,
    iconColor: 'text-blue-600', // Blue theme
    titleBarColor: 'bg-blue-200',
    titleColor: 'text-blue-900',
    initialWidth: 600,
    initialHeight: 500,
    category: 'Utilities',
  },
  {
    id: "event-bus-inspecter",
    title: "Event Bus Inspecter",
    iconId: "bus", // Using the new bus icon
    appComponent: EventBusInspecter,
    iconColor: 'text-orange-600', // Orange theme
    titleBarColor: 'bg-orange-200',
    titleColor: 'text-orange-900',
    initialWidth: 550,
    initialHeight: 500,
    category: 'Utilities',
  },
  {
    id: "logger",
    title: "Logger",
    iconId: "logger", // Use the new logger icon
    appComponent: Logger,
    iconColor: 'text-teal-600', // Teal theme
    titleBarColor: 'bg-teal-200',
    titleColor: 'text-teal-900',
    initialWidth: 600,
    initialHeight: 450,
    category: 'Utilities',
  },
  {
    id: "window-inspecter",
    title: "Window Inspecter",
    iconId: "windows", // Use the 'windows' icon
    appComponent: WindowInspecter,
    iconColor: 'text-purple-600', // Use the purple color from the original request
    titleBarColor: 'bg-purple-200',
    titleColor: 'text-purple-900',
    initialWidth: 400,
    initialHeight: 350,
    category: 'Utilities',
    allowMultipleInstances: false, // Only allow one instance
  },
  {
    id: "ai-service-tester",
    title: "AI Service Tester",
    iconId: "ai", // Assuming an 'ai' icon exists
    appComponent: AIServiceTester,
    iconColor: 'text-indigo-600', // Indigo theme
    titleBarColor: 'bg-indigo-200',
    titleColor: 'text-indigo-900',
    initialWidth: 550,
    initialHeight: 750,
    category: 'Utilities',
  },
  {
    id: "ws-inspecter",
    title: "WS Inspecter",
    iconId: "ws", // Use the 'ws' icon
    appComponent: WsInspecter,
    iconColor: 'text-sky-600', // Sky blue theme
    titleBarColor: 'bg-sky-200',
    titleColor: 'text-sky-900',
    initialWidth: 650,
    initialHeight: 600,
    category: 'Utilities',
  }
];