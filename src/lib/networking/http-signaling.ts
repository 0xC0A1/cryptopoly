// ============================================
// CRYPTOPOLI - HTTP Polling Signaling Client
// ============================================
// Matches the Next.js API route: POST for actions, GET for polling messages.

import { SignalingMessage } from '../game/types';

type MessageHandler = (message: SignalingMessage) => void;

export class HttpSignalingClient {
  private peerId: string;
  private baseUrl: string;
  private roomId: string | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private pollIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastTimestamp = 0;
  private pollIntervalMs = 1500;

  constructor(peerId: string, baseUrl: string = '') {
    this.peerId = peerId;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private get apiUrl(): string {
    return `${this.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/api/signaling`;
  }

  async attachToRoom(roomId: string): Promise<void> {
    if (this.roomId) {
      await this.leaveRoom();
    }
    this.roomId = roomId.toUpperCase();
    this.lastTimestamp = 0;
    this.startPolling();
  }

  private startPolling(): void {
    if (this.pollIntervalId) return;
    const poll = async () => {
      if (!this.roomId) return;
      try {
        const url = `${this.apiUrl}?peerId=${encodeURIComponent(this.peerId)}&roomId=${encodeURIComponent(this.roomId)}&since=${this.lastTimestamp}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        this.lastTimestamp = data.timestamp ?? Date.now();
        const messages: unknown[] = data.messages ?? [];
        for (const raw of messages) {
          const msg = this.normalizeMessage(raw);
          if (msg) this.messageHandlers.forEach(h => h(msg));
        }
      } catch (e) {
        console.warn('[HttpSignaling] Poll error:', e);
      }
    };
    poll();
    this.pollIntervalId = setInterval(poll, this.pollIntervalMs);
  }

  private stopPolling(): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  private normalizeMessage(raw: unknown): SignalingMessage | null {
    if (!raw || typeof raw !== 'object' || !('type' in raw)) return null;
    const m = raw as Record<string, unknown>;
    const type = m.type as string;
    if (type === 'peer-joined' && typeof m.peerId === 'string') {
      return { type: 'peer-joined', peerId: m.peerId };
    }
    if (type === 'peer-left' && typeof m.peerId === 'string') {
      return { type: 'peer-left', peerId: m.peerId };
    }
    if (type === 'offer' && m.fromPeerId && m.offer) {
      return {
        type: 'offer',
        fromPeerId: m.fromPeerId as string,
        toPeerId: this.peerId,
        offer: m.offer as RTCSessionDescriptionInit,
      };
    }
    if (type === 'answer' && m.fromPeerId && m.answer) {
      return {
        type: 'answer',
        fromPeerId: m.fromPeerId as string,
        toPeerId: this.peerId,
        answer: m.answer as RTCSessionDescriptionInit,
      };
    }
    if (type === 'ice-candidate' && m.fromPeerId && m.candidate) {
      return {
        type: 'ice-candidate',
        fromPeerId: m.fromPeerId as string,
        toPeerId: this.peerId,
        candidate: m.candidate as RTCIceCandidateInit,
      };
    }
    return null;
  }

  sendOffer(toPeerId: string, offer: RTCSessionDescriptionInit): void {
    this.sendMessage(toPeerId, { type: 'offer', offer });
  }

  sendAnswer(toPeerId: string, answer: RTCSessionDescriptionInit): void {
    this.sendMessage(toPeerId, { type: 'answer', answer });
  }

  sendIceCandidate(toPeerId: string, candidate: RTCIceCandidateInit): void {
    this.sendMessage(toPeerId, { type: 'ice-candidate', candidate });
  }

  private async sendMessage(targetPeerId: string, message: Record<string, unknown>): Promise<void> {
    if (!this.roomId) {
      console.error('[HttpSignaling] Cannot send - not attached to a room');
      return;
    }
    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-message',
          peerId: this.peerId,
          roomId: this.roomId,
          targetPeerId,
          message,
        }),
      });
      if (!res.ok) {
        console.warn('[HttpSignaling] send-message failed:', res.status);
      }
    } catch (e) {
      console.error('[HttpSignaling] send-message error:', e);
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  async leaveRoom(): Promise<void> {
    if (this.roomId) {
      try {
        await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave-room',
            peerId: this.peerId,
            roomId: this.roomId,
          }),
        });
      } catch (e) {
        console.warn('[HttpSignaling] leave-room error:', e);
      }
      this.roomId = null;
    }
    this.stopPolling();
  }

  disconnect(): void {
    this.leaveRoom();
    this.messageHandlers.clear();
  }

  get isConnected(): boolean {
    return this.roomId !== null && this.pollIntervalId !== null;
  }

  get currentRoomId(): string | null {
    return this.roomId;
  }
}
