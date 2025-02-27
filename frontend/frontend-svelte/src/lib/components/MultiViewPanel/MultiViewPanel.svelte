<script lang="ts">
    import type { Panel } from './stores/panelStore';
    import { panels, setActivePanel, updatePanelsById, bringToFront, applySuggestedSize } from './stores/panelStore';
    import ResizeHandles from './ResizeHandles.svelte';
    import { createResizeHandler } from './resizeManager';
    import type { ResizeEdge } from './types';
    import AppRegistration from './AppRegistration.svelte';
    import type { Component } from 'svelte';
    import EmptyPanel from './EmptyPanel.svelte';

    interface PanelApp {
        id: string;
        label: string;
        component: Component;
        suggestedWidth?: number;
        suggestedHeight?: number;
    }

    export let panel: Panel;
    // Additional apps can be passed in; they should have id, label, and component
    export let apps: PanelApp[] = [];

    const defaultApp: PanelApp = {
        id: 'empty',
        label: 'Empty',
        component: EmptyPanel
    };

    // Merge default empty app with any additional apps
    $: mergedApps = [defaultApp, ...apps];
    // Determine current app based on panel.appId; fallback to defaultApp
    $: currentApp = mergedApps.find(app => app.id === panel.appId) || defaultApp;

    let isDragging = false;
    let startX: number;
    let startY: number;
    let initialX: number;
    let initialY: number;
    let dragContainer: HTMLElement;
    let resizing = false;

    const MIN_SIZE = 100;

    let panelElement: HTMLElement;

    const resizeHandler = createResizeHandler(() => panel, (updater) => {
        updatePanelsById(panel.id, updater);
    });

    const toolbarHeight = 0; // Adjust as necessary

    function handlePointerDown(e: PointerEvent) {
        // Ignore events on interactive elements
        const target = e.target as HTMLElement;
        if (
            target.closest('button') ||
            target.closest('select') ||
            target.closest('input')
        ) {
            return;
        }
        e.preventDefault();

        dragContainer = (e.currentTarget as HTMLElement);
        dragContainer.setPointerCapture(e.pointerId);

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = panel.x;
        initialY = panel.y;
        setActivePanel(panel.id);
        bringToFront(panel.id);

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    }

    function handlePointerMove(e: PointerEvent) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newX = initialX + dx;
        // Prevent y from going above the toolbar (e.g. below toolbarHeight)
        const newY = Math.max(initialY + dy, toolbarHeight);
        panels.update(current =>
            current.map(p =>
                p.id === panel.id
                    ? { ...p, x: newX, y: newY }
                    : p
            )
        );
    }

    function handlePointerUp(e: PointerEvent) {
        isDragging = false;
        if (dragContainer) {
            dragContainer.releasePointerCapture(e.pointerId);
        }
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    }

    function closePanel() {
        panels.update(current => current.filter(p => p.id !== panel.id));
    }

    function handleAppChange(detail: { selectedApp: string }) {
        updatePanelsById(panel.id, (p) => ({ ...p, appId: detail.selectedApp }));
    }

    function handleResizeStart(e: PointerEvent, edge: ResizeEdge) {
        resizing = true;
        resizeHandler.start(e, edge);
        window.addEventListener('pointermove', resizeHandler.move);
        window.addEventListener('pointerup', stopResize);
    }

    function stopResize() {
        resizeHandler.stop();
        window.removeEventListener('pointermove', resizeHandler.move);
        window.removeEventListener('pointerup', stopResize);
        resizing = false;
    }
</script>

<div bind:this={panelElement} class="absolute bg-white border-2 border-blue-500 rounded-lg transition-transform flex flex-col {isDragging ? 'cursor-grabbing' : ''}"
     style={`pointer-events: ${resizing ? 'none' : 'auto'}; left: ${panel.x}px; top: ${panel.y}px; width: ${panel.width}px; height: ${panel.height}px; z-index: ${panel.zIndex};`}>

    <ResizeHandles onResizeStart={handleResizeStart} />

    <!-- Header Slot: Consumers can provide their own header.
         If not, a default header is shown with app registration and a close button. -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 select-none rounded-t-lg" on:pointerdown={handlePointerDown}>
        <slot name="header">
            <AppRegistration
                apps={mergedApps}
                selectedApp={panel.appId}
                changeHandler={handleAppChange}
            />
            <div class="flex space-x-2">
                <!-- New button to apply suggested size -->
                <button on:click={() => applySuggestedSize(panel.id, currentApp.suggestedWidth, currentApp.suggestedHeight)}
                        class="p-1 hover:bg-gray-200 rounded-md transition-colors pointer-events-auto"
                        title="Apply suggested size">
                    <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                        <!-- Top Right Corner -->
                        <polyline points="16 4 20 4 20 8"></polyline>
                        <!-- Bottom Left Corner -->
                        <polyline points="4 16 4 20 8 20"></polyline>
                    </svg>
                </button>
                <button on:click={closePanel}
                        class="p-1 hover:bg-gray-200 rounded-md transition-colors pointer-events-auto"
                        title="Close window"
                        aria-label="Close window">
                    <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        </slot>
    </div>

    <!-- Content Area: Render the component for the current app -->
    <div class="flex-1 overflow-auto" style={`height: ${panel.height - 40}px;`}>
        <svelte:component this={currentApp.component} />
    </div>
</div> 