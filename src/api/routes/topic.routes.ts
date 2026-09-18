import { Router } from 'express';
import { TopicController } from '../controllers/topic.controller';
import { PublishController } from '../controllers/publish.controller';
import { SubscriptionController } from '../controllers/subscription.controller';

const router = Router();

// Topic Management
router.post('/', TopicController.createTopic);
router.get('/', TopicController.getTopics);
router.get('/:topic', TopicController.getTopic);
router.delete('/:topic', TopicController.deleteTopic);

// Publishing
router.post('/:topic/publish', PublishController.publishMessage);

// Topic Subscriptions
router.post('/:topic/subscriptions', SubscriptionController.createSubscription);
router.get('/:topic/subscriptions', SubscriptionController.getTopicSubscriptions);

export default router;
