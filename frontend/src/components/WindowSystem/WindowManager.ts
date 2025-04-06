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

// Function to update window bounds (position and size)
export function updateWindowBounds(windowId: number, newX: number, newY: number, newWidth: number, newHeight: number): void {
  const windowIndex = windows.value.findIndex(w => w.id === windowId);
  if (windowIndex !== -1) {
    const windowToUpdate = windows.value[windowIndex];

    // Apply constraints
    const finalWidth = Math.max(MIN_WIDTH, newWidth);
    const finalHeight = Math.max(MIN_HEIGHT, newHeight);
    const finalY = Math.max(0, newY); // Prevent moving above top edge
    // No specific constraint for finalX currently, but could be added (e.g., prevent moving entirely off-screen left)
    const finalX = newX;

    windowToUpdate.x = finalX;
    windowToUpdate.y = finalY;
    windowToUpdate.width = finalWidth;
    windowToUpdate.height = finalHeight;
  }
}

// Function to close a window
export function closeWindow(windowId: number): void {
  const index = windows.value.findIndex(w => w.id === windowId);
  if (index !== -1) {
    windows.value.splice(index, 1);
    // Optional: Re-evaluate highestZIndex if the closed window was on top
    if (windows.value.length === 0) {
      highestZIndex.value = 0;
    } else if (highestZIndex.value === windows.value[index]?.zIndex) {
        // This check is slightly complex as the removed window's zIndex is gone.
        // A safer approach is to recalculate highestZIndex from the remaining windows.
        highestZIndex.value = Math.max(0, ...windows.value.map(w => w.zIndex));
    }
  }
}

// Export the reactive state and actions
export { windows, highestZIndex }; 