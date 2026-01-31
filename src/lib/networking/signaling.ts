// ============================================
// CRYPTOPOLI - Signaling Client
// ============================================

import { SignalingMessage } from '../game/types';

type MessageHandler = (message: SignalingMessage) => void;

export class SignalingClient {
  private ws: WebSocket | null = null;
  private peerId: string;
  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(peerId: string) {
    this.peerId = peerId;
  }

  connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(serverUrl);

        this.ws.onopen = () => {
          console.log('[Signaling] Connected to server');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as SignalingMessage;
            this.messageHandlers.forEach(handler => handler(message));
          } catch (e) {
            console.error('[Signaling] Failed to parse message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[Signaling] WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[Signaling] Connection closed');
          this.attemptReconnect(serverUrl);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(serverUrl: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[Signaling] Reconnecting (attempt ${this.reconnectAttempts})...`);
      setTimeout(() => {
        this.connect(serverUrl).catch(() => {});
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(message: SignalingMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('[Signaling] Cannot send - not connected');
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  createRoom(): void {
    this.send({
      type: 'create-room',
      peerId: this.peerId,
    });
  }

  joinRoom(roomId: string): void {
    this.send({
      type: 'join-room',
      roomId,
      peerId: this.peerId,
    });
  }

  sendOffer(toPeerId: string, offer: RTCSessionDescriptionInit): void {
    this.send({
      type: 'offer',
      fromPeerId: this.peerId,
      toPeerId,
      offer,
    });
  }

  sendAnswer(toPeerId: string, answer: RTCSessionDescriptionInit): void {
    this.send({
      type: 'answer',
      fromPeerId: this.peerId,
      toPeerId,
      answer,
    });
  }

  sendIceCandidate(toPeerId: string, candidate: RTCIceCandidateInit): void {
    this.send({
      type: 'ice-candidate',
      fromPeerId: this.peerId,
      toPeerId,
      candidate,
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
