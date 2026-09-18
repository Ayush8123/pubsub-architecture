import { WebSocket } from 'ws';
import { Message } from '../models/Message';

export class WebSocketManager {
  private static instance: WebSocketManager;
  // Map of subscriptionId -> Set of active WebSocket connections
  private connections: Map<string, Set<WebSocket>> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public registerConnection(subscriptionId: string, socket: WebSocket): void {
    if (!this.connections.has(subscriptionId)) {
      this.connections.set(subscriptionId, new Set());
    }
    this.connections.get(subscriptionId)!.add(socket);

    socket.on('close', () => {
      this.unregisterConnection(subscriptionId, socket);
    });

    socket.on('error', () => {
      this.unregisterConnection(subscriptionId, socket);
    });
  }

  public unregisterConnection(subscriptionId: string, socket: WebSocket): void {
    const sockets = this.connections.get(subscriptionId);
    if (sockets) {
      sockets.delete(socket);
      if (sockets.size === 0) {
        this.connections.delete(subscriptionId);
      }
    }
  }

  public sendToSubscription(subscriptionId: string, message: Message): boolean {
    const sockets = this.connections.get(subscriptionId);
    if (!sockets || sockets.size === 0) {
      return false;
    }

    let sent = false;
    const messageFrame = JSON.stringify({
      event: 'MESSAGE_RECEIVED',
      subscriptionId,
      messageId: message.messageId,
      topic: message.topic,
      payload: message.payload,
      timestamp: message.timestamp,
    });

    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(messageFrame);
        sent = true;
      }
    }

    return sent;
  }

  public clear(): void {
    this.connections.clear();
  }
}
