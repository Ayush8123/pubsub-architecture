import { Router } from 'express';
import { DLQController } from '../controllers/dlq.controller';

const router = Router();

router.get('/', DLQController.getDLQEntries);

export default router;
