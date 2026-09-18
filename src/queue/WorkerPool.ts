import { MessageQueue } from './MessageQueue';
import { DeliveryTask } from './DeliveryTask';
import { ChannelRegistry } from '../channels/ChannelRegistry';
import { SubscriptionManager } from '../broker/SubscriptionManager';
import { DLQManager } from '../broker/DLQManager';
import { config } from '../config/config';

export class WorkerPool {
  private queue: MessageQueue;
  private concurrency: number;
  private activeWorkers: number = 0;
  private pendingRetriesCount: number = 0;
  private isProcessing: boolean = false;
  private idleResolvers: Array<() => void> = [];

  constructor(concurrency: number = config.workerConcurrency) {
    this.queue = new MessageQueue();
    this.concurrency = concurrency;
  }

  public enqueue(task: DeliveryTask): void {
    this.queue.enqueue(task);
    this.processQueue();
  }

  public getQueueSize(): number {
    return this.queue.size();
  }

  public getActiveWorkerCount(): number {
    return this.activeWorkers;
  }

  private processQueue(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.activeWorkers < this.concurrency && !this.queue.isEmpty()) {
      const task = this.queue.dequeue();
      if (!task) break;

      this.activeWorkers++;
      this.executeWorker(task).finally(() => {
        this.activeWorkers--;
        this.checkIdle();
        this.isProcessing = false;
        this.processQueue();
      });
    }

    this.isProcessing = false;
  }

  private async executeWorker(task: DeliveryTask): Promise<void> {
    const subscriptionMgr = SubscriptionManager.getInstance();
    const dlqMgr = DLQManager.getInstance();
    const channelRegistry = ChannelRegistry.getInstance();

    // Idempotency check: Skip if message was already successfully delivered to this subscriber
    if (subscriptionMgr.isDelivered(task.subscription.subscriptionId, task.message.messageId)) {
      return;
    }

    try {
      const channel = channelRegistry.getChannel(task.subscription.channel);
      await channel.deliver(task.message, task.subscription);

      // Delivery succeeded -> record for idempotency
      subscriptionMgr.markDelivered(task.subscription.subscriptionId, task.message.messageId);
    } catch (error: any) {
      const failureReason = error?.message || String(error);
      const nextAttempt = task.attempt + 1;

      if (nextAttempt < config.maxRetries) {
        // Calculate exponential backoff delay
        const delay = config.retryInitialDelayMs * Math.pow(config.retryBackoffFactor, task.attempt);

        this.pendingRetriesCount++;
        setTimeout(() => {
          this.pendingRetriesCount--;
          this.enqueue({
            ...task,
            attempt: nextAttempt,
          });
        }, delay);
      } else {
        // Max retries exceeded -> route to Dead Letter Queue (DLQ)
        dlqMgr.addEntry({
          messageId: task.message.messageId,
          subscriptionId: task.subscription.subscriptionId,
          topic: task.message.topic,
          originalPayload: task.message.payload,
          failureReason: `Exceeded max retry attempts (${config.maxRetries}). Last error: ${failureReason}`,
          retryCount: nextAttempt,
        });
      }
    }
  }

  private checkIdle(): void {
    if (this.activeWorkers === 0 && this.queue.isEmpty() && this.pendingRetriesCount === 0) {
      while (this.idleResolvers.length > 0) {
        const resolve = this.idleResolvers.shift();
        if (resolve) resolve();
      }
    }
  }

  /**
   * Helper promise that resolves when all queued, active, and pending retry tasks have finished.
   * Useful for testing asynchronous worker completions.
   */
  public async waitUntilIdle(timeoutMs: number = 10000): Promise<void> {
    if (this.activeWorkers === 0 && this.queue.isEmpty() && this.pendingRetriesCount === 0) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`WorkerPool waitUntilIdle timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.idleResolvers.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  public clear(): void {
    this.queue.clear();
    this.activeWorkers = 0;
    this.pendingRetriesCount = 0;
  }
}
