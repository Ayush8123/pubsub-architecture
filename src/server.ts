import http from 'http';
import { createExpressApp } from './api/expressApp';
import { setupWebSocketServer } from './websocket/WebSocketServer';
import { config } from './config/config';
import { Broker } from './broker/Broker';

const app = createExpressApp();
const server = http.createServer(app);

// Setup WebSocket Server
setupWebSocketServer(server);

// Seed initial restaurant domain topics for easy out-of-the-box testing
const broker = Broker.getInstance();
const defaultTopics = ['orders', 'payments', 'inventory', 'kitchen', 'notifications'];
for (const topic of defaultTopics) {
  try {
    broker.topicManager.createTopic(topic);
  } catch {
    // Topic already exists, ignore
  }
}

server.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Restaurant Pub/Sub Broker Server Running`);
  console.log(`📡 HTTP API:       http://localhost:${config.port}`);
  console.log(`🔌 WebSocket WS:   ws://localhost:${config.port}/ws`);
  console.log(`⚙️ Workers:        ${config.workerConcurrency} concurrent workers`);
  console.log(`=======================================================`);
});

export { server, app };
