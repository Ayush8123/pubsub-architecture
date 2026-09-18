import { NotificationChannel } from './NotificationChannel';
import { ConsoleChannel } from './ConsoleChannel';
import { WebhookChannel } from './WebhookChannel';
import { WebSocketChannel } from './WebSocketChannel';
import { ChannelType } from '../models/Subscription';

export class ChannelRegistry {
  private static instance: ChannelRegistry;
  private channels: Map<string, NotificationChannel> = new Map();

  private constructor() {
    this.registerChannel('console', new ConsoleChannel());
    this.registerChannel('webhook', new WebhookChannel());
    this.registerChannel('websocket', new WebSocketChannel());
  }

  public static getInstance(): ChannelRegistry {
    if (!ChannelRegistry.instance) {
      ChannelRegistry.instance = new ChannelRegistry();
    }
    return ChannelRegistry.instance;
  }

  public registerChannel(type: string, channel: NotificationChannel): void {
    this.channels.set(type.toLowerCase(), channel);
  }

  public getChannel(type: ChannelType | string): NotificationChannel {
    const channel = this.channels.get(type.toLowerCase());
    if (!channel) {
      throw new Error(`Unsupported or unregistered notification channel: '${type}'`);
    }
    return channel;
  }
}
