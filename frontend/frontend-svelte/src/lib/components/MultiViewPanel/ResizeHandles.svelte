<script lang="ts">
    export let onResizeStart: (e: PointerEvent, edge: 
        'top' | 'bottom' | 'left' | 'right' | 
        'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    ) => void;
</script>

<!-- Top Resize Handle -->
<div class="absolute -top-[4px] left-0 right-0 h-[6px] cursor-ns-resize z-10"
     role="presentation"
     on:pointerdown={e => { e.stopPropagation(); onResizeStart(e, 'top'); }}>
</div>

<!-- Left Resize Handle -->
<div class="absolute -left-[4px] top-0 bottom-0 w-[6px] cursor-ew-resize z-10"
     role="presentation"
     on:pointerdown={e => { e.stopPropagation(); onResizeStart(e, 'left'); }}>
</div>

<!-- Right Resize Handle -->
<div class="absolute -right-[4px] top-0 bottom-0 w-[6px] cursor-ew-resize z-10"
     role="presentation"
     on:pointerdown={e => { e.stopPropagation(); onResizeStart(e, 'right'); }}>
</div>

<!-- Top-Left Resize Handle -->
<div class="absolute -left-[6px] -top-[6px] w-[12px] h-[12px] cursor-nwse-resize z-10"
     role="presentation"
     on:pointerdown={e => { e.stopPropagation(); onResizeStart(e, 'top-left'); }}>
</div>

<!-- Top-Right Resize Handle -->
<div class="absolute -right-[6px] -top-[6px] w-[12px] h-[12px] cursor-nesw-resize z-10"
     role="presentation"
     on:pointerdown={e => { e.stopPropagation(); onResizeStart(e, 'top-right'); }}>
</div>

<!-- Bottom-Left Resize Handle -->
<div class="absolute -left-[6px] -bottom-[6px] w-[12px] h-[12px] cursor-nesw-resize z-10"
     role="presentation"
     on:pointerdown={e => { e.stopPropagation(); onResizeStart(e, 'bottom-left'); }}>
</div>

<!-- Bottom-Right Resize Handle -->
<div class="absolute -right-[6px] -bottom-[6px] w-[12px] h-[12px] cursor-nwse-resize z-10"
     role="presentation"
     on:pointerdown={e => { e.stopPropagation(); onResizeStart(e, 'bottom-right'); }}>
</div>

<!-- Bottom Resize Handle -->
<div class="absolute -bottom-[4px] left-0 right-0 h-[6px] cursor-ns-resize z-10"
     role="presentation"
     on:pointerdown={e => { e.stopPropagation(); onResizeStart(e, 'bottom'); }}>
</div> 