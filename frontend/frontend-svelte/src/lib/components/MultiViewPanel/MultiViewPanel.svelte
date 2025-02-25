<script lang="ts">
    import type { Panel } from './stores/panelStore';
    import { panels, setActivePanel, updatePanelsById, bringToFront } from './stores/panelStore';
    import ResizeHandles from './ResizeHandles.svelte';
    import { createResizeHandler } from './resizeManager';
    import type { ResizeEdge } from './types';
    import { onMount, getContext } from 'svelte';
    import AppRegistration from './AppRegistration.svelte';
    import type { SvelteComponentTyped } from 'svelte';
    import EmptyPanel from './EmptyPanel.svelte';

    interface PanelApp {
        id: string;
        label: string;
        component: typeof SvelteComponentTyped<any, any, any>;
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

    const MIN_SIZE = 100;

    let panelElement: HTMLElement;
    let containerMinY = 0;

    onMount(() => {
        // Try to get toolbar height from context set by MultiViewBackground
        const contextToolbarHeight = getContext('MultiViewToolbarHeight') as number | null;
        if (contextToolbarHeight != null) {
            containerMinY = contextToolbarHeight;
        } else if (panelElement && panelElement.parentElement) {
            const parentStyle = getComputedStyle(panelElement.parentElement);
            containerMinY = parseInt(parentStyle.paddingTop) || 0;
        }
        if (panel.y < containerMinY) {
            panels.update(current => current.map(p => p.id === panel.id ? { ...p, y: containerMinY } : p));
        }
    });

    const resizeHandler = createResizeHandler(() => panel, (updater) => {
        updatePanelsById(panel.id, updater);
    });

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
        panels.update(current =>
            current.map(p =>
                p.id === panel.id
                    ? { ...p, x: initialX + dx, y: Math.max(initialY + dy, containerMinY) }
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

    function handleAppChange(event: CustomEvent) {
        updatePanelsById(panel.id, (p) => ({ ...p, appId: event.detail.selectedApp }));
    }

    function handleResizeStart(e: MouseEvent, edge: ResizeEdge) {
        resizeHandler.start(e, edge);
        window.addEventListener('mousemove', resizeHandler.move);
        window.addEventListener('mouseup', stopResize);
    }

    function stopResize() {
        resizeHandler.stop();
        window.removeEventListener('mousemove', resizeHandler.move);
        window.removeEventListener('mouseup', stopResize);
    }
</script>

<div bind:this={panelElement} class="absolute bg-white border-2 border-blue-500 rounded-lg transition-transform flex flex-col {isDragging ? 'cursor-grabbing' : ''}"
     style={`left: ${panel.x}px; top: ${panel.y}px; width: ${panel.width}px; height: ${panel.height}px; z-index: ${panel.zIndex};`}>

    <ResizeHandles onResizeStart={handleResizeStart} />

    <!-- Header Slot: Consumers can provide their own header.
         If not, a default header is shown with app registration and a close button. -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 select-none rounded-t-lg" on:pointerdown={handlePointerDown}>
        <slot name="header">
            <AppRegistration apps={mergedApps} selectedApp={panel.appId} on:change={handleAppChange} />
            <button on:click={closePanel}
                    class="p-1 hover:bg-gray-200 rounded-md transition-colors pointer-events-auto"
                    title="Close window"
                    aria-label="Close window">
                <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </slot>
    </div>

    <!-- Content Area: Render the component for the current app -->
    <div class="flex-1 overflow-auto" style={`height: ${panel.height - 40}px;`}>
        <svelte:component this={currentApp.component} />
    </div>
</div> 