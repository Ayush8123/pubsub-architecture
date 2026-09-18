import { Server as HttpServer } from 'http';
import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { URL } from 'url';
import { WebSocketManager } from './WebSocketManager';
import { Broker } from '../broker/Broker';

export function setupWebSocketServer(server: HttpServer): WSServer {
  const wss = new WSServer({ noServer: true });
  const wsManager = WebSocketManager.getInstance();

  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';

    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket, request) => {
    let currentSubscriptionId: string | null = null;

    if (request.url) {
      const parsedUrl = new URL(request.url, `http://${request.headers.host}`);
      const subIdParam = parsedUrl.searchParams.get('subscriptionId');
      if (subIdParam) {
        currentSubscriptionId = subIdParam;
        wsManager.registerConnection(subIdParam, ws);
      }
    }

    ws.send(
      JSON.stringify({
        event: 'CONNECTED',
        message: 'Connected to Restaurant Pub/Sub WebSocket server',
        subscriptionId: currentSubscriptionId,
      })
    );

    ws.on('message', (data: Buffer | string) => {
      try {
        const payload = JSON.parse(data.toString());

        if (payload.type === 'subscribe') {
          if (payload.subscriptionId) {
            currentSubscriptionId = payload.subscriptionId;
            wsManager.registerConnection(payload.subscriptionId, ws);
            ws.send(
              JSON.stringify({
                event: 'SUBSCRIBED',
                subscriptionId: payload.subscriptionId,
              })
            );
          } else if (payload.topic) {
            const broker = Broker.getInstance();
            if (!broker.topicManager.topicExists(payload.topic)) {
              ws.send(
                JSON.stringify({
                  event: 'ERROR',
                  message: `Topic '${payload.topic}' does not exist`,
                })
              );
              return;
            }

            const subscription = broker.subscriptionManager.addSubscription(
              payload.topic,
              'websocket',
              { autoCreated: true }
            );

            currentSubscriptionId = subscription.subscriptionId;
            wsManager.registerConnection(subscription.subscriptionId, ws);

            ws.send(
              JSON.stringify({
                event: 'SUBSCRIBED',
                topic: payload.topic,
                subscriptionId: subscription.subscriptionId,
              })
            );
          }
        } else if (payload.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err: any) {
        ws.send(
          JSON.stringify({
            event: 'ERROR',
            message: 'Invalid JSON payload received',
          })
        );
      }
    });
  });

  return wss;
}
