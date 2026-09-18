import { Request, Response } from 'express';
import { Broker } from '../../broker/Broker';

export class PublishController {
  public static publishMessage(req: Request, res: Response): void {
    try {
      const topicName = req.params.topic;
      const payload = req.body;

      if (!payload || (typeof payload === 'object' && Object.keys(payload).length === 0)) {
        res.status(400).json({ error: 'Publish payload cannot be empty' });
        return;
      }

      const broker = Broker.getInstance();

      if (!broker.topicManager.topicExists(topicName)) {
        res.status(404).json({ error: `Cannot publish: Topic '${topicName}' does not exist` });
        return;
      }

      const result = broker.publish(topicName, payload);

      res.status(202).json({
        status: 'ACCEPTED',
        messageId: result.message.messageId,
        topic: result.message.topic,
        payload: result.message.payload,
        timestamp: result.message.timestamp,
        enqueuedSubscribers: result.enqueuedTaskCount,
        subscriberIds: result.subscriptionIds,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
