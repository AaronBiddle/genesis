# File Services Cheat Sheet

A quick reference for using the centralized file-dialog API in **Window.vue**.

---

## 1 · Import & Inject

```ts
import { inject } from "vue";
import type { WindowBus } from "@/components/Window.vue";

const bus = inject<WindowBus>("windowBus")!;
```

---

## 2 · API Summary

### `bus.requestFile(opts)`

- **Returns**: `Promise<FileDialogResult>`
- **Behavior**: Opens File Manager, resolves on confirm/cancel.

```ts
interface FileDialogOptions {
  mode: "open" | "save";
  mimeFilter?: string[]; // e.g. ['application/json']
  suggestedName?: string; // e.g. 'untitled.json'
}

// Result
//  cancelled: true  ⟶ user closed dialog
//  cancelled: false ⟶ user selected mount/path/name
interface FileDialogResult {
  cancelled: boolean;
  mount?: string;
  path?: string;
  name?: string;
}
```

---

## 3 · Common Flows

### Open File

```ts
const res = await bus.requestFile({
  mode: "open",
  mimeFilter: ["application/json"],
});
if (!res.cancelled) {
  const text = await readFile(res.mount, `${res.path}/${res.name}`);
  // …load into state…
}
```

### Save-As File

```ts
const res = await bus.requestFile({
  mode: "save",
  suggestedName: currentName || "untitled.json",
});
if (!res.cancelled) {
  await writeFile(res.mount, `${res.path}/${res.name}`, content);
}
```

### Direct Save (if file known)

```ts
if (mount && path && name) {
  await writeFile(mount, `${path}/${name}`, content);
} else {
  // fallback to Save-As
}
```

---

## 4 · Tips

- **Cancellation**: Always check `res.cancelled` before proceeding.
- **Concurrency**: Multiple calls can run simultaneously; each has its own token.
- **MIME Filtering**: Pass relevant `mimeFilter` to grey out others.
- **Suggested Name**: Pre-fills filename input in Save dialog.
- **No Boilerplate**: No `newWindow` or `handleMessage` needed for file dialogs.

---

© 2025 Desktop Framework Quick Reference
