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
  import DocumentEditorToolbar from './DocumentEditorToolbar.svelte';

  // The panel ID is passed from MultiViewPanel
  export let panelId: string;

  const NAMESPACE = 'DocumentEditor/DocumentEditor';

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
    logger('INFO', 'ui', NAMESPACE, `Toggled to ${isEditing ? 'edit' : 'preview'} mode`);
  }

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
  function handleFileOperation(event: CustomEvent) {
    logger('INFO', 'ui', NAMESPACE, `File operation event received: ${JSON.stringify(event.detail)}`);
    const { filename: selectedFilename, mode, success } = event.detail;
    
    if (success && selectedFilename) {
      if (mode === 'save') {
        saveDocumentToFile(selectedFilename);
      } else if (mode === 'load') {
        loadDocumentFromFile(selectedFilename);
      }
    } else {
      logger('WARN', 'ui', NAMESPACE, `File operation not successful or missing filename: ${JSON.stringify({ success, selectedFilename, mode })}`);
    }
    
    showFileDialog = false;
  }

  // Save the current document
  async function saveDocumentToFile(targetFilename: string) {
    try {
      logger('INFO', 'ui', NAMESPACE, `Saving document to file: ${targetFilename}`);
      // Update metadata
      documentMetadata.modified = new Date().toISOString();
      if (!documentMetadata.title) {
        documentMetadata.title = targetFilename.replace(/\.md$/, '');
      }
      
      const result = await saveDocument(targetFilename, content, documentMetadata);
      if (result.success) {
        filename = targetFilename;
        logger('INFO', 'ui', NAMESPACE, `Document saved successfully: ${targetFilename}`);
      }
    } catch (error) {
      logger('ERROR', 'ui', NAMESPACE, `Failed to save document: ${error}`);
    }
  }

  // Load a document
  async function loadDocumentFromFile(targetFilename: string) {
    try {
      logger('INFO', 'ui', NAMESPACE, `Loading document from file: ${targetFilename}`);
      const documentData = await loadDocument(targetFilename);
      content = documentData.content;
      documentMetadata = documentData.metadata || {
        title: targetFilename.replace(/\.md$/, ''),
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        tags: []
      };
      filename = targetFilename;
      // Start in preview mode when opening a document
      isEditing = false;
      logger('INFO', 'ui', NAMESPACE, `Document loaded successfully: ${targetFilename}`);
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      logger('ERROR', 'ui', NAMESPACE, `Failed to load document: ${errorMsg}`);
      // Display error to user
      alert(`Failed to load document: ${errorMsg}`);
    }
  }

  // Create a new document
  function createNewDocumentFile() {
    logger('INFO', 'ui', NAMESPACE, 'Creating new document');
    const newDoc = createNewDocument();
    content = newDoc.content;
    documentMetadata = newDoc.metadata || {
      title: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      tags: []
    };
    filename = '';
    // Start in edit mode for new documents
    isEditing = true;
    logger('INFO', 'ui', NAMESPACE, 'New document created');
  }

  // Initialize with a new document
  onMount(() => {
    logger('INFO', 'ui', NAMESPACE, `DocumentEditor component mounted with panelId: ${panelId}`);
    createNewDocumentFile();
  });
</script>

<svelte:head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
</svelte:head>

<div class="document-editor h-full flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white">
  <!-- Toolbar -->
  <DocumentEditorToolbar 
    {panelId}
    {filename}
    {isEditing}
    on:createNewDocument={createNewDocumentFile}
    on:openSaveDialog={openSaveDialog}
    on:openLoadDialog={openLoadDialog}
    on:toggleMode={toggleMode}
  />

  <!-- Editor/Preview Area -->
  <div class="flex-1 p-4 overflow-hidden">
    {#if isEditing}
      <textarea 
        class="w-full h-full resize-none font-mono text-sm overflow-auto"
        bind:value={content}
        placeholder=""
      ></textarea>
    {:else}
      <div class="markdown-preview bg-white h-full overflow-auto">
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
    overflow: auto;
  }
  
  .markdown-preview {
    overflow-y: auto;
    padding-right: 0.5rem;
  }
</style> 