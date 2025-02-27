# MultiViewPanel

This folder contains the MultiViewPanel component and its related files for creating a resizable, draggable panel system using Svelte.

## Overview

The MultiViewPanel system allows you to create and manage multiple panels, each capable of rendering different app components. Panels are draggable and resizable, with proper stacking order and active panel management.

### Key Features:
- **Draggable and Resizable Panels:** Easily move and resize panels.
- **Stacking & Active Management:** Bring panels to the front when activated.
- **Optional Suggested Dimensions:** The `createPanel` function accepts optional `suggestedWidth` and `suggestedHeight` parameters which serve as hints for a preferred size (they do not override the default width and height immediately).

## How to Use

### Creating a Panel

The panel store (`panelStore.ts`) provides a `createPanel` function that creates a new panel. It accepts optional parameters for `suggestedWidth` and `suggestedHeight`. These parameters are stored in the panel object but do not change the default width (`400`) or height (`500`). Future enhancements might use these values to adjust panel behavior.

**Example usage in a Svelte component:**

```svelte
<script lang="ts">
  import { panels } from '$lib/components/MultiViewPanel/stores/panelStore';

  // Create a new panel using default dimensions
  const addPanel = () => {
    panels.createPanel();
  };

  // Create a new panel with suggested dimensions (these hints might be used later)
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

### App Registration Component

The `AppRegistration.svelte` component is responsible for allowing users to choose which app to load in a panel. It has been updated to accept optional `suggestedWidth` and `suggestedHeight` props. These props currently serve as future hints for preferred panel sizes and can be utilized later for more dynamic behavior.

## Folder Structure

- **stores/panelStore.ts:** Contains the panel store and the `createPanel` function. 
- **MultiViewPanel.svelte:** The Svelte component representing an individual panel. 
- **AppRegistration.svelte:** The component for selecting apps, now accepting optional suggested dimensions. 
- **MultiViewBackground.svelte:** The container component managing multiple panels. 
- **README.md:** This file.

## Summary

- The `createPanel` function accepts optional `suggestedWidth` and `suggestedHeight` parameters without altering the panel's default dimensions.
- Use an arrow function in event handlers (e.g. `on:click={() => panels.createPanel()}`) to avoid passing unintended parameters such as the click event.
- This pattern keeps business logic (panel creation) separate from UI events, which is a clean and reusable approach.

Feel free to extend and customize the MultiViewPanel system according to your application requirements. 