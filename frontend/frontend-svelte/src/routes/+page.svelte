<script lang="ts">
  import MultiViewPanel from '$lib/components/MultiViewPanel/MultiViewPanel.svelte';
  import MultiViewBackground from '$lib/components/MultiViewPanel/MultiViewBackground.svelte';
  import { panels } from '$lib/components/MultiViewPanel/panelStore';
  import CounterComponent from '$lib/components/CounterComponent.svelte';
  import NotesComponent from '$lib/components/NotesComponent.svelte';
  import WeatherComponent from '$lib/components/WeatherComponent.svelte';
  import ChatboxComponent from '$lib/components/ChatboxComponent/ChatboxComponent.svelte';
  import WorkerRequestsTest from '$lib/components/WorkerRequestsTest.svelte';
  import LogControlPanel from '$lib/components/LogControlPanel/LogControlPanel.svelte';

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
    },
    {
      id: 'chatbox',
      label: 'Chatbox',
      component: ChatboxComponent
    },
    {
      id: 'worker-test',
      label: 'Worker Test',
      component: WorkerRequestsTest
    },
    {
      id: 'logcontrol',
      label: 'Log Control',
      component: LogControlPanel,
      suggestedWidth: 500,
      suggestedHeight: 700
    }
  ];
</script>

<div class="flex flex-col h-screen w-screen">
  <header class="flex items-center h-16 px-4 border-b border-gray-300">
    <button on:click={() => panels.createPanel()} class="bg-transparent border-0 cursor-pointer p-0" aria-label="Add">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
      </svg>
    </button>
  </header>
  <main class="flex-1 w-full overflow-hidden">
    <MultiViewBackground>
      {#each $panels as panel (panel.id)}
        <MultiViewPanel panel={panel} {apps} />
      {/each}
    </MultiViewBackground>
  </main>
</div>
