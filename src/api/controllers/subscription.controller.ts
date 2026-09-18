import { Request, Response } from 'express';
import { Broker } from '../../broker/Broker';
import { ChannelType } from '../../models/Subscription';

export class SubscriptionController {
  public static createSubscription(req: Request, res: Response): void {
    try {
      const topicName = req.params.topic;
      const { channel, url, ...otherConfig } = req.body;

      const broker = Broker.getInstance();
      if (!broker.topicManager.topicExists(topicName)) {
        res.status(404).json({ error: `Topic '${topicName}' does not exist` });
        return;
      }

      const validChannels: ChannelType[] = ['console', 'webhook', 'websocket'];
      if (!channel || !validChannels.includes(channel.toLowerCase() as ChannelType)) {
        res.status(400).json({
          error: `Invalid channel '${channel}'. Allowed channels are: ${validChannels.join(', ')}`,
        });
        return;
      }

      const normalizedChannel = channel.toLowerCase() as ChannelType;

      if (normalizedChannel === 'webhook' && (!url || typeof url !== 'string')) {
        res.status(400).json({ error: 'Webhook subscriptions require a valid "url" field' });
        return;
      }

      const subscriptionConfig = {
        ...(url ? { url } : {}),
        ...otherConfig,
      };

      const subscription = broker.subscriptionManager.addSubscription(
        topicName,
        normalizedChannel,
        subscriptionConfig
      );

      const responsePayload: any = { ...subscription };

      if (normalizedChannel === 'websocket') {
        responsePayload.wsEndpoint = `/ws?subscriptionId=${subscription.subscriptionId}`;
      }

      res.status(201).json(responsePayload);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static getTopicSubscriptions(req: Request, res: Response): void {
    const topicName = req.params.topic;
    const broker = Broker.getInstance();

    if (!broker.topicManager.topicExists(topicName)) {
      res.status(404).json({ error: `Topic '${topicName}' does not exist` });
      return;
    }

    const subscriptions = broker.subscriptionManager.getSubscriptionsForTopic(topicName);
    res.status(200).json({ topic: topicName, subscriptions, count: subscriptions.length });
  }

  public static deleteSubscription(req: Request, res: Response): void {
    const subscriptionId = req.params.subscriptionId;
    const broker = Broker.getInstance();
    const removed = broker.subscriptionManager.removeSubscription(subscriptionId);

    if (!removed) {
      res.status(404).json({ error: `Subscription '${subscriptionId}' not found` });
      return;
    }

    res.status(200).json({ message: `Subscription '${subscriptionId}' removed successfully` });
  }
}
