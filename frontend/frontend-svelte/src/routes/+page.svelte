<script lang="ts">
  import MultiViewPanel from '$lib/components/MultiViewPanel/MultiViewPanel.svelte';
  import MultiViewBackground from '$lib/components/MultiViewPanel/MultiViewBackground.svelte';
  import { panels } from '$lib/components/MultiViewPanel/panelStore';
  import Chatbox from '$lib/components/Chatbox/Chatbox.svelte';
  import WorkerRequestsTest from '$lib/components/WorkerRequestsTest.svelte';
  import LogControlPanel from '$lib/components/LogControlPanel/LogControlPanel.svelte';
  import DocumentEditor from '$lib/components/DocumentEditor/DocumentEditor.svelte';
  import MultiViewManager from '$lib/components/MultiViewPanel/MultiViewManager.svelte';

  // Register the app components to be available in the dropdown
  const apps = [
    {
      id: 'chatbox',
      label: 'Chatbox',
      component: Chatbox,
      suggestedWidth: 600,
      suggestedHeight: 840
    },    
    {
      id: 'document-editor',
      label: 'Document Editor',
      component: DocumentEditor,
      suggestedWidth: 800,
      suggestedHeight: 600
    },
    {
      id: 'logcontrol',
      label: 'Log Control',
      component: LogControlPanel,
      suggestedWidth: 500,
      suggestedHeight: 700
    },
    {
      id: 'multiview-manager',
      label: 'Window Manager',
      component: MultiViewManager,
      suggestedWidth: 800,
      suggestedHeight: 600
    },
    {
      id: 'worker-test',
      label: 'Worker Test',
      component: WorkerRequestsTest
    }
  ];
</script>

<div class="flex flex-col h-screen w-screen">
  <header class="flex items-center h-16 px-4 border-b border-gray-300">
    <button 
      on:click={() => panels.createPanel()} 
      class="rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200 hover:bg-gray-200" 
      aria-label="Add"
    >
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
