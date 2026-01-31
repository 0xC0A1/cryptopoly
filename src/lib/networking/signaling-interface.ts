// ============================================
// CRYPTOPOLY - Signaling client interface
// ============================================
// Allows swapping HTTP (central server) for copy-paste (no server) or other backends.

import type { SignalingMessage } from '../game/types';

export type MessageHandler = (message: SignalingMessage) => void;

export interface AttachOptions {
  isHost?: boolean;
}

export interface ISignalingClient {
  attachToRoom(roomId: string, options?: AttachOptions): Promise<void>;
  onMessage(handler: MessageHandler): () => void;
  sendOffer(peerId: string, offer: RTCSessionDescriptionInit, candidates?: RTCIceCandidateInit[]): void;
  sendAnswer(peerId: string, answer: RTCSessionDescriptionInit, candidates?: RTCIceCandidateInit[]): void;
  sendIceCandidate(peerId: string, candidate: RTCIceCandidateInit): void;
  leaveRoom(): Promise<void>;
  disconnect(): void;
  get isConnected(): boolean;
  get currentRoomId(): string | null;
}
