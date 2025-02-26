<script lang="ts">
  import MultiViewPanel from '$lib/components/MultiViewPanel/MultiViewPanel.svelte';
  import MultiViewBackground from '$lib/components/MultiViewPanel/MultiViewBackground.svelte';
  import { panels } from '$lib/components/MultiViewPanel/stores/panelStore';
  import CounterComponent from '$lib/components/CounterComponent.svelte';
  import NotesComponent from '$lib/components/NotesComponent.svelte';
  import WeatherComponent from '$lib/components/WeatherComponent.svelte';

  // Register the app components to be available in the dropdown
  const apps = [
    {
      id: 'counter',
      label: 'Counter',
      component: CounterComponent
    },
    {
      id: 'notes',
      label: 'Notes',
      component: NotesComponent
    },
    {
      id: 'weather',
      label: 'Weather',
      component: WeatherComponent
    }
  ];
</script>

<div class="flex flex-col h-screen w-screen">
  <header class="flex items-center h-16 px-4 border-b border-gray-300">
    <button on:click={panels.createPanel} class="bg-transparent border-0 cursor-pointer p-0" aria-label="Add">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
      </svg>
    </button>
  </header>
  <main class="flex-1 w-full overflow-auto">
    <MultiViewBackground>
      {#each $panels as panel (panel.id)}
        <MultiViewPanel panel={panel} {apps} />
      {/each}
    </MultiViewBackground>
  </main>
</div>
