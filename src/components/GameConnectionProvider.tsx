'use client';

import { useEffect, useRef } from 'react';
import { PeerManager } from '@/lib/networking/peer-manager';
import { PasteSignalingClient } from '@/lib/networking/paste-signaling';
import { useGameStore } from '@/lib/stores/game-store';
import type { NetworkMessage } from '@/lib/game/types';

/**
 * When the user is in a room (lobby or game), creates a PeerManager with the appropriate
 * signaling client (paste = no server, copy-paste SDP; server = HTTP polling), and wires
 * broadcast/sendToHost so actions sync over WebRTC.
 */
export function GameConnectionProvider({ children }: { children: React.ReactNode }) {
  const peerManagerRef = useRef<PeerManager | null>(null);
  const innerCleanupRef = useRef<(() => void) | null>(null);
  const roomId = useGameStore(state => state.roomId);
  const localPlayerId = useGameStore(state => state.localPlayerId);
  const isHost = useGameStore(state => state.isHost);
  const signalingMode = useGameStore(state => state.signalingMode);
  const gameState = useGameStore(state => state.gameState);
  const setConnectionCallbacks = useGameStore(state => state.setConnectionCallbacks);
  const setPasteSignalingActions = useGameStore(state => state.setPasteSignalingActions);
  const setPasteConnectionString = useGameStore(state => state.setPasteConnectionString);
  const setPasteResponseString = useGameStore(state => state.setPasteResponseString);
  const setPeerConnectionEstablished = useGameStore(state => state.setPeerConnectionEstablished);
  const applyActionFromNetwork = useGameStore(state => state.applyActionFromNetwork);
  const applyStateUpdate = useGameStore(state => state.applyStateUpdate);

  useEffect(() => {
    if (!roomId || !localPlayerId) {
      return;
    }

    const hostId = gameState?.hostId ?? null;
    const get = useGameStore.getState;

    const signaling =
      signalingMode === 'paste'
        ? new PasteSignalingClient({
            onConnectionStringReady: (s) => get().setPasteConnectionString(s),
            onResponseStringReady: (s) => get().setPasteResponseString(s),
          })
        : undefined;

    const peerManager = new PeerManager(localPlayerId, '', { signaling });
    peerManagerRef.current = peerManager;

    if (signaling && 'submitHostOffer' in signaling && 'submitGuestResponse' in signaling) {
      setPasteSignalingActions(
        (s: string) => (signaling as PasteSignalingClient).submitHostOffer(s),
        (s: string) => (signaling as PasteSignalingClient).submitGuestResponse(s)
      );
    }

    peerManager
      .attachToRoom(roomId, {
        isHost,
        hostId,
      })
      .then(() => {
        setConnectionCallbacks(
          (action) => {
            peerManager.broadcast({ type: 'ACTION_REQUEST', action });
          },
          (action) => {
            peerManager.sendToHost({ type: 'ACTION_REQUEST', action });
          }
        );

        const unsubMessage = peerManager.onMessage((fromPeerId, message: NetworkMessage) => {
          if (message.type === 'ACTION_REQUEST') {
            applyActionFromNetwork(message.action);
            if (isHost) {
              // Broadcast action to other peers so they can apply
              peerManager.broadcastExcept(message, fromPeerId);
              // Host is source of truth: always send full state back to the sender so their UI matches
              const state = useGameStore.getState().gameState;
              if (state) {
                peerManager.send(fromPeerId, { type: 'STATE_UPDATE', state });
              }
            }
          }
          if (message.type === 'STATE_UPDATE') {
            const current = useGameStore.getState().gameState;
            const localId = useGameStore.getState().localPlayerId;
            let state = message.state;
            // Never lose our own player: if host sent state before our JOIN_GAME was applied, merge ourselves in
            if (localId && current?.players[localId] && !state.players[localId]) {
              state = {
                ...state,
                players: { ...state.players, [localId]: current.players[localId] },
              };
            }
            applyStateUpdate(state);
          }
        });

        const unsubConnected = peerManager.onPeerConnected((peerId) => {
          setPeerConnectionEstablished(true);
          if (isHost) {
            // In lobby, wait for guest to send JOIN_GAME first; only push state when already in game (reconnect)
            const state = useGameStore.getState().gameState;
            if (state && state.phase !== 'lobby' && state.phase !== 'icon-selection') {
              peerManager.send(peerId, { type: 'STATE_UPDATE', state });
            }
          } else {
            // Guest: tell host we're here so they add us to game state
            sendJoinGameToHost(peerManager);
          }
        });

        // Guest: retry sending JOIN_GAME until we see 2+ players (handles slow/lost first message)
        let joinRetryCount = 0;
        const maxJoinRetries = 10;
        const joinRetryId = setInterval(() => {
          if (!isHost) {
            const state = useGameStore.getState().gameState;
            const playerCount = state ? Object.keys(state.players).length : 0;
            if (playerCount < 2 && joinRetryCount < maxJoinRetries) {
              joinRetryCount++;
              sendJoinGameToHost(peerManager);
            }
          }
        }, 2000);

        function sendJoinGameToHost(pm: PeerManager) {
          const { localPlayerId: pid, localPlayerName: name } = useGameStore.getState();
          if (pid && name) {
            pm.sendToHost({
              type: 'ACTION_REQUEST',
              action: { type: 'JOIN_GAME', playerId: pid, playerName: name },
            });
          }
        }

        const cleanup = () => {
          clearInterval(joinRetryId);
          unsubMessage();
          unsubConnected();
        };
        innerCleanupRef.current = cleanup;
        return cleanup;
      })
      .catch((err) => {
        console.error('[GameConnectionProvider] attachToRoom failed:', err);
      });

    return () => {
      innerCleanupRef.current?.();
      innerCleanupRef.current = null;
      const pm = peerManagerRef.current;
      peerManagerRef.current = null;
      setConnectionCallbacks(() => {}, () => {});
      setPasteSignalingActions(() => false, () => false);
      setPasteConnectionString(null);
      setPasteResponseString(null);
      setPeerConnectionEstablished(false);
      pm?.disconnect();
    };
  }, [roomId, localPlayerId, isHost, signalingMode]); // Intentionally not including gameState to avoid re-running when state updates

  return <>{children}</>;
}
