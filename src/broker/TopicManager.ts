import { Topic } from '../models/Topic';
import { SubscriptionManager } from './SubscriptionManager';

export class TopicManager {
  private static instance: TopicManager;
  private topics: Map<string, Topic> = new Map();

  private constructor() {}

  public static getInstance(): TopicManager {
    if (!TopicManager.instance) {
      TopicManager.instance = new TopicManager();
    }
    return TopicManager.instance;
  }

  public createTopic(name: string): Topic {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Topic name cannot be empty');
    }

    if (this.topics.has(trimmedName)) {
      throw new Error(`Topic '${trimmedName}' already exists`);
    }

    const topic: Topic = {
      name: trimmedName,
      createdAt: new Date().toISOString(),
      messageCount: 0,
    };

    this.topics.set(trimmedName, topic);
    return topic;
  }

  public getTopic(name: string): Topic | undefined {
    const topic = this.topics.get(name);
    if (!topic) return undefined;

    const subscriberCount = SubscriptionManager.getInstance().getSubscriptionsForTopic(name).length;
    return {
      ...topic,
      subscriberCount,
    };
  }

  public getAllTopics(): Topic[] {
    const subMgr = SubscriptionManager.getInstance();
    return Array.from(this.topics.values()).map((topic) => ({
      ...topic,
      subscriberCount: subMgr.getSubscriptionsForTopic(topic.name).length,
    }));
  }

  public topicExists(name: string): boolean {
    return this.topics.has(name);
  }

  public incrementMessageCount(name: string): void {
    const topic = this.topics.get(name);
    if (topic) {
      topic.messageCount += 1;
    }
  }

  public deleteTopic(name: string): boolean {
    if (!this.topics.has(name)) {
      return false;
    }

    this.topics.delete(name);
    SubscriptionManager.getInstance().removeSubscriptionsForTopic(name);
    return true;
  }

  public clear(): void {
    this.topics.clear();
  }
}
