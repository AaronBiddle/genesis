import { ref } from 'vue';
import type { Ref } from 'vue';
import { WebSocketStatus } from './types';
import type { InteractionCallback, InteractionMessage } from './types';

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

  async function connect(): Promise<void> {
    if (ws && ws.readyState <= WebSocket.OPEN) return;
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
        // route by responseId
        if (typeof msg.responseId === 'number') {
          const cb = interactions.get(msg.responseId);
          if (cb) {
            const im: InteractionMessage = {
              data: msg.data,
              error: msg.error,
            };
            try { cb(im) } catch (err) {
              console.error('Callback error', err);
            }
          }
        } else {
          console.log('Broadcast:', msg);
        }
      };
    });
  }

  function disconnect() {
    if (ws) ws.close();
  }

  async function startInteraction(
    route: string,
    payload: any,
    cb: InteractionCallback
  ): Promise<number | null> {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected, attempting to connect...');
      try {
        await connect();
      } catch (error) {
        console.error('Connection failed:', error);
        return null;
      }
    }

    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error('Still not connected after attempt.');
        return null;
    }

    const id = nextId++;
    interactions.set(id, cb);
    ws.send(JSON.stringify({ requestId: id, route, payload }));
    return id;
  }

  function stopInteraction(id: number): boolean {
    return interactions.delete(id);
  }

  return { status, connect, disconnect, startInteraction, stopInteraction };
}
