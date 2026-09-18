import { Message } from '../models/Message';
import { Subscription } from '../models/Subscription';

export interface NotificationChannel {
  deliver(message: Message, subscription: Subscription): Promise<void>;
}
