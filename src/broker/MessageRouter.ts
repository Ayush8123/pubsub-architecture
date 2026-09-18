import { v4 as uuidv4 } from 'uuid';
import { Message } from '../models/Message';
import { TopicManager } from './TopicManager';
import { SubscriptionManager } from './SubscriptionManager';
import { WorkerPool } from '../queue/WorkerPool';

export class MessageRouter {
  private topicManager: TopicManager;
  private subscriptionManager: SubscriptionManager;
  private workerPool: WorkerPool;

  constructor(
    workerPool: WorkerPool,
    topicManager?: TopicManager,
    subscriptionManager?: SubscriptionManager
  ) {
    this.workerPool = workerPool;
    this.topicManager = topicManager || TopicManager.getInstance();
    this.subscriptionManager = subscriptionManager || SubscriptionManager.getInstance();
  }

  public routeMessage(message: Message): { enqueuedTaskCount: number; subscriptionIds: string[] } {
    if (!this.topicManager.topicExists(message.topic)) {
      throw new Error(`Cannot route message: Topic '${message.topic}' does not exist`);
    }

    this.topicManager.incrementMessageCount(message.topic);

    const subscriptions = this.subscriptionManager.getSubscriptionsForTopic(message.topic);
    const subscriptionIds: string[] = [];

    for (const subscription of subscriptions) {
      subscriptionIds.push(subscription.subscriptionId);

      this.workerPool.enqueue({
        taskId: uuidv4(),
        message,
        subscription,
        attempt: 0,
        createdAt: new Date().toISOString(),
      });
    }

    return {
      enqueuedTaskCount: subscriptions.length,
      subscriptionIds,
    };
  }
}
