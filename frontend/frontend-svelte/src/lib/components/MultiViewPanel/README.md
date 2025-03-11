# MultiViewPanel

This folder contains the MultiViewPanel component and its related files for creating a resizable, draggable panel system using Svelte.

## Overview

The MultiViewPanel system allows you to create and manage multiple panels, each capable of rendering different app components. Panels are draggable and resizable, with proper stacking order and active panel management.

### Key Features:
- **Draggable and Resizable Panels:** Easily move and resize panels.
- **Stacking & Active Management:** Bring panels to the front when activated.
- **Suggested Dimensions:** Components can specify suggested dimensions, and users can apply these with the resize button.
- **Dynamic App Loading:** Switch between different app components within the same panel.

## How to Use

### Creating a New App Component

Any Svelte component can be used as an app within a panel. The component will receive a `panelId` prop that can be used to identify which panel it's rendered in.

**Example app component:**

```svelte
<script lang="ts">
  // The panelId is automatically passed to your component
  export let panelId: string;
  
  // Your component logic here
</script>

<div>
  <h2>My App Component</h2>
  <p>Panel ID: {panelId}</p>
  <!-- Your component UI here -->
</div>
```

### Registering Apps in +page.svelte

To make your app available in panels, you need to register it in your page component:

```svelte
<script lang="ts">
  import MultiViewPanel from '$lib/components/MultiViewPanel/MultiViewPanel.svelte';
  import MultiViewBackground from '$lib/components/MultiViewPanel/MultiViewBackground.svelte';
  import { panels } from '$lib/components/MultiViewPanel/panelStore';
  import MyNewComponent from '$lib/components/MyNewComponent.svelte';
  
  // Register all available app components
  const apps = [
    {
      id: 'my-app',           // Unique identifier
      label: 'My App',        // Display name in dropdown
      component: MyNewComponent,  // The Svelte component to render
      suggestedWidth: 600,    // Optional preferred width
      suggestedHeight: 400    // Optional preferred height
    },
    // Register other apps...
  ];
</script>

<div class="flex flex-col h-screen w-screen">
  <header>
    <button on:click={() => panels.createPanel()}>Add Panel</button>
  </header>
  <main class="flex-1 w-full overflow-hidden">
    <MultiViewBackground>
      {#each $panels as panel (panel.id)}
        <MultiViewPanel panel={panel} {apps} />
      {/each}
    </MultiViewBackground>
  </main>
</div>
```

### Creating a Panel

The panel store (`panelStore.ts`) provides a `createPanel` function that creates a new panel. It accepts optional parameters for `suggestedWidth` and `suggestedHeight`.

**Example usage in a Svelte component:**

```svelte
<script lang="ts">
  import { panels } from '$lib/components/MultiViewPanel/panelStore';

  // Create a new panel using default dimensions
  const addPanel = () => {
    panels.createPanel();
  };

  // Create a new panel with suggested dimensions
  // panels.createPanel(600, 400);
</script>

<button on:click={() => panels.createPanel()} aria-label="Add Panel">
  Add Panel
</button>
```

### Handling Click Events

Svelte automatically passes the click event to event handler functions. If you directly assign `on:click={panels.createPanel}`, the click event will be passed as the first parameter. Since `createPanel` accepts optional numbers, this causes a type mismatch.

**Accepted Pattern:** Wrap the call inside an arrow function:

```svelte
<button on:click={() => panels.createPanel()} aria-label="Add Panel">
  Add Panel
</button>
```

This prevents the click event from being mistakenly interpreted as a suggested width.

### Applying Suggested Sizes

Each panel has a resize button (icon with corners) in its header that applies the suggested dimensions of the current app. This allows users to quickly resize panels to dimensions that are appropriate for the specific app.

The `applySuggestedSize` function in `panelStore.ts` is used to apply these dimensions:

```typescript
// This happens automatically when the user clicks the resize button
applySuggestedSize(panelId, currentApp.suggestedWidth, currentApp.suggestedHeight);
```

## Panel Store Functions

The `panelStore.ts` file provides several functions for managing panels:

- `createPanel(suggestedWidth?, suggestedHeight?)`: Creates a new panel
- `updatePanelsById(id, updater)`: Updates a specific panel by ID
- `setActivePanel(id)`: Sets a panel as active
- `bringToFront(id)`: Brings a panel to the front of the stack
- `applySuggestedSize(id, width?, height?)`: Applies suggested dimensions to a panel

## Folder Structure

- **panelStore.ts:** Contains the panel store and panel management functions
- **MultiViewPanel.svelte:** The Svelte component representing an individual panel
- **ResizeHandles.svelte:** Component for panel resize handles
- **AppRegistration.svelte:** Component for selecting apps in a panel
- **MultiViewBackground.svelte:** The container component for multiple panels
- **resizeManager.ts:** Logic for handling panel resizing
- **types.ts:** TypeScript type definitions
- **EmptyPanel.svelte:** Default empty panel component
- **README.md:** This documentation file

## Summary

The MultiViewPanel system provides a flexible way to create and manage multiple panels in your application. By following the patterns described in this README, you can easily integrate it into your Svelte application and create custom app components that work within the panel system. 