<script lang="ts">
  import { panels, setActivePanel, bringToFront, applySuggestedSize } from './panelStore';
  import type { Panel } from './panelStore';
  
  export let panelId: string;
  
  // Function to focus on a specific panel
  function focusPanel(id: string) {
    setActivePanel(id);
    bringToFront(id);
  }
  
  // Function to close a panel
  function closePanel(id: string) {
    panels.update(current => current.filter(p => p.id !== id));
  }
  
  // Get app name from appId
  function getAppName(appId: string): string {
    switch(appId) {
      case 'chatbox':
        return 'Chatbox';
      case 'document-editor':
        return 'Document Editor';
      case 'logcontrol':
        return 'Log Control';
      case 'worker-test':
        return 'Worker Test';
      case 'multiview-manager':
        return 'Window Manager';
      case 'empty':
        return 'Empty Panel';
      default:
        return appId;
    }
  }
</script>

<div class="flex flex-col h-full">
  <div class="p-4 bg-gray-50 rounded-md mb-4">
    <h2 class="text-xl font-semibold mb-2">Window Manager</h2>
    <p class="text-sm text-gray-600 mb-4">
      Manage all open windows in your workspace
    </p>
    <button 
      on:click={() => panels.createPanel()} 
      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
    >
      Create New Window
    </button>
  </div>
  
  <div class="flex-1 overflow-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr class="bg-gray-100">
          <th class="p-2 text-left">ID</th>
          <th class="p-2 text-left">Title</th>
          <th class="p-2 text-left">App</th>
          <th class="p-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each $panels as panel (panel.id)}
          <tr class="border-b border-gray-200 hover:bg-gray-50 {panel.active ? 'bg-blue-50' : ''}">
            <td class="p-2">{panel.id}</td>
            <td class="p-2">{panel.title}</td>
            <td class="p-2">{getAppName(panel.appId)}</td>
            <td class="p-2">
              <div class="flex space-x-2">
                <button 
                  on:click={() => focusPanel(panel.id)}
                  class="p-1 hover:bg-blue-100 rounded-md transition-colors"
                  title="Focus window"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                
                {#if panel.id !== panelId}
                  <button 
                    on:click={() => closePanel(panel.id)}
                    class="p-1 hover:bg-red-100 rounded-md transition-colors"
                    title="Close window"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  
  {#if $panels.length === 0}
    <div class="flex flex-col items-center justify-center p-8 text-gray-500">
      <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
      <p class="text-lg">No windows are currently open</p>
      <button 
        on:click={() => panels.createPanel()} 
        class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
      >
        Create First Window
      </button>
    </div>
  {/if}
</div> 