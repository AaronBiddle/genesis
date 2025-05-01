import { defineAsyncComponent } from 'vue';
import type { Component } from 'vue';

// Lazily load the component for better performance
const SequenceComponent = defineAsyncComponent(() => import('./Sequence.vue'));

export interface NodeTypeDefinition {
  id: string;           // Unique identifier for the node type (e.g., 'sequence')
  title: string;        // Display name for the node type (e.g., 'Sequence')
  iconId: string;       // Identifier for the icon associated with this node type
  appComponent: Component; // The Vue component used to render this node type
  // Potentially add default window properties here later (width, height, etc.)
}

// Define the Sequence node type
export const sequenceNodeType: NodeTypeDefinition = {
  id: 'sequence',       // Matches the user request
  title: 'Sequence',      // Matches the user request
  iconId: 'sequence',     // Matches the user request
  appComponent: SequenceComponent, // Use the imported Sequence.vue
};

// You might later have a map or array of all node types
// export const nodeRegistry: Record<string, NodeTypeDefinition> = {
//   [sequenceNodeType.id]: sequenceNodeType,
//   // Add other node types here
// }; 