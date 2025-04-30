// src/apps/scripter/windowStore.ts
// -------------------------------------------------
// A scoped window‑manager store for the Scripter app
// -------------------------------------------------
import { createWindowStore } from '@/components/WindowSystem/windowStoreFactory'

// Create a dedicated window store just for Scripter so
// it doesn’t collide with any other window scopes you
// may instantiate elsewhere in the workspace.
const scripterStore = createWindowStore('scripter')

// Destructure and re-export the reactive pieces needed in the UI
export const {
  windows,
  addWindow,
  bringToFront,
  moveWindow,
  updateWindowBounds,
  closeWindow,
} = scripterStore

// Export the whole store instance for providing to descendants or direct use
export { scripterStore }

// You can also export the store anonymously if that’s more convenient:
export default scripterStore