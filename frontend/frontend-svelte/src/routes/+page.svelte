<script lang="ts">
  import MultiViewPanel from '$lib/MultiViewPanel/MultiViewPanel.svelte';
  import type { Panel } from '$lib/MultiViewPanel/stores/panelStore';
  let panelCount: number = 0;
  let panels: Panel[] = [];

  function addPanel(): void {
    const newPanel: Panel = {
      id: panelCount.toString(),
      x: 50,
      y: 50,
      width: 300,
      height: 200,
      zIndex: panelCount,
      title: `Panel ${panelCount}`,
      active: false
    };
    panels = [...panels, newPanel];
    panelCount += 1;
  }
</script>

<div class="flex flex-col h-screen w-screen">
  <header class="flex items-center h-16 px-4 border-b border-gray-300">
    <button on:click={addPanel} class="bg-transparent border-0 cursor-pointer p-0" aria-label="Add">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
      </svg>
    </button>
  </header>
  <main class="flex-1 bg-[#e0e0e0] w-full overflow-auto">
    {#each panels as panel (panel.id)}
      <MultiViewPanel panel={panel} />
    {/each}
  </main>
</div>
