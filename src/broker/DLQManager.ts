import { v4 as uuidv4 } from 'uuid';
import { DLQEntry } from '../models/DLQEntry';

export class DLQManager {
  private static instance: DLQManager;
  private entries: DLQEntry[] = [];

  private constructor() {}

  public static getInstance(): DLQManager {
    if (!DLQManager.instance) {
      DLQManager.instance = new DLQManager();
    }
    return DLQManager.instance;
  }

  public addEntry(params: Omit<DLQEntry, 'id' | 'timestamp'>): DLQEntry {
    const entry: DLQEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...params,
    };
    this.entries.push(entry);
    return entry;
  }

  public getEntries(): DLQEntry[] {
    return [...this.entries];
  }

  public clear(): void {
    this.entries = [];
  }
}
