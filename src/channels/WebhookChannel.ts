import { NotificationChannel } from './NotificationChannel';
import { Message } from '../models/Message';
import { Subscription } from '../models/Subscription';
import { config } from '../config/config';

export class WebhookChannel implements NotificationChannel {
  async deliver(message: Message, subscription: Subscription): Promise<void> {
    const url = subscription.config.url;
    if (!url) {
      throw new Error(`Webhook URL is missing in subscription '${subscription.subscriptionId}' configuration`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.deliveryTimeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PubSub-Message-Id': message.messageId,
          'X-PubSub-Topic': message.topic,
          'X-PubSub-Subscription-Id': subscription.subscriptionId,
        },
        body: JSON.stringify({
          messageId: message.messageId,
          topic: message.topic,
          payload: message.payload,
          timestamp: message.timestamp,
          subscriptionId: subscription.subscriptionId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Webhook delivery failed with HTTP status ${response.status} (${response.statusText}) for URL: ${url}`
        );
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Webhook delivery timed out after ${config.deliveryTimeoutMs}ms for URL: ${url}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
