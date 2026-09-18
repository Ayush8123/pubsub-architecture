import { NotificationChannel } from './NotificationChannel';
import { Message } from '../models/Message';
import { Subscription } from '../models/Subscription';
import { WebSocketManager } from '../websocket/WebSocketManager';

export class WebSocketChannel implements NotificationChannel {
  private wsManager: WebSocketManager;

  constructor(wsManager?: WebSocketManager) {
    this.wsManager = wsManager || WebSocketManager.getInstance();
  }

  async deliver(message: Message, subscription: Subscription): Promise<void> {
    const success = this.wsManager.sendToSubscription(subscription.subscriptionId, message);
    if (!success) {
      throw new Error(
        `WebSocket delivery failed: No active WebSocket connection for subscription '${subscription.subscriptionId}'`
      );
    }
  }
}
