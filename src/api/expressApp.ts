import express, { Express, Request, Response } from 'express';
import topicRoutes from './routes/topic.routes';
import subscriptionRoutes from './routes/subscription.routes';
import dlqRoutes from './routes/dlq.routes';

export function createExpressApp(): Express {
  const app = express();

  app.use(express.json());

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Mount API Routes
  app.use('/topics', topicRoutes);
  app.use('/subscriptions', subscriptionRoutes);
  app.use('/dlq', dlqRoutes);

  // Fallback 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  return app;
}
