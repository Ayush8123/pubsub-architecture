import { Request, Response } from 'express';
import { Broker } from '../../broker/Broker';

export class DLQController {
  public static getDLQEntries(_req: Request, res: Response): void {
    const broker = Broker.getInstance();
    const entries = broker.dlqManager.getEntries();
    res.status(200).json({ entries, count: entries.length });
  }
}
