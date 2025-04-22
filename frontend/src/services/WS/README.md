# WebSocket Service (`WS`)

This directory contains the modules related to WebSocket communication.

## `WsAiClient.ts`

This module initializes and exports a pre-configured WebSocket client (`wsAiClient`) specifically for interacting with the AI backend services.

The client connects to the WebSocket endpoint located at `/frontend/ws` relative to the application's host.

### Importing the Client

```typescript
import { wsAiClient } from "@/services/WS/WsAiClient";
```

### Client Interface

The `wsAiClient` object provides the following properties and methods:

- **`status: Ref<WebSocketStatus>`**

  - A Vue reactive reference (`Ref`) indicating the current connection status.
  - Possible values are defined in `WebSocketStatus` (imported from `./types`).
  - Example: `console.log(wsAiClient.status.value);`

- **`connect: () => Promise<void>`**

  - Establishes the WebSocket connection.
  - Returns a `Promise` that resolves when the connection is successfully opened or rejects if an error occurs.
  - Automatically called when needed, but can be called manually to force a reconnection attempt.
  - Example: `await wsAiClient.connect();`

- **`disconnect: () => void`**

  - Closes the WebSocket connection if it is currently open.
  - Example: `wsAiClient.disconnect();`

- **`startInteraction: (route: string, payload: any, cb: InteractionCallback) => Promise<number | null>`**

  - Sends a message to the server to initiate a specific interaction.
  - `route`: A string identifying the target handler on the server.
  - `payload`: The data/message to send to the server.
  - `cb`: An `InteractionCallback` function (imported from `./types`) that will be called with responses or errors related to this interaction.
  - Returns a `Promise` that resolves to a unique `number` ID for the interaction if the message was sent successfully (i.e., connected), otherwise resolves to `null`.
  - Example:
    ```typescript
    const interactionId = await wsAiClient.startInteraction(
      "process_data",
      { image: imageData },
      (message) => {
        if (message.error) {
          console.error("Interaction failed:", message.error);
        } else {
          console.log("Received text:", message.text);
        }
      }
    );
    if (interactionId === null) {
      console.error("Failed to start interaction - not connected?");
    }
    ```

- **`stopInteraction: (id: number) => boolean`**
  - Stops the client from listening for further responses related to a specific interaction ID.
  - `id`: The interaction ID returned by `startInteraction`.
  - Returns `true` if the interaction callback was successfully found and removed, `false` otherwise.
  - Example: `wsAiClient.stopInteraction(interactionId);`

_(See `types.ts` for `WebSocketStatus` and `InteractionCallback` definitions.)_
