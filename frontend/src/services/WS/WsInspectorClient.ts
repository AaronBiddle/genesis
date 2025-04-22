import { ref } from 'vue';
import type { InteractionMessage } from './types';
import { WsAiClient } from './WsAiClient';

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

// Wrap sendChatMessage to capture logs
const originalSendChatMessage = WsAiClient.sendChatMessage.bind(WsAiClient);
WsAiClient.sendChatMessage = async (
  payload: any,
  cb: (message: InteractionMessage) => void
): Promise<number | null> => {
  // Log outgoing message
  wsSendLog.value.push({ timestamp: new Date(), route: 'sendChatMessage', payload });
  // Wrap the callback to log incoming messages
  const wrappedCb = (message: InteractionMessage) => {
    wsReceiveLog.value.push({ timestamp: new Date(), message });
    cb(message);
  };
  // Invoke the original sendChatMessage with wrapped callback
  return originalSendChatMessage(payload, wrappedCb);
};

// Wrap cancelChat to capture logs
const originalCancelChat = WsAiClient.cancelChat.bind(WsAiClient);
WsAiClient.cancelChat = (id: number): boolean => {
  wsSendLog.value.push({ timestamp: new Date(), route: 'cancelChat', payload: id });
  return originalCancelChat(id);
}; 