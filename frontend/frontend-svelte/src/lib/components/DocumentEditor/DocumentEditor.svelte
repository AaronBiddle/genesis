<script lang="ts">
  import { onMount } from 'svelte';
  import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
  import { 
    FileOperationsDialog
  } from '$lib/components/FileOperations';
  import {
    documentFileConfig
  } from '$lib/components/FileOperations/adapters';
  import { logger } from '$lib/components/LogControlPanel/logger';
  import DocumentEditorToolbar from './DocumentEditorToolbar.svelte';
  import { getDocumentStore } from './DocumentStore';

  // The panel ID is passed from MultiViewPanel
  export let panelId: string;

  const NAMESPACE = 'DocumentEditor/DocumentEditor';

  // Get the store for this specific document instance
  const documentStore = getDocumentStore(panelId);
  const {
    content,
    isEditing,
    filename,
    displayFilename,
    createNewDocumentFile,
    toggleMode,
    saveCurrentDocument,
    loadDocumentFromFile,
    deleteDocumentFile
  } = documentStore;
  
  // File operations dialog state
  let showFileDialog = false;
  let fileDialogMode: 'save' | 'load' | 'delete' = 'save';
  
  // Open file dialog for saving
  function openSaveDialog() {
    fileDialogMode = 'save';
    showFileDialog = true;
    logger('INFO', 'ui', NAMESPACE, 'Opened save document dialog');
  }

  // Open file dialog for loading
  function openLoadDialog() {
    fileDialogMode = 'load';
    showFileDialog = true;
    logger('INFO', 'ui', NAMESPACE, 'Opened load document dialog');
  }

  // Handle file operation completion
  async function handleFileOperation(event: CustomEvent) {
    logger('INFO', 'ui', NAMESPACE, `File operation event received: ${JSON.stringify(event.detail)}`);
    const { filename: selectedFilename, mode, success } = event.detail;
    
    if (success && selectedFilename) {
      try {
        if (mode === 'save') {
          await saveCurrentDocument(selectedFilename);
        } else if (mode === 'load') {
          await loadDocumentFromFile(selectedFilename);
        } else if (mode === 'delete') {
          await deleteDocumentFile(selectedFilename);
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        logger('ERROR', 'ui', NAMESPACE, `File operation failed: ${errorMsg}`);
        alert(`Operation failed: ${errorMsg}`);
      }
    } else {
      logger('WARN', 'ui', NAMESPACE, `File operation not successful or missing filename: ${JSON.stringify({ success, selectedFilename, mode })}`);
    }
    
    showFileDialog = false;
  }

  // Initialize with a new document
  onMount(() => {
    logger('INFO', 'ui', NAMESPACE, `DocumentEditor component mounted with panelId: ${panelId}`);
    // Note: Document is already initialized in the store
  });
</script>

<svelte:head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
</svelte:head>

<div class="document-editor h-full flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white">
  <!-- Toolbar -->
  <DocumentEditorToolbar 
    {panelId}
    filename={$displayFilename}
    isEditing={$isEditing}
    on:createNewDocument={createNewDocumentFile}
    on:openSaveDialog={openSaveDialog}
    on:openLoadDialog={openLoadDialog}
    on:toggleMode={toggleMode}
  />

  <!-- Editor/Preview Area -->
  <div class="flex-1 p-4 overflow-hidden">
    {#if $isEditing}
      <textarea 
        class="w-full h-full resize-none font-mono text-sm overflow-auto"
        bind:value={$content}
        placeholder=""
      ></textarea>
    {:else}
      <div class="markdown-preview bg-white h-full overflow-auto">
        <MarkdownRenderer content={$content} />
      </div>
    {/if}
  </div>

  <!-- File Operations Dialog -->
  {#if showFileDialog}
    <FileOperationsDialog
      isOpen={showFileDialog}
      mode={fileDialogMode}
      fileType={documentFileConfig.fileType}
      config={documentFileConfig}
      currentFilename={$filename}
      on:close={() => showFileDialog = false}
      on:fileOperation={handleFileOperation}
    />
  {/if}
</div>

<style>
  .document-editor {
    background-color: #f9f9f9;
  }
  
  textarea {
    font-family: 'Fira Code', 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace;
    line-height: 1.5;
    overflow: auto;
  }
  
  .markdown-preview {
    overflow-y: auto;
    padding-right: 0.5rem;
  }
</style> 