// windowStoreFactory.ts
import { ref, markRaw } from 'vue';
import type { Ref, Component } from 'vue';
import type { App } from './apps';

/* ------------------------------------------------------------------ */
/* 1.  Types – unchanged, but exported so callers import from here     */
/* ------------------------------------------------------------------ */
export interface ManagedWindow {
  id: number;
  appId: string;
  title: string;
  appComponent: Component;
  iconId: string;
  x: number;  y: number;
  width: number; height: number;
  zIndex: number;
  state: 'normal' | 'minimized' | 'maximized';
  isFocused: boolean;
  resizable: boolean; maximizable: boolean; minimizable: boolean;
  minimumWidth?: number; minimumHeight?: number;
  iconColor?: string;   titleBarColor?: string; titleColor?: string;
  launchOptions?: any;  parentId?: number;
}

/* ------------------------------------------------------------------ */
/* 2.  Factory                                                         */
/* ------------------------------------------------------------------ */
export function createWindowStore(scope = 'global') {
  /* ---------- reactive state shared within this scope only -------- */
  const windows: Ref<ManagedWindow[]> = ref([]);
  const nextWindowId = ref(0);

  /* ---------- constants (per-scope) ------------------------------- */
  const BASE_Z = 1;
  const DEF_W = 400, DEF_H = 300;
  const START_X = 50, START_Y = 50, CASCADE = 20;
  const MIN_W  = 200, MIN_H  = 150;

  /* ---------- CRUD helpers --------------------------------------- */
  function addWindow(app: App, opts?: { parentId?: number; launchOptions?: any }) {
    const w  = app.initialWidth  ?? DEF_W;
    const h  = app.initialHeight ?? DEF_H;

    /* cascade or center on parent ---------------------------------- */
    let x = START_X + (windows.value.length * CASCADE) % (window.innerWidth  - w - START_X*2);
    let y = START_Y + (windows.value.length * CASCADE) % (window.innerHeight - h - START_Y*2);

    if (opts?.parentId !== undefined) {
      const p = windows.value.find(win => win.id === opts.parentId);
      if (p) {
        x = Math.max(0, Math.min(p.x + p.width  /2 - w/2 + 30, window.innerWidth  - w));
        y = Math.max(0, Math.min(p.y + p.height /2 - h/2 + 30, window.innerHeight - h));
      }
    }

    windows.value.push({
      id:        nextWindowId.value++,
      appId:     app.id,
      title:     app.title,
      appComponent: markRaw(app.appComponent),
      iconId:    app.iconId,
      x, y, width: w, height: h,
      zIndex:    BASE_Z,
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
    });
  }

  function bringToFront(id: number) {
    const idx = windows.value.findIndex(w => w.id === id);
    if (idx === -1) return;

    windows.value.forEach((w, i) => (w.isFocused = i === idx));
    if (idx < windows.value.length - 1) {
      windows.value.push(...windows.value.splice(idx, 1));
    }
  }

  function moveWindow(id: number, newX: number, newY: number) {
    const win = windows.value.find(w => w.id === id);
    if (win) Object.assign(win, { x: newX, y: Math.max(0, newY) });
  }

  function updateWindowBounds(id: number, newX: number, newY: number, newW: number, newH: number) {
    const win = windows.value.find(w => w.id === id);
    if (!win) return;
    win.x = newX;
    win.y = Math.max(0, newY);
    win.width  = Math.max(win.minimumWidth  ?? MIN_W, newW);
    win.height = Math.max(win.minimumHeight ?? MIN_H, newH);
  }

  function closeWindow(id: number) {
    const idx = windows.value.findIndex(w => w.id === id);
    if (idx !== -1) windows.value.splice(idx, 1);
  }

  /* ---------- public surface ------------------------------------- */
  return {
    scope,          // just for debugging / introspection
    windows,        // reactive list
    addWindow,
    bringToFront,
    moveWindow,
    updateWindowBounds,
    closeWindow,
  };
}
