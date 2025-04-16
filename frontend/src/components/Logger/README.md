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
