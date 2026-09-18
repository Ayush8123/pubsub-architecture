import { Message } from '../models/Message';
import { Subscription } from '../models/Subscription';

export interface DeliveryTask {
  taskId: string;
  message: Message;
  subscription: Subscription;
  attempt: number;
  createdAt: string;
}
