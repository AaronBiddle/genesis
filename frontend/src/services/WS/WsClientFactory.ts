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

// Define the base URL for the WebSocket server
const WS_BASE_URL = 'ws://localhost:8000';

export function createWebSocketClient(relativePath: string): WsClient {
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
      // Ensure relativePath starts with /
      let formattedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

      const fullUrl = `${WS_BASE_URL}${formattedPath}`;
      ws = new WebSocket(fullUrl);
      log('WsClientFactory.ts', `WebSocket connecting... Base: ${WS_BASE_URL}, Path: ${formattedPath}, Full URL: ${ws.url}`);

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
        } else {
             log('WsClientFactory.ts', `WebSocket error before connection established. Intended URL: ${fullUrl}, Error: ${e}`, true);
        }
        reject(e);
      };

      ws.onclose = ev => {
        const clean = ev.wasClean;
        const currentWsUrl = ws?.url; // Capture URL before setting ws to null
        status.value = clean
          ? WebSocketStatus.Disconnected
          : WebSocketStatus.Error;
        log('WsClientFactory.ts', `WebSocket closed. URL: ${currentWsUrl || fullUrl}, Code: ${ev.code}, Reason: ${ev.reason}, Clean: ${clean}`, !clean);
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
        // Ensure relativePath starts with / and ends with / for logging consistency
        let formattedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
        log('WsClientFactory.ts', `Disconnect called but WebSocket already null. Intended Path: ${formattedPath}`);
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

    // Check if the payload contains the forbidden 'request_id' key
    if (typeof payload === 'object' && payload !== null && 'request_id' in payload) {
      const errorMsg = `Payload cannot contain reserved key 'request_id'. Interaction aborted.`;
      console.error(errorMsg, payload);
      log('WsClientFactory.ts', `${errorMsg} Route: ${route}`, true);
      return null; // Abort the interaction
    }

    const id = nextId++;
    interactions.set(id, cb);
    log('WsClientFactory.ts', `Starting interaction. ID: ${id}, Payload: ${JSON.stringify(payload)}`); // Route removed from log

    // Construct the flat message by merging the id and payload
    const messageToSend = {
        request_id: id,
        ...payload
    };

    ws.send(JSON.stringify(messageToSend));

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
