// ============================================
// CRYPTOPOLY - WebRTC Peer Manager
// ============================================
// Uses a pluggable signaling client (HTTP or copy-paste). No server required for paste mode.

import type { ISignalingClient } from './signaling-interface';
import { HttpSignalingClient } from './http-signaling';
import { NetworkMessage } from '../game/types';

interface PeerConnection {
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  isReady: boolean;
}

type MessageHandler = (peerId: string, message: NetworkMessage) => void;
type ConnectionHandler = (peerId: string) => void;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const ICE_GATHERING_TIMEOUT_MS = 5000;

/** Wait for ICE gathering to complete and return collected candidates (for copy-paste or batch send). */
function waitForIceGatheringComplete(connection: RTCPeerConnection): Promise<RTCIceCandidateInit[]> {
  return new Promise((resolve) => {
    const candidates: RTCIceCandidateInit[] = [];
    const done = () => {
      connection.removeEventListener('icegatheringstatechange', onState);
      resolve(candidates);
    };
    const onState = () => {
      if (connection.iceGatheringState === 'complete') {
        done();
      }
    };
    connection.addEventListener('icegatheringstatechange', onState);
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        candidates.push(event.candidate.toJSON());
      }
    };
    if (connection.iceGatheringState === 'complete') {
      done();
      return;
    }
    setTimeout(done, ICE_GATHERING_TIMEOUT_MS);
  });
}

export interface AttachRoomOptions {
  isHost: boolean;
  hostId: string | null;
  /** For guests: peer IDs already in the room (e.g. host). We wait for their offer; do not create one. */
  existingPeerIds?: string[];
}

export interface PeerManagerOptions {
  /** Signaling client (default: HttpSignalingClient). Use PasteSignalingClient for no server. */
  signaling?: ISignalingClient;
}

export class PeerManager {
  private peerId: string;
  private signaling: ISignalingClient;
  private peers: Map<string, PeerConnection> = new Map();
  private hostId: string | null = null;
  private roomId: string | null = null;
  private isHost: boolean = false;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private disconnectionHandlers: Set<ConnectionHandler> = new Set();
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  private unsubSignaling: (() => void) | null = null;

  constructor(peerId: string, baseUrl: string = '', options?: PeerManagerOptions) {
    this.peerId = peerId;
    this.signaling = options?.signaling ?? new HttpSignalingClient(peerId, baseUrl);
    this.unsubSignaling = this.signaling.onMessage(this.handleSignalingMessage.bind(this));
  }

  /**
   * Attach to a room. Host: will receive peer-joined and create offer. Guest: will wait for host's offer.
   * With paste signaling, host gets connection string to share; guest pastes it and gets response string.
   */
  async attachToRoom(roomId: string, attachOptions: AttachRoomOptions): Promise<void> {
    this.roomId = roomId;
    this.hostId = attachOptions.hostId;
    this.isHost = attachOptions.isHost;
    await this.signaling.attachToRoom(roomId, { isHost: attachOptions.isHost });
  }

  private handleSignalingMessage(message: import('../game/types').SignalingMessage): void {
    switch (message.type) {
      case 'peer-joined':
        console.log('[PeerManager] Peer joined:', message.peerId);
        if (this.isHost) {
          this.createPeerConnection(message.peerId, true);
        }
        break;

      case 'peer-left':
        console.log('[PeerManager] Peer left:', message.peerId);
        this.removePeer(message.peerId);
        break;

      case 'offer':
        this.handleOffer(message.fromPeerId, message.offer!);
        break;

      case 'answer':
        this.handleAnswer(message.fromPeerId, message.answer!);
        break;

      case 'ice-candidate':
        this.handleIceCandidate(message.fromPeerId, message.candidate!);
        break;

      default:
        break;
    }
  }

  private async createPeerConnection(peerId: string, createOffer: boolean): Promise<PeerConnection> {
    if (this.peers.has(peerId)) {
      return this.peers.get(peerId)!;
    }
    console.log(`[PeerManager] Creating connection to ${peerId}, createOffer: ${createOffer}`);

    const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const peerConn: PeerConnection = {
      connection,
      dataChannel: null,
      isReady: false,
    };

    this.peers.set(peerId, peerConn);

    connection.onconnectionstatechange = () => {
      console.log(`[PeerManager] Connection state with ${peerId}:`, connection.connectionState);
      if (connection.connectionState === 'connected') {
        peerConn.isReady = true;
        this.connectionHandlers.forEach(handler => handler(peerId));
      } else if (connection.connectionState === 'failed' || connection.connectionState === 'disconnected') {
        this.removePeer(peerId);
      }
    };

    connection.ondatachannel = (event) => {
      console.log(`[PeerManager] Received data channel from ${peerId}`);
      peerConn.dataChannel = event.channel;
      this.setupDataChannel(peerId, event.channel);
    };

    if (createOffer) {
      const dataChannel = connection.createDataChannel('game', { ordered: true });
      peerConn.dataChannel = dataChannel;
      this.setupDataChannel(peerId, dataChannel);

      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      const candidates = await waitForIceGatheringComplete(connection);
      this.signaling.sendOffer(peerId, offer, candidates);
    }

    return peerConn;
  }

