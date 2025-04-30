// src/apps/scripter/windowStore.ts
// -------------------------------------------------
// A scoped window‑manager store for the Scripter app
// -------------------------------------------------
import { createWindowStore } from '@/components/WindowSystem/windowStoreFactory'

// Create a dedicated window store just for Scripter so
// it doesn’t collide with any other window scopes you
// may instantiate elsewhere in the workspace.
const {
  windows,
  addWindow,
  bringToFront,
  moveWindow,
  updateWindowBounds,
  closeWindow,
} = createWindowStore('scripter')

// ──────────────────────────────────────────────────
// Re‑export the reactive pieces you’ll need in the UI
// ──────────────────────────────────────────────────
export {
  windows,
  addWindow,
  bringToFront,
  moveWindow,
  updateWindowBounds,
  closeWindow,
}

// You can also import the whole store anonymously if
// that’s more convenient:
export default {
  windows,
  addWindow,
  bringToFront,
  moveWindow,
  updateWindowBounds,
  closeWindow,
}