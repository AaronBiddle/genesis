import { writable } from 'svelte/store';
import { logger } from '$lib/components/LogControlPanel/logger';

const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 500;

const NAMESPACE = 'MultiViewPanel/panelStore';

export type Panel = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  active: boolean;
  appId: string;
  suggestedWidth?: number;
  suggestedHeight?: number;
};

function createPanelStore() {
  const { subscribe, update, set } = writable<Panel[]>([]);
  let panelCount = 0;

  function createPanel(suggestedWidth: number = DEFAULT_WIDTH, suggestedHeight: number = DEFAULT_HEIGHT) {
    const newPanel: Panel = {
      id: panelCount.toString(),
      x: 50,
      y: 50,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      zIndex: panelCount,
      active: false,
      appId: 'empty',
      suggestedWidth: suggestedWidth,
      suggestedHeight: suggestedHeight
    };
    logger('DEBUG', 'ui', NAMESPACE, `Creating panel id: ${newPanel.id} with width: ${newPanel.width}, height: ${newPanel.height}, suggestedWidth: ${newPanel.suggestedWidth}, suggestedHeight: ${newPanel.suggestedHeight}`);
    panelCount += 1;
    update((panels: Panel[]) => [...panels, newPanel]);
  }

  function updatePanels(newPanels: Panel[]) {
    set(newPanels);
  }

  return {
    subscribe,
    update,
    createPanel,
    updatePanels,
  };
}

export const panels = createPanelStore();

// Export updatePanels as a function
export function updatePanels(newPanels: Panel[]): void {
  panels.updatePanels(newPanels);
}

export function setActivePanel(id: string) {
  panels.update((current: Panel[]) => {
    return current.map((p: Panel) => {
      return p.id === id ? { ...p, active: true } : { ...p, active: false };
    });
  });
}

export function updatePanelsById(id: string, updater: (panel: Panel) => Panel) {
  panels.update((current: Panel[]) =>
    current.map((p: Panel) => (p.id === id ? updater(p) : p))
  );
}

// Modified function to bring panel to front only if not already at the top
export function bringToFront(id: string) {
  panels.update((current: Panel[]) => {
    // Find the panel
    const panel = current.find(p => p.id === id);
    if (!panel) return current;
    
    // Find the maximum z-index
    const maxZ = Math.max(...current.map(p => p.zIndex), 0);
    
    // Only update if this panel isn't already at the top
    if (panel.zIndex < maxZ) {
      logger('DEBUG', 'ui', NAMESPACE, `Bringing panel ${id} to front. Old z-index: ${panel.zIndex}, new z-index: ${maxZ + 1}`);
      return current.map(p => 
        p.id === id ? { ...p, zIndex: maxZ + 1 } : p
      );
    }
    
    // Panel is already at the top, no need to update
    return current;
  });
}

// New function to apply the suggested size to a panel
export function applySuggestedSize(id: string, newWidth?: number, newHeight?: number): void {
  panels.update((current: Panel[]) =>
    current.map((panel) => {
      if (panel.id === id) {
        logger('DEBUG', 'ui', NAMESPACE, 'applySuggestedSize called with id:', id, 'newWidth:', newWidth, 'newHeight:', newHeight);
        return { ...panel,
                  width: newWidth ?? panel.width,
                  height: newHeight ?? panel.height };
      }
      return panel;
    })
  );
} 