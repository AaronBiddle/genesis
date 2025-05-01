<!-- NodeWindow.vue -->
<template>
  <div
    class="node-window"
    :style="nodeStyle"
    @mousedown="bringToFront(win.id)"
    @dblclick="toggleCollapse"
  >
    <!-- Expanded --------------------------------------------------->
    <template v-if="!isCollapsed">
      <div class="title-bar" @pointerdown.prevent="startDrag">
        <span class="title">{{ win.title }}</span>
        <button class="close-btn" @click.stop="close" title="Close">×</button>
      </div>

      <div class="content">
        <slot />
      </div>

      <!-- Resize handles -->
      <template v-if="win.resizable">
        <div
          v-for="dir in directions"
          :key="dir"
          class="resize-handle"
          :class="dir"
          @pointerdown.prevent.stop="startResize(dir, $event)"
        />
      </template>
    </template>

    <!-- Collapsed --------------------------------------------------->
    <div v-else class="shape" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRefs } from 'vue'
import {
  bringToFront,
  moveWindow,
  closeWindow,
  updateWindowBounds,
} from './scripterWindowStore'
import type { ManagedWindow } from '@/components/WindowSystem/windowStoreFactory'

interface ContainerBounds {
  left: number
  top: number
  width: number
  height: number
}

/* ------------------------------------------------------------------ */
/* Props & local state                                                */
/* ------------------------------------------------------------------ */
const props = defineProps<{
  win: ManagedWindow
  containerBounds: ContainerBounds
}>()

const { win } = toRefs(props)           // convenient shorthand
const isCollapsed = ref(false)

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function close() {
  closeWindow(win.value.id)
}

/* ------------------------------------------------------------------ */
/* Style                                                              */
/* ------------------------------------------------------------------ */
const nodeStyle = computed(() => ({
  position: 'absolute',
  left:  `${win.value.x}px`,
  top:   `${win.value.y}px`,
  width:  isCollapsed.value ? '24px' : `${win.value.width}px`,
  height: isCollapsed.value ? '24px' : `${win.value.height}px`,
  zIndex: win.value.zIndex,
}) as const)

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val))

function applyBounds(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const { left, top, width: cw, height: ch } = props.containerBounds
  const maxX = cw - width
  const maxY = ch
  return {
    x: clamp(x, left, maxX),
    y: clamp(y, top, maxY),
    width: clamp(width,  win.value.minimumWidth  ?? 0, cw),
    height: clamp(height, win.value.minimumHeight ?? 0, ch),
  }
}

/* ------------------------------------------------------------------ */
/* Drag logic                                                         */
/* ------------------------------------------------------------------ */
let dragOffsetX = 0
let dragOffsetY = 0

function startDrag(e: PointerEvent) {
  if (isCollapsed.value) return
  dragOffsetX = e.clientX - win.value.x
  dragOffsetY = e.clientY - win.value.y
  window.addEventListener('pointermove', onDrag)
  window.addEventListener('pointerup', endDrag)
}

function onDrag(e: PointerEvent) {
  const proposedX = e.clientX - dragOffsetX;
  const proposedY = e.clientY - dragOffsetY;
  const nodeWidth = win.value.width; // Size is fixed during drag

  const { left, top, width: cw, height: ch } = props.containerBounds;
  const minVisible = 20; // Pixels to keep visible on left, right, bottom

  // Calculate clamping bounds for position based on visibility
  const minX = left + minVisible - nodeWidth;
  const maxX = left + cw - minVisible;
  const minY = top; // Top edge can't go above container top (0)
  const maxY = top + ch - minVisible; // Keep at least minVisible from bottom

  const clampedX = clamp(proposedX, minX, maxX);
  const clampedY = clamp(proposedY, minY, maxY);

  moveWindow(win.value.id, clampedX, clampedY);
}

function endDrag() {
  window.removeEventListener('pointermove', onDrag)
  window.removeEventListener('pointerup', endDrag)
}

/* ------------------------------------------------------------------ */
/* Resize logic                                                       */
/* ------------------------------------------------------------------ */
type Dir = 'n'|'s'|'e'|'w'|'nw'|'ne'|'sw'|'se'
const directions: Dir[] = ['nw','n','ne','w','e','sw','s','se']

let resizeDir: Dir | null = null
let startX = 0, startY = 0
let startW = 0, startH = 0
let startLeft = 0, startTop = 0

function startResize(dir: Dir, e: PointerEvent) {
  resizeDir = dir
  startX = e.clientX
  startY = e.clientY
  startW = win.value.width
  startH = win.value.height
  startLeft = win.value.x
  startTop  = win.value.y
  window.addEventListener('pointermove', onResize)
  window.addEventListener('pointerup', endResize)
}

function onResize(e: PointerEvent) {
  if (!resizeDir) return

  let dx = e.clientX - startX
  let dy = e.clientY - startY

  let newLeft = startLeft
  let newTop  = startTop
  let newW    = startW
  let newH    = startH

  if (resizeDir.includes('w')) { newLeft += dx; newW -= dx }
  if (resizeDir.includes('e')) { newW += dx }
  if (resizeDir.includes('n')) { newTop  += dy; newH -= dy }
  if (resizeDir.includes('s')) { newH += dy }

  const bounded = applyBounds(newLeft, newTop, newW, newH)
  updateWindowBounds(win.value.id, bounded.x, bounded.y, bounded.width, bounded.height)
}

function endResize() {
  resizeDir = null
  window.removeEventListener('pointermove', onResize)
  window.removeEventListener('pointerup', endResize)
}
</script>

<style scoped>
.node-window {
  border: 1px solid #7ebf73;
  border-radius: 6px;
  background: #ffffff;
  user-select: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
}

/* Expanded state styling */
.title-bar {
  height: 24px;
  background: #7ebf73;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  font-size: 12px;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  flex-shrink: 0;
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
  flex-grow: 1;
  overflow: auto;
  min-height: 30px;
}

/* Collapsed state styling */
.shape {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #7ebf73;
}

.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  z-index: 10;
}

/* Positioning for each handle */
.resize-handle.n { top: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; width: calc(100% - 10px); height: 10px; }
.resize-handle.s { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; width: calc(100% - 10px); height: 10px; }
.resize-handle.w { left: -5px; top: 50%; transform: translateY(-50%); cursor: ew-resize; height: calc(100% - 10px); width: 10px; }
.resize-handle.e { right: -5px; top: 50%; transform: translateY(-50%); cursor: ew-resize; height: calc(100% - 10px); width: 10px; }
.resize-handle.nw { top: -5px; left: -5px; cursor: nwse-resize; width: 10px; height: 10px; }
.resize-handle.ne { top: -5px; right: -5px; cursor: nesw-resize; width: 10px; height: 10px; }
.resize-handle.sw { bottom: -5px; left: -5px; cursor: nesw-resize; width: 10px; height: 10px; }
.resize-handle.se { bottom: -5px; right: -5px; cursor: nwse-resize; width: 10px; height: 10px; }
</style>