  private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log(`[PeerManager] Data channel open with ${peerId}`);
      const peerConn = this.peers.get(peerId);
      if (peerConn) peerConn.isReady = true;
    };

    channel.onclose = () => {
      console.log(`[PeerManager] Data channel closed with ${peerId}`);
    };

    channel.onerror = (error) => {
      console.error(`[PeerManager] Data channel error with ${peerId}:`, error);
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as NetworkMessage;
        this.messageHandlers.forEach(handler => handler(peerId, message));
      } catch (e) {
        console.error('[PeerManager] Failed to parse message:', e);
      }
    };
  }

  private async handleOffer(fromPeerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    console.log(`[PeerManager] Received offer from ${fromPeerId}`);

    const peerConn = await this.createPeerConnection(fromPeerId, false);
    await peerConn.connection.setRemoteDescription(new RTCSessionDescription(offer));

    const pending = this.pendingCandidates.get(fromPeerId) || [];
    for (const candidate of pending) {
      await peerConn.connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
    this.pendingCandidates.delete(fromPeerId);

    const answer = await peerConn.connection.createAnswer();
    await peerConn.connection.setLocalDescription(answer);
    const candidates = await waitForIceGatheringComplete(peerConn.connection);
    this.signaling.sendAnswer(fromPeerId, answer, candidates);
  }

  private async handleAnswer(fromPeerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    console.log(`[PeerManager] Received answer from ${fromPeerId}`);

    const peerConn = this.peers.get(fromPeerId);
    if (peerConn) {
      await peerConn.connection.setRemoteDescription(new RTCSessionDescription(answer));
      const pending = this.pendingCandidates.get(fromPeerId) || [];
      for (const candidate of pending) {
        await peerConn.connection.addIceCandidate(new RTCIceCandidate(candidate));
      }
      this.pendingCandidates.delete(fromPeerId);
    }
  }

  private async handleIceCandidate(fromPeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConn = this.peers.get(fromPeerId);
    if (peerConn && peerConn.connection.remoteDescription) {
      await peerConn.connection.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      if (!this.pendingCandidates.has(fromPeerId)) {
        this.pendingCandidates.set(fromPeerId, []);
      }
      this.pendingCandidates.get(fromPeerId)!.push(candidate);
    }
  }

  private removePeer(peerId: string): void {
    const peerConn = this.peers.get(peerId);
    if (peerConn) {
      peerConn.dataChannel?.close();
      peerConn.connection.close();
      this.peers.delete(peerId);
      this.disconnectionHandlers.forEach(handler => handler(peerId));
    }
  }

  send(peerId: string, message: NetworkMessage): void {
    const peerConn = this.peers.get(peerId);
    if (peerConn?.dataChannel?.readyState === 'open') {
      peerConn.dataChannel.send(JSON.stringify(message));
    } else {
      console.warn(`[PeerManager] Cannot send to ${peerId} - not connected`);
    }
  }

  broadcast(message: NetworkMessage): void {
    this.broadcastExcept(message);
  }

  /** Broadcast to all peers except the given peer (e.g. sender). */
  broadcastExcept(message: NetworkMessage, exceptPeerId?: string): void {
    const data = JSON.stringify(message);
    for (const [peerId, peerConn] of this.peers) {
      if (peerId !== exceptPeerId && peerConn.dataChannel?.readyState === 'open') {
        peerConn.dataChannel.send(data);
      }
    }
  }

  sendToHost(message: NetworkMessage): void {
    if (this.hostId && this.hostId !== this.peerId) {
      this.send(this.hostId, message);
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onPeerConnected(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  onPeerDisconnected(handler: ConnectionHandler): () => void {
    this.disconnectionHandlers.add(handler);
    return () => this.disconnectionHandlers.delete(handler);
  }

  async disconnect(): Promise<void> {
    for (const [peerId] of this.peers) {
      this.removePeer(peerId);
    }
    this.unsubSignaling?.();
    this.signaling.disconnect();
    this.roomId = null;
    this.hostId = null;
  }

  get connectedPeers(): string[] {
    return Array.from(this.peers.entries())
      .filter(([, conn]) => conn.isReady)
      .map(([id]) => id);
  }

  get currentRoomId(): string | null {
    return this.roomId;
  }

  get currentHostId(): string | null {
    return this.hostId;
  }

  get isHostPeer(): boolean {
    return this.isHost;
  }
}
