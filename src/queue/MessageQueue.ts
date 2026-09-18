import { DeliveryTask } from './DeliveryTask';

export class MessageQueue {
  private queue: DeliveryTask[] = [];

  public enqueue(task: DeliveryTask): void {
    this.queue.push(task);
  }

  public dequeue(): DeliveryTask | undefined {
    return this.queue.shift();
  }

  public size(): number {
    return this.queue.length;
  }

  public isEmpty(): boolean {
    return this.queue.length === 0;
  }

  public clear(): void {
    this.queue = [];
  }
}
