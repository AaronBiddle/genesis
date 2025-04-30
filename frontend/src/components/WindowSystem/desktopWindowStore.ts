// frontend/src/components/WindowSystem/desktopWindowStore.ts
// -----------------------------------------------------
// A scoped window-manager store for the main Desktop
// -----------------------------------------------------
import { createWindowStore } from './windowStoreFactory'

// Create a dedicated window store for the main desktop environment
const desktopStore = createWindowStore('desktop')

// Destructure and re-export the reactive pieces needed in the UI
export const {
  windows,
  addWindow,
  bringToFront,
  moveWindow,
  updateWindowBounds,
  closeWindow,
} = desktopStore

// Export the whole store instance for providing to descendants
export { desktopStore }

// You can also export the store anonymously if that's more convenient:
export default desktopStore 