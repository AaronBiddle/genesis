import { ref, markRaw } from 'vue';
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
  minimumWidth?: number;
  minimumHeight?: number;
  iconColor?: string;
  titleBarColor?: string;
  titleColor?: string;
  launchOptions?: any;
  parentId?: number;
}

const windows = ref<ManagedWindow[]>([]);
const nextWindowId = ref(0);
const BASE_Z_INDEX = 1;

// Default window dimensions and starting position
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 300;
const START_X = 50;
const START_Y = 50;
const CASCADE_OFFSET = 20;

// Minimum window dimensions
const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;

export function addWindow(app: App, options?: { parentId?: number; launchOptions?: any }): void {
  const initialWidth = app.initialWidth ?? DEFAULT_WIDTH;
  const initialHeight = app.initialHeight ?? DEFAULT_HEIGHT;

  // Calculate position: Use parent window position or fallback to cascade
  let posX = START_X + (windows.value.length * CASCADE_OFFSET) % (window.innerWidth - initialWidth - START_X * 2);
  let posY = START_Y + (windows.value.length * CASCADE_OFFSET) % (window.innerHeight - initialHeight - START_Y * 2);

  // Position relative to parent window if provided
  if (options?.parentId !== undefined) {
    const parentWindow = windows.value.find(w => w.id === options.parentId);
    if (parentWindow) {
      // Position the new window centered on the parent with a slight offset
      posX = parentWindow.x + parentWindow.width / 2 - initialWidth / 2 + 30;
      posY = parentWindow.y + parentWindow.height / 2 - initialHeight / 2 + 30;
      
      // Ensure the window is within screen bounds
      posX = Math.max(0, Math.min(posX, window.innerWidth - initialWidth));
      posY = Math.max(0, Math.min(posY, window.innerHeight - initialHeight));
    }
  }

  const newWindow: ManagedWindow = {
    id: nextWindowId.value,
    appId: app.id,
    title: app.title,
    appComponent: markRaw(app.appComponent),
    iconId: app.iconId,
    x: posX,
    y: posY,
    width: initialWidth,
    height: initialHeight,
    zIndex: BASE_Z_INDEX,
    state: 'normal',
    isFocused: true,
    resizable: app.resizable ?? true,
    maximizable: app.maximizable ?? true,
    minimizable: app.minimizable ?? true,
    iconColor: app.iconColor,
    titleBarColor: app.titleBarColor,
    titleColor: app.titleColor,
    minimumWidth: app.minimumWidth ?? MIN_WIDTH,
    minimumHeight: app.minimumHeight ?? MIN_HEIGHT,
    launchOptions: options?.launchOptions,
    parentId: options?.parentId,
  };

  windows.value.push(newWindow);
  nextWindowId.value++;
}

// Function to bring a window to the front and focus it
export function bringToFront(windowId: number): void {
    const windowIndex = windows.value.findIndex(w => w.id === windowId);
    if (windowIndex !== -1) {
        const windowToUpdate = windows.value[windowIndex];

        // Unfocus all other windows
        windows.value.forEach((w, index) => {
          if (index !== windowIndex) {
            w.isFocused = false;
          }
        });

        // Focus the target window
        windowToUpdate.isFocused = true;

        // Bring to front by moving the item to the end of the array
        if (windowIndex < windows.value.length - 1) {
            // Remove the window from its current position
            const [movedWindow] = windows.value.splice(windowIndex, 1);
            // Add it to the end
            windows.value.push(movedWindow);
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
    const finalWidth = Math.max(windowToUpdate.minimumWidth ?? MIN_WIDTH, newWidth);
    const finalHeight = Math.max(windowToUpdate.minimumHeight ?? MIN_HEIGHT, newHeight);
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
  }
}

export { windows }; 