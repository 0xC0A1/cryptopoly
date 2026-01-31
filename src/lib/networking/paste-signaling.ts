// ============================================
// CRYPTOPOLY - Copy-paste signaling (no server)
// ============================================
// Host and guest exchange SDP + ICE via copy-paste. Zero central server.

import type { ISignalingClient, MessageHandler } from './signaling-interface';
import type { SignalingMessage } from '../game/types';

const HOST_PEER_ID = 'host';
const GUEST_PEER_ID = 'guest';

export interface PasteSession {
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidates: RTCIceCandidateInit[];
}

function encodeSession(session: PasteSession): string {
  return typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(JSON.stringify(session))))
    : Buffer.from(JSON.stringify(session), 'utf-8').toString('base64');
}

function decodeSession(str: string): PasteSession | null {
  try {
    const json =
      typeof atob !== 'undefined'
        ? decodeURIComponent(escape(atob(str.trim())))
        : Buffer.from(str.trim(), 'base64').toString('utf-8');
    const parsed = JSON.parse(json) as PasteSession;
    if (!parsed.candidates || !Array.isArray(parsed.candidates)) {
      parsed.candidates = [];
    }
    return parsed;
  } catch {
    return null;
  }
}

export class PasteSignalingClient implements ISignalingClient {
  private roomId: string | null = null;
  private isHost = false;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionString: string | null = null;
  private responseString: string | null = null;
  private onConnectionStringReady: (s: string) => void = () => {};
  private onResponseStringReady: (s: string) => void = () => {};

  constructor(callbacks?: {
    onConnectionStringReady?: (s: string) => void;
    onResponseStringReady?: (s: string) => void;
  }) {
    if (callbacks?.onConnectionStringReady) this.onConnectionStringReady = callbacks.onConnectionStringReady;
    if (callbacks?.onResponseStringReady) this.onResponseStringReady = callbacks.onResponseStringReady;
  }

  async attachToRoom(roomId: string, options?: { isHost?: boolean }): Promise<void> {
    this.roomId = roomId.toUpperCase();
    this.isHost = options?.isHost ?? false;
    this.connectionString = null;
    this.responseString = null;

    if (this.isHost) {
      // Host: simulate one guest joining so PeerManager creates the connection and sends the offer
      queueMicrotask(() => {
        this.emit({ type: 'peer-joined', peerId: GUEST_PEER_ID });
      });
    }
  }

  private emit(message: SignalingMessage): void {
    this.messageHandlers.forEach(h => h(message));
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  sendOffer(peerId: string, offer: RTCSessionDescriptionInit, candidates: RTCIceCandidateInit[] = []): void {
    const session: PasteSession = { offer, candidates };
    this.connectionString = encodeSession(session);
    this.onConnectionStringReady(this.connectionString);
  }

  sendAnswer(peerId: string, answer: RTCSessionDescriptionInit, candidates: RTCIceCandidateInit[] = []): void {
    const session: PasteSession = { answer, candidates };
    this.responseString = encodeSession(session);
    this.onResponseStringReady(this.responseString);
  }

  sendIceCandidate(_peerId: string, _candidate: RTCIceCandidateInit): void {
    // Paste mode bundles ICE with offer/answer; individual candidates are not sent
  }

  getConnectionString(): string | null {
    return this.connectionString;
  }

  getResponseString(): string | null {
    return this.responseString;
  }

  /** Guest calls this after pasting the host's connection string. */
  submitHostOffer(paste: string): boolean {
    const session = decodeSession(paste);
    if (!session?.offer) return false;
    this.emit({
      type: 'offer',
      fromPeerId: HOST_PEER_ID,
      toPeerId: GUEST_PEER_ID,
      offer: session.offer,
    });
    for (const c of session.candidates) {
      this.emit({
        type: 'ice-candidate',
        fromPeerId: HOST_PEER_ID,
        toPeerId: GUEST_PEER_ID,
        candidate: c,
      });
    }
    return true;
  }

  /** Host calls this after pasting the guest's response string. */
  submitGuestResponse(paste: string): boolean {
    const session = decodeSession(paste);
    if (!session?.answer) return false;
    this.emit({
      type: 'answer',
      fromPeerId: GUEST_PEER_ID,
      toPeerId: HOST_PEER_ID,
      answer: session.answer,
    });
    for (const c of session.candidates) {
      this.emit({
        type: 'ice-candidate',
        fromPeerId: GUEST_PEER_ID,
        toPeerId: HOST_PEER_ID,
        candidate: c,
      });
    }
    return true;
  }

  async leaveRoom(): Promise<void> {
    this.roomId = null;
    this.connectionString = null;
    this.responseString = null;
  }

  disconnect(): void {
    this.leaveRoom();
    this.messageHandlers.clear();
  }

  get isConnected(): boolean {
    return this.roomId !== null;
  }

  get currentRoomId(): string | null {
    return this.roomId;
  }
}

export { HOST_PEER_ID, GUEST_PEER_ID };
