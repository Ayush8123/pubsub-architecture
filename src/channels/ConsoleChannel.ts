import { NotificationChannel } from './NotificationChannel';
import { Message } from '../models/Message';
import { Subscription } from '../models/Subscription';

export class ConsoleChannel implements NotificationChannel {
  async deliver(message: Message, subscription: Subscription): Promise<void> {
    console.log(
      `[CONSOLE CHANNEL] Subscription '${subscription.subscriptionId}' received message '${message.messageId}' on topic '${message.topic}':`,
      JSON.stringify(message.payload, null, 2)
    );
  }
}
