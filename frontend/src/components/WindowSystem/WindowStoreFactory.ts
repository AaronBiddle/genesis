// windowStoreFactory.ts – refactored (stable DOM & bounded z‑index)
// ---------------------------------------------------------------
import { ref, markRaw } from 'vue'
import type { Ref, Component } from 'vue'
import type { App } from './apps'

/* ------------------------------------------------------------------
 * 1 · Types (exported so callers import from here)
 * ------------------------------------------------------------------ */
export interface ManagedWindow {
  id: number
  appId: string
  title: string
  appComponent: Component
  iconId: string
  x: number;  y: number
  width: number; height: number
  zIndex: number
  state: 'normal' | 'minimized' | 'maximized'
  isFocused: boolean
  resizable: boolean; maximizable: boolean; minimizable: boolean
  minimumWidth?: number; minimumHeight?: number
  iconColor?: string;   titleBarColor?: string; titleColor?: string
  launchOptions?: any;  parentId?: number
}

/* ------------------------------------------------------------------
 * 2 · Factory – a separate store per invocation (optional scope tag)
 * ------------------------------------------------------------------ */
export function createWindowStore(scope = 'global') {
  /* ---------- reactive state shared within this scope only -------- */
  const windows: Ref<ManagedWindow[]> = ref([])
  const nextWindowId = ref(0)

  /* ---------- stacking order management -------------------------- */
  const BASE_Z = 1                      // starting z‑index
  const MAX_Z_LIMIT = 10_000            // compact once we cross this
  let currentMaxZ = BASE_Z              // highest z currently in use

  /* ---------- layout constants ----------------------------------- */
  const DEF_W = 400, DEF_H = 300
  const START_X = 50, START_Y = 50, CASCADE = 20
  const MIN_W  = 200, MIN_H  = 150

  /* ================================================================
   * Helpers
   * ============================================================== */
  function normaliseZIndices() {
    // Sort by current z so visual stacking is preserved
    const ordered = [...windows.value].sort((a, b) => a.zIndex - b.zIndex)
    ordered.forEach((w, i) => { w.zIndex = i + BASE_Z })
    currentMaxZ = windows.value.length + BASE_Z - 1
  }

  /* ================================================================
   * CRUD operations
   * ============================================================== */
  function addWindow(app: App, opts?: { parentId?: number; launchOptions?: any }) {
    const w = app.initialWidth  ?? DEF_W
    const h = app.initialHeight ?? DEF_H

    /* cascade or centre on parent --------------------------------- */
    let x = START_X + (windows.value.length * CASCADE) % (window.innerWidth  - w - START_X * 2)
    let y = START_Y + (windows.value.length * CASCADE) % (window.innerHeight - h - START_Y * 2)

    if (opts?.parentId !== undefined) {
      const p = windows.value.find(win => win.id === opts.parentId)
      if (p) {
        x = Math.max(0, Math.min(p.x + p.width  / 2 - w / 2 + 30, window.innerWidth  - w))
        y = Math.max(0, Math.min(p.y + p.height / 2 - h / 2 + 30, window.innerHeight - h))
      }
    }

    windows.value.push({
      id:        nextWindowId.value++,
      appId:     app.id,
      title:     app.title,
      appComponent: markRaw(app.appComponent),
      iconId:    app.iconId,
      x, y, width: w, height: h,
      zIndex:    ++currentMaxZ,
      state:     'normal',
      isFocused: true,
      resizable:  app.resizable  ?? true,
      maximizable:app.maximizable?? true,
      minimizable:app.minimizable?? true,
      minimumWidth:  app.minimumWidth  ?? MIN_W,
      minimumHeight: app.minimumHeight ?? MIN_H,
      iconColor:     app.iconColor,
      titleBarColor: app.titleBarColor,
      titleColor:    app.titleColor,
      launchOptions: opts?.launchOptions,
      parentId:      opts?.parentId,
    })

    if (currentMaxZ > MAX_Z_LIMIT) normaliseZIndices()
  }

  function bringToFront(id: number) {
    const win = windows.value.find(w => w.id === id)
    if (!win) return

    // focus bookkeeping
    windows.value.forEach(w => { w.isFocused = w.id === id })

    // raise
    win.zIndex = ++currentMaxZ

    if (currentMaxZ > MAX_Z_LIMIT) normaliseZIndices()
  }

  function moveWindow(id: number, newX: number, newY: number) {
    const win = windows.value.find(w => w.id === id)
    if (win) Object.assign(win, { x: newX, y: Math.max(0, newY) })
  }

  function updateWindowBounds(id: number, newX: number, newY: number, newW: number, newH: number) {
    const win = windows.value.find(w => w.id === id)
    if (!win) return
    win.x = newX
    win.y = Math.max(0, newY)
    win.width  = Math.max(win.minimumWidth  ?? MIN_W, newW)
    win.height = Math.max(win.minimumHeight ?? MIN_H, newH)
  }

  function closeWindow(id: number) {
    const idx = windows.value.findIndex(w => w.id === id)
    if (idx !== -1) windows.value.splice(idx, 1)
  }

  /* ----------------------------------------------------------------
   * Public surface
   * ---------------------------------------------------------------- */
  return {
    scope,          // debug / introspection
    windows,        // reactive list
    addWindow,
    bringToFront,
    moveWindow,
    updateWindowBounds,
    closeWindow,
  }
}
