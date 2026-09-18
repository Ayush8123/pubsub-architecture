import { v4 as uuidv4 } from 'uuid';
import { Subscription, ChannelType, SubscriptionConfig } from '../models/Subscription';

export class SubscriptionManager {
  private static instance: SubscriptionManager;

  // Map of subscriptionId -> Subscription
  private subscriptions: Map<string, Subscription> = new Map();

  // Map of topic -> Set of subscriptionIds
  private topicSubscriptions: Map<string, Set<string>> = new Map();

  // Map of subscriptionId -> Set of delivered messageIds (for idempotency)
  private deliveredMessages: Map<string, Set<string>> = new Map();

  private constructor() {}

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  public addSubscription(
    topic: string,
    channel: ChannelType,
    config: SubscriptionConfig = {}
  ): Subscription {
    const subscriptionId = uuidv4();
    const subscription: Subscription = {
      subscriptionId,
      topic,
      channel,
      config,
      createdAt: new Date().toISOString(),
    };

    this.subscriptions.set(subscriptionId, subscription);

    if (!this.topicSubscriptions.has(topic)) {
      this.topicSubscriptions.set(topic, new Set());
    }
    this.topicSubscriptions.get(topic)!.add(subscriptionId);

    this.deliveredMessages.set(subscriptionId, new Set());

    return subscription;
  }

  public getSubscription(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  public getSubscriptionsForTopic(topic: string): Subscription[] {
    const subIds = this.topicSubscriptions.get(topic);
    if (!subIds) {
      return [];
    }
    const result: Subscription[] = [];
    for (const subId of subIds) {
      const sub = this.subscriptions.get(subId);
      if (sub) {
        result.push(sub);
      }
    }
    return result;
  }

  public removeSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    this.subscriptions.delete(subscriptionId);
    this.deliveredMessages.delete(subscriptionId);

    const topicSet = this.topicSubscriptions.get(subscription.topic);
    if (topicSet) {
      topicSet.delete(subscriptionId);
      if (topicSet.size === 0) {
        this.topicSubscriptions.delete(subscription.topic);
      }
    }

    return true;
  }

  public removeSubscriptionsForTopic(topic: string): void {
    const subIds = this.topicSubscriptions.get(topic);
    if (subIds) {
      for (const subId of subIds) {
        this.subscriptions.delete(subId);
        this.deliveredMessages.delete(subId);
      }
      this.topicSubscriptions.delete(topic);
    }
  }

  public isDelivered(subscriptionId: string, messageId: string): boolean {
    const deliveredSet = this.deliveredMessages.get(subscriptionId);
    return deliveredSet ? deliveredSet.has(messageId) : false;
  }

  public markDelivered(subscriptionId: string, messageId: string): void {
    let deliveredSet = this.deliveredMessages.get(subscriptionId);
    if (!deliveredSet) {
      deliveredSet = new Set();
      this.deliveredMessages.set(subscriptionId, deliveredSet);
    }
    deliveredSet.add(messageId);
  }

  public clear(): void {
    this.subscriptions.clear();
    this.topicSubscriptions.clear();
    this.deliveredMessages.clear();
  }
}
