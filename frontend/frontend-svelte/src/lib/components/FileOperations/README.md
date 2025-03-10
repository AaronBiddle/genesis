# FileOperations Component

A reusable file operations system for Svelte applications that provides a consistent interface for saving, loading, and deleting files, as well as directory management.

## Features

- Generic file operations service that can be used with any file type
- Configurable file dialog with directory navigation
- Type-safe interfaces for all operations
- Adapters for specific file types (e.g., chat files)
- Directory creation and management
- Consistent error handling

## Usage

### Basic Usage

```svelte
<script lang="ts">
  import { FileOperationsDialog, saveFile, loadFile, deleteFile } from '$lib/components/FileOperations';
  
  // Configuration
  let isDialogOpen = false;
  let dialogMode: 'save' | 'load' | 'delete' = 'save';
  let currentFilename = '';
  const fileType = 'my-file-type';
  
  // Handle file operations
  async function handleFileOperation(event) {
    const { filename, mode, fileType } = event.detail;
    
    try {
      if (mode === 'save') {
        const content = { /* your data */ };
        await saveFile(fileType, filename, content);
      } else if (mode === 'load') {
        const result = await loadFile(fileType, filename);
        if (result.success) {
          // Process loaded data
          console.log(result.data);
        }
      } else if (mode === 'delete') {
        await deleteFile(fileType, filename);
      }
    } catch (error) {
      console.error('File operation failed:', error);
    }
  }
</script>

<!-- File operations dialog -->
<FileOperationsDialog 
  bind:isOpen={isDialogOpen}
  bind:mode={dialogMode}
  {currentFilename}
  {fileType}
  on:submit={handleFileOperation}
/>

<!-- Buttons to open dialog -->
<button on:click={() => { dialogMode = 'save'; isDialogOpen = true; }}>
  Save File
</button>
<button on:click={() => { dialogMode = 'load'; isDialogOpen = true; }}>
  Load File
</button>
```

### Using Adapters

For specific file types, you can use the provided adapters:

```svelte
<script lang="ts">
  import { FileOperationsDialog } from '$lib/components/FileOperations';
  import { adapters } from '$lib/components/FileOperations';
  
  // Use the chat adapter
  const { CHAT_FILE_TYPE, chatFileConfig, saveChat, loadChat, deleteChat } = adapters;
  
  let isDialogOpen = false;
  let dialogMode = 'save';
  let currentFilename = '';
  
  // Handle file operations
  async function handleFileOperation(event) {
    const { filename, mode } = event.detail;
    
    try {
      if (mode === 'save') {
        await saveChat(filename, messages, settings);
      } else if (mode === 'load') {
        const data = await loadChat(filename);
        // Process loaded chat data
      } else if (mode === 'delete') {
        await deleteChat(filename);
      }
    } catch (error) {
      console.error('Chat file operation failed:', error);
    }
  }
</script>

<!-- File operations dialog using the chat adapter -->
<FileOperationsDialog 
  bind:isOpen={isDialogOpen}
  bind:mode={dialogMode}
  {currentFilename}
  fileType={CHAT_FILE_TYPE}
  config={chatFileConfig}
  on:submit={handleFileOperation}
/>
```

### Creating Custom Adapters

You can create custom adapters for your specific file types:

```typescript
// MyCustomAdapter.ts
import { saveFile, loadFile, deleteFile } from '$lib/components/FileOperations';
import type { FileOperationsConfig } from '$lib/components/FileOperations';

// File type for custom files
export const CUSTOM_FILE_TYPE = 'custom';

// Configuration for custom files
export const customFileConfig: FileOperationsConfig = {
  fileType: CUSTOM_FILE_TYPE,
  fileExtension: '.custom',
  dialogTitle: {
    save: 'Save Custom File',
    load: 'Load Custom File',
    delete: 'Delete Custom File'
  },
  validateFilename: (name) => {
    // Custom validation logic
    const valid = /^[a-zA-Z0-9_-]+$/.test(name);
    return {
      valid,
      message: valid ? '' : 'Filename can only contain letters, numbers, underscores, and hyphens'
    };
  }
};

// Custom save function
export async function saveCustomFile(filename: string, data: any) {
  // Format the data for your specific needs
  const content = {
    data,
    metadata: {
      createdAt: new Date().toISOString()
    }
  };
  
  return await saveFile(CUSTOM_FILE_TYPE, filename, content);
}

// Custom load function
export async function loadCustomFile(filename: string) {
  const result = await loadFile(CUSTOM_FILE_TYPE, filename);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to load custom file');
  }
  
  return result.data;
}

// Custom delete function
export async function deleteCustomFile(filename: string) {
  return await deleteFile(CUSTOM_FILE_TYPE, filename);
}
```

## API Reference

### Components

- `FileOperationsDialog` - A dialog component for file operations

### Services

- `saveFile` - Save data to a file
- `loadFile` - Load data from a file
- `listFiles` - List all files of a specific type
- `deleteFile` - Delete a file
- `getDirectoryContents` - Get the contents of a directory
- `createDirectory` - Create a new directory
- `deleteDirectory` - Delete a directory

### Types

- `FileOperationsConfig` - Configuration for file operations
- `FileData` - Data structure for file content
- `DirectoryContents` - Structure for directory contents
- `FileOperationResult` - Result of a file operation
- `FileOperationMode` - Mode of operation ('save', 'load', 'delete')
- `FileOperationEvent` - Event data for file operations

### Adapters

- Chat adapter - Adapter for chat files
  - `CHAT_FILE_TYPE` - File type for chat files
  - `chatFileConfig` - Configuration for chat files
  - `saveChat` - Save chat data
  - `loadChat` - Load chat data
  - `deleteChat` - Delete chat file 