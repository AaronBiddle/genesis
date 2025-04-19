import { createWebSocketClient } from './WsClientFactory';
import type { WsClient } from './WsClientFactory';

const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${wsProtocol}//${window.location.host}/frontend/ws`;

export const wsAiClient: WsClient = createWebSocketClient(wsUrl); 