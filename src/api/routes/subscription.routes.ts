import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';

const router = Router();

router.delete('/:subscriptionId', SubscriptionController.deleteSubscription);

export default router;
