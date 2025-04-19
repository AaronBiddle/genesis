import { createWebSocketClient } from './WsClientFactory';
import type { WsClient } from './WsClientFactory';

export const wsAiClient: WsClient = createWebSocketClient('ws://127.0.0.1:8000/frontend/ws/'); 