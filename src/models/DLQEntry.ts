export interface DLQEntry {
  id: string;
  messageId: string;
  subscriptionId: string;
  topic: string;
  originalPayload: any;
  failureReason: string;
  retryCount: number;
  timestamp: string;
}
