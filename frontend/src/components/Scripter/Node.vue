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
          <button class="close-btn" @click.stop="close">×</button>
        </div>
  
        <div class="content">
          <!-- The node's main UI goes here—slot for now -->
          <slot />
        </div>
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
  </style>
  