# WebSocket Service (`WS`)

This directory contains the modules related to WebSocket communication.

## `WsAiClient.ts`

This module initializes and exports a pre-configured WebSocket client (`WsAiClient`) specifically for interacting with the AI backend services.

The client connects to the WebSocket endpoint located at `/frontend/ws/chat` relative to the application's host.

### Importing the Client

```typescript
import { WsAiClient } from "@/services/WS/WsAiClient";
```

### Client Interface

The `WsAiClient` object provides the following properties and methods:

- **`status: Ref<WebSocketStatus>`**

  - A Vue reactive reference (`Ref`) indicating the current connection status.
  - Possible values are defined in `WebSocketStatus` (imported from `./types`).
  - Example: `console.log(WsAiClient.status.value);`

- **`connect: () => Promise<void>`**

  - Establishes the WebSocket connection.
  - Returns a `Promise` that resolves when the connection is successfully opened or rejects if an error occurs.
  - Automatically called when needed, but can be called manually to force a reconnection attempt.
  - Example: `await WsAiClient.connect();`

- **`disconnect: () => void`**

  - Closes the WebSocket connection if it is currently open.
  - Example: `WsAiClient.disconnect();`

- **`sendChatMessage: (payload: AiChatPayload, callback: InteractionCallback) => Promise<number | null>`**

  - Sends a chat message payload to the AI backend via WebSocket.
  - `payload`: The chat message data including model, messages, etc., as defined by the `AiChatPayload` interface.
  - `callback`: An `InteractionCallback` function (imported from `./types`) that will be called with incremental responses or the final result related to this interaction.
  - Returns a `Promise` that resolves to a unique `number` ID for the interaction if the message was sent successfully (i.e., connected), otherwise resolves to `null`.
  - Example:
    ```typescript
    const interactionId = await WsAiClient.sendChatMessage(
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello, AI!" }],
        stream: true,
      },
      (message) => {
        if (message.error) {
          console.error("Chat failed:", message.error);
        } else {
          console.log("Received text:", message.text);
        }
      }
    );
    if (interactionId === null) {
      console.error("Failed to start chat - not connected?");
    }
    ```

- **`cancelChat: (id: number) => boolean`**
  - Stops the client from listening for further responses related to a specific chat interaction ID.
  - `id`: The interaction ID returned by `sendChatMessage`.
  - Returns `true` if the interaction callback was successfully found and removed, `false` otherwise.
  - Example: `WsAiClient.cancelChat(interactionId);`

_(See `types.ts` for `WebSocketStatus` and `InteractionCallback` definitions, and `WsAiClient.ts` for `AiChatPayload` interface.)_
