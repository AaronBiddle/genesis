## Logger Usage

Import and use the logger in your Vue components:

First make sure the filename is listed in `@/components/Logger/namespaces.ts`, keep it alphabetical when adding.

```typescript
import { log } from "@/components/Logger/loggerStore";

// Basic logging
log("MyComponent.vue", "This is a regular message");

// Error logging
log("anotherComponent.ts", "Something went wrong", true);

// Logging with a window ID
log("MyComponent.vue", "Message related to specific window", false, 123); // windowId can be string or number
```

## Logging from Child Components (via props)

Components rendered within a `Window.vue` instance (like `DocumentEditor.vue` or `ChatApp.vue`) receive a `log` function via props. This version of the function automatically includes the `windowId` in the log entry.

Usage is identical to the standard `log` function, but you **do not** provide the `windowId` argument:

```typescript
// Inside a component that receives props from Window.vue
const props = defineProps<{
  log: (namespace: string, message: string, isError?: boolean) => void;
}>();

const NS = "MyChildComponent.vue";

// Basic logging (windowId is added automatically)
props.log(NS, "This message will have the window ID.");

// Error logging (windowId is added automatically)
props.log(NS, "Something went wrong here.", true);
```
