export type ChannelType = 'console' | 'webhook' | 'websocket';

export interface SubscriptionConfig {
  url?: string;
  clientIdentifier?: string;
  [key: string]: any;
}

export interface Subscription {
  subscriptionId: string;
  topic: string;
  channel: ChannelType;
  config: SubscriptionConfig;
  createdAt: string;
}
