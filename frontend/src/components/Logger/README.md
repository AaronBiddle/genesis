## Logger Usage

Import and use the logger in your Vue components:

```typescript
import { log } from "./loggerStore";

// Basic logging
log("MyComponent.vue", "This is a regular message");

// Error logging
log("anotherComponent.ts", "Something went wrong", true);
```
