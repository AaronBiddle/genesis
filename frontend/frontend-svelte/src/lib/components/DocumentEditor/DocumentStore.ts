import { writable, derived, get } from 'svelte/store';
import { 
  saveDocument, 
  loadDocument, 
  createNewDocument,
  deleteDocument,
  type DocumentData 
} from '$lib/components/FileOperations/adapters';
import { logger } from '$lib/components/LogControlPanel/logger';

// Store registry to maintain singleton instances per panel
const documentStores: Record<string, ReturnType<typeof createDocumentStore>> = {};

// Get or create a document store for a specific panel
export function getDocumentStore(panelId: string) {
  if (!documentStores[panelId]) {
    documentStores[panelId] = createDocumentStore(panelId);
  }
  return documentStores[panelId];
}

function createDocumentStore(panelId: string) {
  const NAMESPACE = 'DocumentEditor/DocumentStore';
  
  // Create stores
  const content = writable('');
  const isEditing = writable(true);
  const filename = writable('');
  const metadata = writable<NonNullable<DocumentData['metadata']>>({
    title: '',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    tags: []
  });
  
  // Derived stores
  const displayFilename = derived(filename, $filename => {
    if (!$filename) return `Document ${panelId}`;
    // Extract just the filename without the path
    const parts = $filename.split(/[\/\\]/);
    return parts[parts.length - 1];
  });
  
  // Initialize with a new document
  function createNewDocumentFile() {
    logger('INFO', 'store', NAMESPACE, 'Creating new document');
    const newDoc = createNewDocument();
    content.set(newDoc.content);
    metadata.set(newDoc.metadata || {
      title: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      tags: []
    });
    filename.set('');
    isEditing.set(true);
    logger('INFO', 'store', NAMESPACE, 'New document created');
  }
  
  // Toggle between edit and preview modes
  function toggleMode() {
    isEditing.update(value => !value);
    const currentMode = get(isEditing) ? 'edit' : 'preview';
    logger('INFO', 'store', NAMESPACE, `Toggled to ${currentMode} mode`);
  }
  
  // Save the current document
  async function saveCurrentDocument(targetFilename: string) {
    try {
      logger('INFO', 'store', NAMESPACE, `Saving document: ${targetFilename}`);
      
      // Update metadata
      const currentMetadata = get(metadata);
      currentMetadata.modified = new Date().toISOString();
      if (!currentMetadata.title) {
        currentMetadata.title = targetFilename.replace(/\.md$/, '');
      }
      metadata.set(currentMetadata);
      
      const currentContent = get(content);
      
      const result = await saveDocument(targetFilename, currentContent, currentMetadata);
      
      if (result.success) {
        filename.set(targetFilename);
        logger('INFO', 'store', NAMESPACE, `Document saved successfully: ${targetFilename}`);
      }
      
      return result;
    } catch (error) {
      logger('ERROR', 'store', NAMESPACE, `Failed to save document: ${error}`);
      throw error;
    }
  }
  
  // Load a document
  async function loadDocumentFromFile(targetFilename: string) {
    try {
      logger('INFO', 'store', NAMESPACE, `Loading document from file: ${targetFilename}`);
      const documentData = await loadDocument(targetFilename);
      
      content.set(documentData.content);
      metadata.set(documentData.metadata || {
        title: targetFilename.replace(/\.md$/, ''),
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        tags: []
      });
      filename.set(targetFilename);
      
      // Start in preview mode when opening a document
      isEditing.set(false);
      
      logger('INFO', 'store', NAMESPACE, `Document loaded successfully: ${targetFilename}`);
      return { success: true };
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      logger('ERROR', 'store', NAMESPACE, `Failed to load document: ${errorMsg}`);
      throw error;
    }
  }
  
  // Delete a document
  async function deleteDocumentFile(targetFilename: string) {
    try {
      logger('INFO', 'store', NAMESPACE, `Deleting document: ${targetFilename}`);
      const result = await deleteDocument(targetFilename);
      
      if (result.success) {
        // If the deleted file was the current one, create a new document
        if (get(filename) === targetFilename) {
          createNewDocumentFile();
        }
        logger('INFO', 'store', NAMESPACE, `Document deleted successfully: ${targetFilename}`);
      }
      
      return result;
    } catch (error) {
      logger('ERROR', 'store', NAMESPACE, `Failed to delete document: ${error}`);
      throw error;
    }
  }
  
  // Initialize with a new document
  createNewDocumentFile();
  
  return {
    // Stores
    content,
    isEditing,
    filename,
    displayFilename,
    metadata,
    
    // Actions
    createNewDocumentFile,
    toggleMode,
    saveCurrentDocument,
    loadDocumentFromFile,
    deleteDocumentFile
  };
} 