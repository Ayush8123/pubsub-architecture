import { v4 as uuidv4 } from 'uuid';
import { TopicManager } from './TopicManager';
import { SubscriptionManager } from './SubscriptionManager';
import { DLQManager } from './DLQManager';
import { MessageRouter } from './MessageRouter';
import { WorkerPool } from '../queue/WorkerPool';
import { Message } from '../models/Message';

export class Broker {
  private static instance: Broker;

  public readonly topicManager: TopicManager;
  public readonly subscriptionManager: SubscriptionManager;
  public readonly dlqManager: DLQManager;
  public readonly workerPool: WorkerPool;
  public readonly messageRouter: MessageRouter;

  constructor(workerPool?: WorkerPool) {
    this.topicManager = TopicManager.getInstance();
    this.subscriptionManager = SubscriptionManager.getInstance();
    this.dlqManager = DLQManager.getInstance();
    this.workerPool = workerPool || new WorkerPool();
    this.messageRouter = new MessageRouter(
      this.workerPool,
      this.topicManager,
      this.subscriptionManager
    );
  }

  public static getInstance(): Broker {
    if (!Broker.instance) {
      Broker.instance = new Broker();
    }
    return Broker.instance;
  }

  public publish(topic: string, payload: any): { message: Message; enqueuedTaskCount: number; subscriptionIds: string[] } {
    if (!this.topicManager.topicExists(topic)) {
      throw new Error(`Topic '${topic}' does not exist`);
    }

    const message: Message = {
      messageId: uuidv4(),
      topic,
      payload,
      timestamp: new Date().toISOString(),
    };

    const routingResult = this.messageRouter.routeMessage(message);

    return {
      message,
      enqueuedTaskCount: routingResult.enqueuedTaskCount,
      subscriptionIds: routingResult.subscriptionIds,
    };
  }

  public reset(): void {
    this.topicManager.clear();
    this.subscriptionManager.clear();
    this.dlqManager.clear();
    this.workerPool.clear();
  }
}
