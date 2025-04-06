import { ref } from 'vue';
import type { App } from './apps';
import type { Component } from 'vue';

export interface ManagedWindow {
  id: number;
  appId: string;
  title: string;
  appComponent: Component;
  iconId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  state: 'normal' | 'minimized' | 'maximized';
  isFocused: boolean;
  resizable: boolean;
  maximizable: boolean;
  minimizable: boolean;
}

const windows = ref<ManagedWindow[]>([]);
const nextWindowId = ref(0);
let highestZIndex = ref(0);

// Default window dimensions and starting position
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 300;
const START_X = 50;
const START_Y = 50;
const CASCADE_OFFSET = 20;

// Minimum window dimensions
const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;

export function addWindow(app: App, options?: { x?: number; y?: number }): void {
  const initialWidth = app.initialWidth ?? DEFAULT_WIDTH;
  const initialHeight = app.initialHeight ?? DEFAULT_HEIGHT;

  // Calculate position: Use provided options or fallback to cascade
  const posX = options?.x ?? START_X + (windows.value.length * CASCADE_OFFSET) % (window.innerWidth - initialWidth - START_X * 2);
  const posY = options?.y ?? START_Y + (windows.value.length * CASCADE_OFFSET) % (window.innerHeight - initialHeight - START_Y * 2);

  const newWindow: ManagedWindow = {
    id: nextWindowId.value,
    appId: app.id,
    title: app.title,
    appComponent: app.appComponent,
    iconId: app.iconId,
    x: posX,
    y: posY,
    width: initialWidth,
    height: initialHeight,
    zIndex: highestZIndex.value + 1,
    state: 'normal',
    isFocused: true,
    resizable: app.resizable ?? true,
    maximizable: app.maximizable ?? true,
    minimizable: app.minimizable ?? true,
  };

  windows.value.push(newWindow);
  nextWindowId.value++;
  highestZIndex.value = newWindow.zIndex;
}

// Function to bring a window to the front and focus it
export function bringToFront(windowId: number): void {
    const windowIndex = windows.value.findIndex(w => w.id === windowId);
    if (windowIndex !== -1) {
        const windowToUpdate = windows.value[windowIndex];
        
        // Unfocus all other windows
        windows.value.forEach(w => {
          if (w.id !== windowId) {
            w.isFocused = false;
          }
        });

        // Focus the target window
        windowToUpdate.isFocused = true;

        // Bring to front if not already the top-most
        if (windowToUpdate.zIndex < highestZIndex.value) {
            highestZIndex.value++;
            windowToUpdate.zIndex = highestZIndex.value;
        }
    }
}

// Function to move a window
export function moveWindow(windowId: number, newX: number, newY: number): void {
  const windowIndex = windows.value.findIndex(w => w.id === windowId);
  if (windowIndex !== -1) {
    const windowToUpdate = windows.value[windowIndex];
    windowToUpdate.x = newX;
    windowToUpdate.y = Math.max(0, newY); // Prevent moving above the top edge
  }
}

// Function to resize a window
export function resizeWindow(windowId: number, newWidth: number, newHeight: number): void {
  const windowIndex = windows.value.findIndex(w => w.id === windowId);
  if (windowIndex !== -1) {
    const windowToUpdate = windows.value[windowIndex];
    windowToUpdate.width = Math.max(MIN_WIDTH, newWidth);
    windowToUpdate.height = Math.max(MIN_HEIGHT, newHeight);
  }
}

// Export the reactive state and actions
export { windows, highestZIndex }; 