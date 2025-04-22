export interface InteractionMessage {
  text?: string;
  thinking?: boolean;
  meta?: any;
  error?: any;
}

export type InteractionCallback = (message: InteractionMessage) => void;

export enum WebSocketStatus {
  Connecting,
  Connected,
  Disconnected,
  Error,
}
