import { Request, Response } from 'express';
import { Broker } from '../../broker/Broker';

export class TopicController {
  public static createTopic(req: Request, res: Response): void {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Field "name" is required and must be a non-empty string' });
        return;
      }

      const broker = Broker.getInstance();
      const topic = broker.topicManager.createTopic(name);
      res.status(201).json(topic);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static getTopics(_req: Request, res: Response): void {
    const broker = Broker.getInstance();
    const topics = broker.topicManager.getAllTopics();
    res.status(200).json({ topics, count: topics.length });
  }

  public static getTopic(req: Request, res: Response): void {
    const topicName = req.params.topic;
    const broker = Broker.getInstance();
    const topic = broker.topicManager.getTopic(topicName);

    if (!topic) {
      res.status(404).json({ error: `Topic '${topicName}' not found` });
      return;
    }

    res.status(200).json(topic);
  }

  public static deleteTopic(req: Request, res: Response): void {
    const topicName = req.params.topic;
    const broker = Broker.getInstance();
    const deleted = broker.topicManager.deleteTopic(topicName);

    if (!deleted) {
      res.status(404).json({ error: `Topic '${topicName}' not found` });
      return;
    }

    res.status(200).json({ message: `Topic '${topicName}' deleted successfully` });
  }
}
