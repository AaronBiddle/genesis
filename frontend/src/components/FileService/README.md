# FileManager Component Usage

This document explains how to launch and interact with the `FileManager.vue` component from another Vue component within the WindowSystem.

## Overview

`FileManager.vue` provides a modal dialog for browsing files and directories within mounted storage points. It can be used for:

1.  **Opening a file:** The user selects an existing file.
2.  **Saving a file:** The user selects a directory and provides a filename.
3.  **General browsing:** (Mode: `none`, though less common interactively).

It relies on the `WindowManager` system provided by `Window.vue` (`props.newWindow`) to be launched and the `eventBus` system for communication back to the launching window (`props.sendParent` in `FileManager` -> `handleMessage` in the launcher).

## Launching FileManager

To launch the `FileManager`, call the `newWindow` function (typically passed down as a prop from `Window.vue`) with the `appId` `'file-manager'` and specify `launchOptions`.

```typescript
// Example within the calling component's script setup
const props = defineProps<{
  newWindow: (appId: string, launchOptions?: any) => void;
  // ... other props
}>();

function openFileManagerForOpening() {
  props.newWindow("file-manager", {
    mode: "open",
    initialMount: "userdata", // Optional: Starting mount point
    initialPath: "documents", // Optional: Starting directory within the mount
  });
}

function openFileManagerForSaving() {
  props.newWindow("file-manager", {
    mode: "save",
    initialMount: "userdata", // Optional
    initialPath: "documents", // Optional
  });
}
```

### Launch Options

The `launchOptions` object passed to `newWindow` controls `FileManager`'s behavior:

- `mode`: (Required) Sets the purpose of the file manager.
  - `'open'`: Shows an "Open" button. Requires the user to select an existing file.
  - `'save'`: Shows a "Save" button and filename input. Requires the user to specify a filename.
  - `'none'`: Basic file browsing (no primary confirm action).
- `initialMount`: (Optional) The name of the storage mount to display initially (e.g., `'userdata'`). Defaults to the first available mount if not specified or invalid.
- `initialPath`: (Optional) The starting directory path within the `initialMount`. Defaults to the root (`''`).

## Receiving the Result

The component launching `FileManager` must expose a `handleMessage` function. `FileManager` will call this function via the `eventBus` (using `sendParent`) when the user confirms an action (Open/Save) or cancels.

1.  **Expose `handleMessage`:**

    ```typescript
    // In the calling component's script setup
    import { ref } from "vue";

    interface FileMessagePayload {
      mode: "open" | "save";
      mount: string;
      path: string; // Directory path
      name?: string; // Filename (present in 'open' and 'save' confirmations)
    }

    interface FileMessage {
      type: "file";
      payload: FileMessagePayload;
    }

    async function handleMessage(senderId: number, message: FileMessage | any) {
      console.log(`Received message from window ${senderId}:`, message);

      if (message.type === "file" && message.payload) {
        const payload = message.payload as FileMessagePayload;

        if (payload.mode === "open" && payload.name) {
          console.log(
            `User selected file to open: Mount=${payload.mount}, Path=${payload.path}, Name=${payload.name}`
          );
          // Add logic here to read the file: readFile(payload.mount, `${payload.path}/${payload.name}`)
        } else if (payload.mode === "save" && payload.name) {
          console.log(
            `User selected location to save: Mount=${payload.mount}, Path=${payload.path}, Name=${payload.name}`
          );
          // Add logic here to write the file: writeFile(payload.mount, `${payload.path}/${payload.name}`, content)
        }
      }
    }

    defineExpose({ handleMessage });
    ```

2.  **Message Payload:**
    When the user clicks "Open" or "Save" in `FileManager`, it sends a message with `type: 'file'` and a `payload` object containing:
    - `mode`: `'open'` or `'save'`, indicating the action taken.
    - `mount`: The name of the selected storage mount.
    - `path`: The directory path where the action occurred.
    - `name`: The selected filename (for `open`) or the entered filename (for `save`).

**Note:** `FileManager` automatically closes itself after sending the confirmation message. No message is sent if the user clicks "Cancel", it simply closes.
