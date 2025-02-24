import { writable, type Writable } from 'svelte/store';
import { get } from 'svelte/store';

export interface Panel {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    active: boolean;
    zIndex: number;
    title: string;
}

// Generate unique IDs for panels
let panelIdCounter = 0;
function generatePanelId() {
    return `panel-${panelIdCounter++}`;
}

export const panels: Writable<Panel[]> = writable([]);
export const activePanelId: Writable<string | null> = writable(null);

export function createPanel(position?: { x: number; y: number }) {
    const currentPanels = get(panels);
    const maxZ = currentPanels.reduce((max, p) => Math.max(max, p.zIndex), 0);
    
    const newPanel: Panel = {
        id: generatePanelId(),
        x: position?.x || 100,
        y: position?.y || 100,
        width: 400,
        height: 300,
        active: true,
        zIndex: maxZ + 1,  // Always 1 higher than current maximum
        title: ''
    };
    
    panels.update(current => {
        const updated = current.map(p => ({ ...p, active: false }));
        return [...updated, newPanel];
    });
    
    activePanelId.set(newPanel.id);
}

export function setActivePanel(id: string) {
    panels.update(current => {
        let maxZ = 0;
        const updated = current.map(p => {
            if(p.zIndex > maxZ) maxZ = p.zIndex;
            return p.id === id ? 
                { ...p, active: true, zIndex: maxZ + 1 } : 
                { ...p, active: false };
        });
        return updated;
    });
    activePanelId.set(id);
}

export function updatePanels(id: string, updater: (panel: Panel) => Panel) {
    panels.update(current => 
        current.map(p => 
            p.id === id ? updater(p) : p
        )
    );
}

// New function to bring panel to front
export function bringToFront(id: string) {
    panels.update(current => {
        let maxZ = Math.max(...current.map(p => p.zIndex), 0);
        return current.map(p => 
            p.id === id ? { ...p, zIndex: maxZ + 1 } : p
        );
    });
} 