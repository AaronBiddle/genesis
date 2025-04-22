import { ref } from 'vue';
import type { Ref } from 'vue';
import { WebSocketStatus } from './types';
import type { InteractionCallback, InteractionMessage } from './types';
import { log } from '@/components/Logger/loggerStore';

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
      log('WsClientFactory.ts', `WebSocket connecting... URL: ${ws.url}`);

      ws.onopen = () => {
        status.value = WebSocketStatus.Connected;
        if (ws) {
          log('WsClientFactory.ts', `WebSocket connected. URL: ${ws.url}`);
        }
        resolve();
      };

      ws.onerror = e => {
        status.value = WebSocketStatus.Error;
        if (ws) {
            log('WsClientFactory.ts', `WebSocket error. URL: ${ws.url}, Error: ${e}`, true);
        }
        reject(e);
      };

      ws.onclose = ev => {
        const clean = ev.wasClean;
        const currentWsUrl = ws?.url;
        status.value = clean
          ? WebSocketStatus.Disconnected
          : WebSocketStatus.Error;
        log('WsClientFactory.ts', `WebSocket closed. URL: ${currentWsUrl || url}, Code: ${ev.code}, Reason: ${ev.reason}, Clean: ${clean}`, !clean);
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
          log('WsClientFactory.ts', `Received invalid JSON over WebSocket. Data: ${ev.data}`, true);
          return;
        }
        log('WsClientFactory.ts', `WebSocket message received. Data: ${JSON.stringify(msg)}`);

        // Route by request_id echoed from backend
        if (typeof msg.request_id === 'number') {
          const cb = interactions.get(msg.request_id);
          if (!cb) {
            log('WsClientFactory.ts', `Received message for unknown interaction ID. Request ID: ${msg.request_id}`, true);
            return;
          }

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
            log('WsClientFactory.ts', `Interaction callback failed. Request ID: ${msg.request_id}, Error: ${err}`, true);
          }
        } else {
          // Unsolicited broadcast from server
          console.log('Broadcast:', msg);
          log('WsClientFactory.ts', `Received broadcast message. Data: ${JSON.stringify(msg)}`);
        }
      };
    });
  }

  function disconnect() {
    const currentWsUrl = ws?.url;
    if (ws) {
        log('WsClientFactory.ts', `Disconnecting WebSocket... URL: ${currentWsUrl}`);
        ws.close();
    } else {
        log('WsClientFactory.ts', `Disconnect called but WebSocket already null. Initial URL was: ${url}`);
    }
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
        log('WsClientFactory.ts', `WebSocket not open, attempting connect before starting interaction. Route: ${route}`);
        await connect();
      } catch (err) {
        console.error('WebSocket connection failed', err);
        log('WsClientFactory.ts', `WebSocket connection failed during startInteraction. Route: ${route}, Error: ${err}`, true);
        return null;
      }
    }

    if (!ws) {
        log('WsClientFactory.ts', `WebSocket is null after connection attempt in startInteraction. Route: ${route}`, true);
        return null;
    }

    const id = nextId++;
    interactions.set(id, cb);
    log('WsClientFactory.ts', `Starting interaction. ID: ${id}, Route: ${route}, Payload: ${JSON.stringify(payload)}`);

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
    const deleted = interactions.delete(id);
    if(deleted) {
        log('WsClientFactory.ts', `Stopping interaction listener. ID: ${id}`);
    } else {
        log('WsClientFactory.ts', `Attempted to stop non-existent interaction listener. ID: ${id}`, true);
    }
    return deleted;
  }

  return { status, connect, disconnect, startInteraction, stopInteraction };
}
