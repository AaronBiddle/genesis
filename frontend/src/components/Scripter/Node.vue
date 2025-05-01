<template>
    <div
      class="node-window"
      :style="nodeStyle"
      @mousedown="handleFocus"
      @dblclick="toggleCollapse"
      @pointerdown="startDrag"
    >
      <!-- Title‑bar & Controls (hidden when collapsed) -->
      <template v-if="!isCollapsed">
        <div class="title-bar">
          <span class="title">{{ win.title }}</span>
          <button class="close-btn" @click.stop="close" title="Close">×</button>
        </div>
  
        <div class="content">
          <!-- The node's main UI goes here—slot for now -->
          <slot />
        </div>
  
        <!-- Resize Handles (only if resizable and not collapsed) -->
        <template v-if="win.resizable">
          <div class="resize-handle nw" @pointerdown.prevent.stop="startResize('nw', $event)"></div>
          <div class="resize-handle n" @pointerdown.prevent.stop="startResize('n', $event)"></div>
          <div class="resize-handle ne" @pointerdown.prevent.stop="startResize('ne', $event)"></div>
          <div class="resize-handle w" @pointerdown.prevent.stop="startResize('w', $event)"></div>
          <div class="resize-handle e" @pointerdown.prevent.stop="startResize('e', $event)"></div>
          <div class="resize-handle sw" @pointerdown.prevent.stop="startResize('sw', $event)"></div>
          <div class="resize-handle s" @pointerdown.prevent.stop="startResize('s', $event)"></div>
          <div class="resize-handle se" @pointerdown.prevent.stop="startResize('se', $event)"></div>
        </template>
      </template>
  
      <!-- Collapsed representation: just a green circle -->
      <div v-else class="shape" />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, type CSSProperties } from 'vue'
  import {
    bringToFront,
    moveWindow,
    closeWindow,
    updateWindowBounds,
  } from './scripterWindowStore'
  import type { ManagedWindow } from '@/components/WindowSystem/windowStoreFactory'
  
  interface ContainerBounds {
    left: number;
    top: number;
    width: number;
    height: number;
  }
  
  /* ------------------------------------------------------------------
   * Props
   * ------------------------------------------------------------------ */
  const props = defineProps<{
    win: ManagedWindow;
    containerBounds: ContainerBounds;
  }>()
  
  /* ------------------------------------------------------------------
   * Local reactive state
   * ------------------------------------------------------------------ */
  const isCollapsed = ref(false)
  
  function toggleCollapse() {
    isCollapsed.value = !isCollapsed.value
  }
  
  function handleFocus() {
    bringToFront(props.win.id)
  }
  
  function close() {
    closeWindow(props.win.id)
  }
  
  /* ------------------------------------------------------------------
   * Dragging support (simple MVP)
   * ------------------------------------------------------------------ */
  const nodeStyle = computed<CSSProperties>(() => ({
    left: `${props.win.x}px`,
    top: `${props.win.y}px`,
    width: isCollapsed.value ? '24px' : `${props.win.width}px`,
    height: isCollapsed.value ? '24px' : `${props.win.height}px`,
    zIndex: props.win.zIndex,
    position: 'absolute',
  }))
  
  let dragStart = { x: 0, y: 0 }
  
  function startDrag(e: PointerEvent) {
    if (isCollapsed.value) return // don't drag collapsed icons
    dragStart = {
      x: e.clientX - props.win.x,
      y: e.clientY - props.win.y,
    }
    window.addEventListener('pointermove', onDrag)
    window.addEventListener('pointerup', endDrag)
  }
  
  function onDrag(e: PointerEvent) {
    // Calculate proposed new position
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    // Get node dimensions (use actual size if collapsed)
    const nodeWidth = isCollapsed.value ? 24 : props.win.width;
    const nodeHeight = isCollapsed.value ? 24 : props.win.height;

    // Clamp position within container bounds
    const maxLeft = props.containerBounds.width - nodeWidth;
    const maxTop = props.containerBounds.height - nodeHeight;

    newX = Math.max(props.containerBounds.left, Math.min(newX, maxLeft));
    newY = Math.max(props.containerBounds.top, Math.min(newY, maxTop));

    // Ensure position is not negative if bounds start at 0
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    moveWindow(props.win.id, newX, newY);
  }
  
  function endDrag() {
    window.removeEventListener('pointermove', onDrag)
    window.removeEventListener('pointerup', endDrag)
  }
  
  /* ------------------------------------------------------------------
   * Resizing support
   * ------------------------------------------------------------------ */
  type ResizeDirection =
    | 'n' | 's' | 'e' | 'w'
    | 'nw' | 'ne' | 'sw' | 'se'
    | null;
  
  let resizeStart = { x: 0, y: 0, width: 0, height: 0, initialX: 0, initialY: 0 };
  let currentResizeDirection: ResizeDirection = null;
  
  function startResize(direction: ResizeDirection, e: PointerEvent) {
    // Prevent starting resize if already resizing or dragging something else
    // (This check might be refined based on overall event handling needs)
    if (currentResizeDirection) return;

    handleFocus(); // Bring to front when starting resize
    currentResizeDirection = direction;

    resizeStart = {
      x: e.clientX,
      y: e.clientY,
      width: props.win.width,
      height: props.win.height,
      initialX: props.win.x,
      initialY: props.win.y,
    };
    window.addEventListener('pointermove', onResize);
    window.addEventListener('pointerup', endResize);
  }
  
  function onResize(e: PointerEvent) {
    if (!currentResizeDirection) return;

    const dx = e.clientX - resizeStart.x;
    const dy = e.clientY - resizeStart.y;

    // --- 1. Calculate proposed geometry based purely on drag delta ---
    let proposedX = resizeStart.initialX;
    let proposedY = resizeStart.initialY;
    let proposedWidth = resizeStart.width;
    let proposedHeight = resizeStart.height;

    if (currentResizeDirection.includes('w')) {
      proposedWidth -= dx;
      proposedX += dx;
    }
    if (currentResizeDirection.includes('e')) {
      proposedWidth += dx;
    }
    if (currentResizeDirection.includes('n')) {
      proposedHeight -= dy;
      proposedY += dy;
    }
    if (currentResizeDirection.includes('s')) {
      proposedHeight += dy;
    }

    // --- 2. Enforce minimum dimensions ---
    const minW = props.win.minimumWidth ?? 0;
    const minH = props.win.minimumHeight ?? 0;

    if (proposedWidth < minW) {
      // If shrinking past min from left/right, adjust position accordingly
      if (currentResizeDirection.includes('w')) proposedX += proposedWidth - minW;
      proposedWidth = minW;
    }
    if (proposedHeight < minH) {
      // If shrinking past min from top/bottom, adjust position accordingly
      if (currentResizeDirection.includes('n')) proposedY += proposedHeight - minH;
      proposedHeight = minH;
    }

    // --- 3. Initialize final values ---
    let finalX = proposedX;
    let finalY = proposedY;
    let finalWidth = proposedWidth;
    let finalHeight = proposedHeight;

    // --- 4. Boundary Clamping ---
    // Clamp position first (mainly for left/top boundaries)
    if (finalX < 0) {
        // If moving/resizing left past boundary, adjust width and clamp X
        finalWidth += finalX; // Effectively finalWidth = finalWidth - Math.abs(finalX)
        finalX = 0;
    }
    if (finalY < 0) {
        // If moving/resizing top past boundary, adjust height and clamp Y
        finalHeight += finalY;
        finalY = 0;
    }

    // Clamp size based on clamped position and container dimensions
    if (finalX + finalWidth > props.containerBounds.width) {
        finalWidth = props.containerBounds.width - finalX;
    }
    if (finalY + finalHeight > props.containerBounds.height) {
        finalHeight = props.containerBounds.height - finalY;
    }

    // --- 5. Final check: Ensure minimum dimensions after all clamping ---
    finalWidth = Math.max(minW, finalWidth);
    finalHeight = Math.max(minH, finalHeight);

    // --- 6. Update store ---
    // Prevent updates if dimensions are invalid (e.g., negative due to extreme clamping)
    if (finalWidth >= minW && finalHeight >= minH) {
         updateWindowBounds(props.win.id, finalX, finalY, finalWidth, finalHeight);
    }
  }
  
  function endResize() {
    if (!currentResizeDirection) return;
    currentResizeDirection = null;
    window.removeEventListener('pointermove', onResize);
    window.removeEventListener('pointerup', endResize);
  }
  </script>
  
  <style scoped>
  .node-window {
    border: 1px solid #7ebf73;
    border-radius: 6px;
    background: #ffffff;
    user-select: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
  }
  
  /* ──────────────────────────────────────────────────────────────── */
  /* Expanded state styling                                           */
  /* ──────────────────────────────────────────────────────────────── */
  .title-bar {
    height: 24px;
    background: #7ebf73;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 6px;
    cursor: grab;
    font-size: 12px;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
  }
  
  .title {
    pointer-events: none;
  }
  
  .close-btn {
    background: transparent;
    border: none;
    color: #fff;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
  }
  
  .content {
    padding: 8px;
    font-size: 14px;
  }
  
  /* ──────────────────────────────────────────────────────────────── */
  /* Collapsed state styling                                          */
  /* ──────────────────────────────────────────────────────────────── */
  .shape {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #7ebf73; /* Green circle */
  }
  
  .resize-handle {
    position: absolute;
    /* Define size and visual appearance (can be invisible) */
    width: 10px;
    height: 10px;
    /* background: rgba(255, 0, 0, 0.2); /* uncomment for debugging */
    z-index: 10; /* Ensure they are clickable */
  }
  
  /* Positioning for each handle */
  .resize-handle.n { top: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; width: calc(100% - 10px); /* Make edge handles wider */ }
  .resize-handle.s { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; width: calc(100% - 10px); }
  .resize-handle.w { left: -5px; top: 50%; transform: translateY(-50%); cursor: ew-resize; height: calc(100% - 10px); /* Make edge handles taller */ }
  .resize-handle.e { right: -5px; top: 50%; transform: translateY(-50%); cursor: ew-resize; height: calc(100% - 10px); }
  .resize-handle.nw { top: -5px; left: -5px; cursor: nwse-resize; }
  .resize-handle.ne { top: -5px; right: -5px; cursor: nesw-resize; }
  .resize-handle.sw { bottom: -5px; left: -5px; cursor: nesw-resize; }
  .resize-handle.se { bottom: -5px; right: -5px; cursor: nwse-resize; }
  </style>
  