export interface AppConfig {
  port: number;
  workerConcurrency: number;
  maxRetries: number;
  retryInitialDelayMs: number;
  retryBackoffFactor: number;
  deliveryTimeoutMs: number;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '4', 10),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
  retryInitialDelayMs: parseInt(process.env.RETRY_INITIAL_DELAY_MS || '100', 10),
  retryBackoffFactor: parseFloat(process.env.RETRY_BACKOFF_FACTOR || '2'),
  deliveryTimeoutMs: parseInt(process.env.DELIVERY_TIMEOUT_MS || '3000', 10),
};
