import { ref } from 'vue';
import type { InteractionMessage } from './types';
import { wsAiClient } from './WsAiClient';

export interface WSOutgoingEntry {
  timestamp: Date;
  route: string;
  payload: any;
}

export interface WSIncomingEntry {
  timestamp: Date;
  message: InteractionMessage;
}

export const wsSendLog = ref<WSOutgoingEntry[]>([]);
export const wsReceiveLog = ref<WSIncomingEntry[]>([]);

// Wrap the existing startInteraction to capture logs
const originalStartInteraction = wsAiClient.startInteraction.bind(wsAiClient);
wsAiClient.startInteraction = async (
  route: string,
  payload: any,
  cb: (message: InteractionMessage) => void
): Promise<number | null> => {
  // Log outgoing message
  wsSendLog.value.push({ timestamp: new Date(), route, payload });
  // Wrap the callback to log incoming messages
  const wrappedCb = (message: InteractionMessage) => {
    wsReceiveLog.value.push({ timestamp: new Date(), message });
    cb(message);
  };
  // Invoke the original startInteraction with wrapped callback
  return originalStartInteraction(route, payload, wrappedCb);
}; 