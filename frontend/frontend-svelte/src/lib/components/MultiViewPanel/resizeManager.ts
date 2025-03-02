import type { ResizeEdge } from './types';
import type { Panel } from './panelStore';

type ResizeState = {
    isResizing: boolean;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startPanelX: number;
    startPanelY: number;
    currentEdge: ResizeEdge | null;
};

const MIN_SIZE = 100;

export function createResizeHandler(
    getPanel: () => Panel,
    updatePanel: (updater: (p: Panel) => Panel) => void
) {
    const state: ResizeState = {
        isResizing: false,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        startPanelX: 0,
        startPanelY: 0,
        currentEdge: null
    };

    function start(e: PointerEvent, edge: ResizeEdge) {
        const panel = getPanel();
        state.isResizing = true;
        state.currentEdge = edge;
        state.startX = e.clientX;
        state.startY = e.clientY;
        state.startWidth = panel.width;
        state.startHeight = panel.height;
        state.startPanelX = panel.x;
        state.startPanelY = panel.y;
    }

    function move(e: PointerEvent) {
        e.preventDefault();
        if (!state.isResizing || !state.currentEdge) return;
        
        const deltaX = e.clientX - state.startX;
        const deltaY = e.clientY - state.startY;
        
        updatePanel((p) => {
            let newWidth = state.startWidth;
            let newHeight = state.startHeight;
            let newX = state.startPanelX;
            let newY = state.startPanelY;

            if (state.currentEdge!.includes('left')) {
                newWidth = Math.max(state.startWidth - deltaX, MIN_SIZE);
                newX = state.startPanelX + (state.startWidth - newWidth);
            }
            if (state.currentEdge!.includes('right')) {
                newWidth = Math.max(state.startWidth + deltaX, MIN_SIZE);
            }
            if (state.currentEdge!.includes('top')) {
                newHeight = Math.max(state.startHeight - deltaY, MIN_SIZE);
                newY = state.startPanelY + (state.startHeight - newHeight);
            }
            if (state.currentEdge!.includes('bottom')) {
                newHeight = Math.max(state.startHeight + deltaY, MIN_SIZE);
            }

            return { ...p, width: newWidth, height: newHeight, x: newX, y: newY };
        });
    }

    function stop() {
        state.isResizing = false;
        state.currentEdge = null;
    }

    return {
        start,
        move,
        stop,
        get isResizing() { return state.isResizing; }
    };
} 