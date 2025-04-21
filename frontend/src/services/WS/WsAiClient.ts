import { createWebSocketClient } from './WsClientFactory';
import type { WsClient } from './WsClientFactory';

export const wsAiClient: WsClient = createWebSocketClient('/frontend/ws'); 