<script lang="ts">
  // Removed toolbarHeight prop and onMount; no extra top padding applied
</script>

<div class="multi-view-background" style="position: relative; width: 100%; height: 100%;">
    <slot></slot>
</div>

<style>
  .multi-view-background {
    background-color: #f0f0f0; /* or any default background color you prefer */
  }
</style> 