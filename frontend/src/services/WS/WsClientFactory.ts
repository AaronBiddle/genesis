import { ref } from 'vue';
import type { Ref } from 'vue';
import { WebSocketStatus } from './types';
import type { InteractionCallback, InteractionMessage } from './types';

/**
 * Generic WebSocket client that multiplexes interactions over one socket.
 * Each outgoing frame includes a unique `request_id`; server echoes the id
 * on every incremental packet so we can route it to the correct callback.
 */

export interface WsClient {
  status: Ref<WebSocketStatus>;
  connect: () => Promise<void>;
  disconnect: () => void;
  startInteraction: (
    route: string,
    payload: any,
    cb: InteractionCallback
  ) => Promise<number | null>;
  stopInteraction: (id: number) => boolean;
}

export function createWebSocketClient(url: string): WsClient {
  let ws: WebSocket | null = null;
  const status = ref<WebSocketStatus>(WebSocketStatus.Disconnected);
  const interactions = new Map<number, InteractionCallback>();
  let nextId = 0;

  // -------------------------------------------------------------------
  // Connection helpers
  // -------------------------------------------------------------------

  async function connect(): Promise<void> {
    if (ws && ws.readyState <= WebSocket.OPEN) return; // already connecting/connected

    interactions.clear();
    nextId = 0;
    status.value = WebSocketStatus.Connecting;

    return new Promise((resolve, reject) => {
      ws = new WebSocket(url);

      ws.onopen = () => {
        status.value = WebSocketStatus.Connected;
        resolve();
      };

      ws.onerror = e => {
        status.value = WebSocketStatus.Error;
        reject(e);
      };

      ws.onclose = ev => {
        status.value = ev.wasClean
          ? WebSocketStatus.Disconnected
          : WebSocketStatus.Error;
        ws = null;
        interactions.clear();
        nextId = 0;
      };

      ws.onmessage = ev => {
        let msg: any;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          console.error('Invalid JSON:', ev.data);
          return;
        }

        // Route by request_id echoed from backend
        if (typeof msg.request_id === 'number') {
          const cb = interactions.get(msg.request_id);
          if (!cb) return;

          const im: InteractionMessage = {
            text: msg.text,
            thinking: msg.thinking,
            meta: msg.meta,
            error: msg.error,
          } as InteractionMessage;

          try {
            cb(im);
          } catch (err) {
            console.error('Interaction callback threw', err);
          }
        } else {
          // Unsolicited broadcast from server
          console.log('Broadcast:', msg);
        }
      };
    });
  }

  function disconnect() {
    if (ws) ws.close();
  }

  // -------------------------------------------------------------------
  // Interaction helpers
  // -------------------------------------------------------------------

  async function startInteraction(
    route: string,
    payload: any,
    cb: InteractionCallback
  ): Promise<number | null> {
    // Ensure connection
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      try {
        await connect();
      } catch (err) {
        console.error('WebSocket connection failed', err);
        return null;
      }
    }

    if (!ws) return null;

    const id = nextId++;
    interactions.set(id, cb);

    ws.send(
      JSON.stringify({
        request_id: id,
        route,
        payload,
      })
    );

    return id;
  }

  function stopInteraction(id: number): boolean {
    return interactions.delete(id);
  }

  return { status, connect, disconnect, startInteraction, stopInteraction };
}
