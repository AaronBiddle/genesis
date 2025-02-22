import { writable } from 'svelte/store';
import type { WindowLayout } from '../types/layoutTypes';
type LayoutStore = {
  layout: WindowLayout;
  version: 1;
};

const initialLayout: WindowLayout = {
  root: {
    type: 'leaf',
    id: crypto.randomUUID(),
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
    content: 'default'
  },
  activeWindowId: null
};

function createLayoutStore() {
  const { subscribe, update } = writable<LayoutStore>({
    layout: initialLayout,
    version: 1
  });

  return {
    subscribe,
    setActiveWindow: (id: string) => update(store => ({
      ...store,
      layout: { ...store.layout, activeWindowId: id }
    })),
    // We'll add more actions later for splitting/resizing
    persist: () => {
      // Add localStorage persistence logic here
    }
  };
}

export const layoutStore = createLayoutStore(); 