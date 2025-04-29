# Using the File‑Services Provided by **Window.vue**

> **Scope.** This guide explains how any desktop app window can invoke the global File‑Manager dialog through the promise‑based `windowBus.requestFile()` API exported by **Window.vue** (o3 desktop framework).

---

## 1 · Quick Start

```ts
import { inject } from "vue";
import type { WindowBus } from "@/components/Window.vue";

const bus = inject<WindowBus>("windowBus")!;

// 1 · OPEN a file
const res = await bus.requestFile({
  mode: "open",
  mimeFilter: ["text/markdown"],
});
if (!res.cancelled) {
  const text = await readFile(res.mount, `${res.path}/${res.name}`);
}

// 2 · SAVE‑AS a file
const target = await bus.requestFile({
  mode: "save",
  suggestedName: "untitled.md",
});
if (!target.cancelled) {
  await writeFile(target.mount, `${target.path}/${target.name}`, content);
}
```

That’s it—no `newWindow('file-manager', …)` and no `handleMessage` boilerplate.

---

## 2 · WindowBus API

| Method              | Signature                     | Description                                                        |
| ------------------- | ----------------------------- | ------------------------------------------------------------------ |
| `requestFile(opts)` | → `Promise<FileDialogResult>` | Opens File‑Manager and resolves when the user confirms or cancels. |

### 2.1 FileDialogOptions

```ts
interface FileDialogOptions {
  mode: "open" | "save"; // Dialog purpose
  mimeFilter?: string[]; // Optional whitelist (open only)
  suggestedName?: string; // Pre‑fill filename (save only)
}
```

### 2.2 FileDialogResult

```ts
// cancelled via close / Esc
{ cancelled: true }

// user picked a file or target
{
  cancelled: false,
  mount: string,   // e.g. 'userdata'
  path: string,    // directory path ("" = root)
  name: string,    // filename without slash
}
```

The internal `token` used for promise correlation is handled automatically; callers never see it.

---

## 3 · Usage Patterns

### 3.1 Open‑then‑Edit‑then‑Save

```ts
const file = await bus.requestFile({ mode: 'open' });
if (file.cancelled) return;

content.value = await readFile(file.mount, `${file.path}/${file.name}`);

… // user edits

// direct save when filename is known
await writeFile(file.mount, `${file.path}/${file.name}`, content.value);
```

### 3.2 Save‑As Flow When No Current Filename

```ts
if (!currentFileKnown) {
  const tgt = await bus.requestFile({
    mode: "save",
    suggestedName: "draft.txt",
  });
  if (tgt.cancelled) return;
  await writeFile(tgt.mount, `${tgt.path}/${tgt.name}`, data);
}
```

---

## 4 · How File‑Manager Communicates

- **Launch** – Window.vue spawns `newWindow('file-manager', { token, ...opts })`.
- **Response** – File‑Manager posts `{ type: 'file', payload: { token, cancelled?, … } }` to its parent via `eventBus`.
- **Dispatch** – The new message dispatcher inside Window.vue resolves the matching promise and swallows the event so your app never sees it.

You do **not** need to subscribe to `eventBus` for file replies.

---

## 5 · Error & Cancellation Handling

- **Cancellation** → promise resolves `{ cancelled: true }` – always check before proceeding.
- **I/O Errors** → happen in your call to `readFile` / `writeFile`; catch normally.

---

## 6 · Migrating Existing Apps

1. Delete old `openFileManager('open'|'save')` calls.
2. Remove `handleMessage()` that parsed `message.type === 'file'`.
3. Inject `windowBus` and use `requestFile()` as shown.
4. Optional: drop unused props (`newWindow`, `sendParent`, `getLaunchOptions`) from component signatures.

Each migration typically removes **~40 lines** of boilerplate per editor.

---

## 7 · FAQ

| Question                                  | Answer                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| _Can I queue multiple dialogs?_           | Yes. Each call produces a unique token and resolves independently.                                                 |
| _Can I restrict the user to `.png` only?_ | Pass `mimeFilter: ['image/png']`. File‑Manager will grey‑out non‑matching files.                                   |
| _What about drag‑and‑drop from OS?_       | Window.vue will soon capture drops and feed them through the same `requestFile()` promise; no API change required. |

---
