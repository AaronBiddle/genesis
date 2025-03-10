# Migration Guide: File Operations Component

This guide explains how to migrate from the old file operations implementation to the new reusable FileOperations component.

## Overview of Changes

We've refactored the file operations functionality from the ChatboxComponent into a separate, reusable component. This provides several benefits:

- Reusable file operations across different components
- Consistent UI and behavior for file operations
- Type-safe interfaces for all operations
- Extensible adapter pattern for different file types

## Migration Steps

### 1. Update Imports

Replace imports from the old FileOperationsService with imports from the new FileOperations component:

```typescript
// Old imports
import { saveChat, loadChat, deleteChat } from './FileOperationsService';
import FileOperationsDialog from './FileOperationsDialog.svelte';

// New imports
import { FileOperationsDialog } from '$lib/components/FileOperations';
import { adapters } from '$lib/components/FileOperations';
// Or import directly from the adapter if you prefer
import { saveChat, loadChat, deleteChat } from '$lib/components/FileOperations/adapters/ChatAdapter';
```

### 2. Update Component Usage

Update your component to use the new FileOperationsDialog:

```svelte
<!-- Old usage -->
<FileOperationsDialog 
    bind:isOpen={showFileDialog}
    bind:mode={fileDialogMode}
    currentFilename={$currentFilename}
    on:submit={handleFileOperation}
/>

<!-- New usage -->
<FileOperationsDialog 
    bind:isOpen={showFileDialog}
    bind:mode={fileDialogMode}
    currentFilename={$currentFilename}
    fileType={adapters.CHAT_FILE_TYPE}
    config={adapters.chatFileConfig}
    on:submit={handleFileOperation}
/>
```

### 3. Update File Operation Functions

Update your file operation functions to handle the new return types:

```typescript
// Old implementation
async function saveCurrentChat(filename: string): Promise<void> {
    try {
        isLoading.set(true);
        await saveChat(filename, currentMessages, currentSettings);
        currentFilename.set(filename);
    } catch (error) {
        // Error handling
    } finally {
        isLoading.set(false);
    }
}

// New implementation
async function saveCurrentChat(filename: string): Promise<void> {
    try {
        isLoading.set(true);
        const result = await saveChat(filename, currentMessages, currentSettings);
        
        if (result.success) {
            currentFilename.set(filename);
        } else {
            throw new Error(result.error || 'Failed to save chat');
        }
    } catch (error) {
        // Error handling
    } finally {
        isLoading.set(false);
    }
}
```

### 4. Creating Custom Adapters

If you need to support a new file type, create a custom adapter:

1. Create a new file in `src/lib/components/FileOperations/adapters/`
2. Define your adapter functions and configuration
3. Export your adapter from `adapters/index.ts`

Example:

```typescript
// MyCustomAdapter.ts
import { saveFile, loadFile, deleteFile } from '../FileOperationsService';
import type { FileOperationsConfig } from '../types';

export const CUSTOM_FILE_TYPE = 'custom';

export const customFileConfig: FileOperationsConfig = {
    fileType: CUSTOM_FILE_TYPE,
    fileExtension: '.custom',
    dialogTitle: {
        save: 'Save Custom File',
        load: 'Load Custom File',
        delete: 'Delete Custom File'
    }
};

export async function saveCustomFile(filename: string, data: any) {
    // Implementation
}

export async function loadCustomFile(filename: string) {
    // Implementation
}

export async function deleteCustomFile(filename: string) {
    // Implementation
}
```

Then update `adapters/index.ts`:

```typescript
// Add to adapters/index.ts
export {
    CUSTOM_FILE_TYPE,
    customFileConfig,
    saveCustomFile,
    loadCustomFile,
    deleteCustomFile
} from './MyCustomAdapter';
```

## Common Issues

### 1. Error Handling

The new component returns a `FileOperationResult` object with `success` and `error` properties. Make sure to check the `success` property before proceeding.

### 2. File Types

Always specify the `fileType` when using the FileOperationsDialog. This is required for the component to work correctly.

### 3. Configuration

The `config` property is optional but recommended for customizing the dialog. Use the predefined configurations from the adapters when possible.

## Need Help?

If you encounter any issues during migration, please refer to the examples in the `examples` directory or the README.md file for more information. 