export interface InteractionMessage {
  data?: any;
  error?: any;
  isComplete?: boolean;
}

export type InteractionCallback = (message: InteractionMessage) => void;

export enum WebSocketStatus {
  Connecting,
  Connected,
  Disconnected,
  Error,
}
