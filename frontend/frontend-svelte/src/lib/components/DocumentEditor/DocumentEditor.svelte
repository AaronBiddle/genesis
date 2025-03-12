<script lang="ts">
  import { onMount } from 'svelte';
  import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
  import { 
    FileOperationsDialog
  } from '$lib/components/FileOperations';
  import {
    documentFileConfig,
    saveDocument,
    loadDocument,
    deleteDocument,
    createNewDocument,
    type DocumentData
  } from '$lib/components/FileOperations/adapters';
  import { logger } from '$lib/components/LogControlPanel/logger';

  // The panel ID is passed from MultiViewPanel
  export let panelId: string;

  // Document state
  let content = '';
  let isEditing = true;
  let filename = '';
  let showFileDialog = false;
  let fileDialogMode: 'save' | 'load' | 'delete' = 'save';
  let documentMetadata: NonNullable<DocumentData['metadata']> = {
    title: '',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    tags: []
  };

  // Toggle between edit and preview modes
  function toggleMode() {
    isEditing = !isEditing;
    logger('INFO', 'ui', 'DocumentEditor', `Toggled to ${isEditing ? 'edit' : 'preview'} mode`);
  }

  // Open file dialog for saving
  function openSaveDialog() {
    fileDialogMode = 'save';
    showFileDialog = true;
    logger('INFO', 'ui', 'DocumentEditor', 'Opened save document dialog');
  }

  // Open file dialog for loading
  function openLoadDialog() {
    fileDialogMode = 'load';
    showFileDialog = true;
    logger('INFO', 'ui', 'DocumentEditor', 'Opened load document dialog');
  }

  // Handle file operation completion
  function handleFileOperation(event: CustomEvent) {
    logger('INFO', 'ui', 'DocumentEditor', `File operation event received: ${JSON.stringify(event.detail)}`);
    console.log('File operation event received:', event.detail);
    const { filename: selectedFilename, mode, success } = event.detail;
    
    if (success && selectedFilename) {
      if (mode === 'save') {
        saveDocumentToFile(selectedFilename);
      } else if (mode === 'load') {
        loadDocumentFromFile(selectedFilename);
      }
    } else {
      logger('WARN', 'ui', 'DocumentEditor', `File operation not successful or missing filename: ${JSON.stringify({ success, selectedFilename, mode })}`);
      console.warn('File operation not successful or missing filename', { success, selectedFilename, mode });
    }
    
    showFileDialog = false;
  }

  // Save the current document
  async function saveDocumentToFile(targetFilename: string) {
    try {
      logger('INFO', 'ui', 'DocumentEditor', `Saving document to file: ${targetFilename}`);
      // Update metadata
      documentMetadata.modified = new Date().toISOString();
      if (!documentMetadata.title) {
        documentMetadata.title = targetFilename.replace(/\.md$/, '');
      }
      
      const result = await saveDocument(targetFilename, content, documentMetadata);
      if (result.success) {
        filename = targetFilename;
        logger('INFO', 'ui', 'DocumentEditor', `Document saved successfully: ${targetFilename}`);
      }
    } catch (error) {
      logger('ERROR', 'ui', 'DocumentEditor', `Failed to save document: ${error}`);
      console.error('Failed to save document:', error);
    }
  }

  // Load a document
  async function loadDocumentFromFile(targetFilename: string) {
    try {
      logger('INFO', 'ui', 'DocumentEditor', `Loading document from file: ${targetFilename}`);
      console.log('Loading document from file:', targetFilename);
      const documentData = await loadDocument(targetFilename);
      console.log('Document loaded successfully:', documentData);
      content = documentData.content;
      documentMetadata = documentData.metadata || {
        title: targetFilename.replace(/\.md$/, ''),
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        tags: []
      };
      filename = targetFilename;
      logger('INFO', 'ui', 'DocumentEditor', `Document loaded successfully: ${targetFilename}`);
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      logger('ERROR', 'ui', 'DocumentEditor', `Failed to load document: ${errorMsg}`);
      console.error('Failed to load document:', error);
      // Display error to user
      alert(`Failed to load document: ${errorMsg}`);
    }
  }

  // Create a new document
  function createNewDocumentFile() {
    logger('INFO', 'ui', 'DocumentEditor', 'Creating new document');
    const newDoc = createNewDocument();
    content = newDoc.content;
    documentMetadata = newDoc.metadata || {
      title: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      tags: []
    };
    filename = '';
    logger('INFO', 'ui', 'DocumentEditor', 'New document created');
  }

  // Initialize with a new document
  onMount(() => {
    logger('INFO', 'ui', 'DocumentEditor', `DocumentEditor component mounted with panelId: ${panelId}`);
    createNewDocumentFile();
  });
</script>

<div class="document-editor h-full flex flex-col">
  <!-- Toolbar -->
  <div class="toolbar flex items-center justify-between p-2 bg-gray-100 border-b">
    <div class="flex items-center space-x-2">
      <button 
        class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        on:click={openSaveDialog}
      >
        Save
      </button>
      <button 
        class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        on:click={openLoadDialog}
      >
        Open
      </button>
      <button 
        class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
        on:click={createNewDocumentFile}
      >
        New
      </button>
      <span class="text-sm text-gray-600 ml-2">
        {filename ? filename : 'Untitled document'}
      </span>
    </div>
    <button 
      class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
      on:click={toggleMode}
    >
      {isEditing ? 'Preview' : 'Edit'}
    </button>
  </div>

  <!-- Editor/Preview Area -->
  <div class="flex-1 overflow-auto p-4">
    {#if isEditing}
      <textarea 
        class="w-full h-full p-2 border rounded resize-none font-mono text-sm"
        bind:value={content}
        placeholder="Start writing your document here..."
      ></textarea>
    {:else}
      <div class="markdown-preview bg-white p-4 border rounded h-full overflow-auto">
        <MarkdownRenderer content={content} />
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
      currentFilename={filename}
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
  }
</style> 