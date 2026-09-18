export interface Message<T = Record<string, any>> {
  messageId: string;
  topic: string;
  payload: T;
  timestamp: string;
}
