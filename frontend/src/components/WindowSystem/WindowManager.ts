import { ref } from 'vue';
import type { App } from './apps';

export interface ManagedWindow {
  id: number;
  app: App;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
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

export function addWindow(app: App): void {
  const newWindow: ManagedWindow = {
    id: nextWindowId.value,
    app: app,
    title: app.name, // Use app name as the title
    // Simple cascading position for new windows
    x: START_X + (windows.value.length * CASCADE_OFFSET) % (window.innerWidth - DEFAULT_WIDTH - START_X * 2), // Basic cascade
    y: START_Y + (windows.value.length * CASCADE_OFFSET) % (window.innerHeight - DEFAULT_HEIGHT - START_Y * 2), // Basic cascade
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    zIndex: highestZIndex.value + 1,
  };

  windows.value.push(newWindow);
  nextWindowId.value++;
  highestZIndex.value++;
}

// Function to bring a window to the front
export function bringToFront(windowId: number): void {
    const windowIndex = windows.value.findIndex(w => w.id === windowId);
    if (windowIndex !== -1) {
        const windowToUpdate = windows.value[windowIndex];
        if (windowToUpdate.zIndex < highestZIndex.value) {
            highestZIndex.value++;
            windowToUpdate.zIndex = highestZIndex.value;
        }
    }
}

// Export the reactive state and actions
export { windows, highestZIndex }; 