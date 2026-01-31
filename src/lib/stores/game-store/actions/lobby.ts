// ============================================
// CRYPTOPOLY - Lobby actions (create/join room, select token, start game)
// ============================================

import { nanoid } from 'nanoid';
import type { GameAction } from '../../../game/types';
import { createInitialState } from '../../../game/engine';
import { shuffleArray } from '../../../game/board-data';
import { generateRoomCode } from '../../../game/constants';
import { HOST_PEER_ID } from '../../../networking/paste-signaling';
import type { StoreSet, StoreGet } from '../types';

export function createLobbyActions(set: StoreSet, get: StoreGet) {
  return {
    setConnectionCallbacks: (broadcast: (action: GameAction) => void, sendToHost: (action: GameAction) => void) => {
      set(state => {
        state.broadcastAction = broadcast;
        state.sendToHost = sendToHost;
      });
    },

    setPasteSignalingActions: (submitHost: (s: string) => boolean, submitGuest: (s: string) => boolean) => {
      set(state => {
        state.submitPasteHostOffer = submitHost;
        state.submitPasteGuestResponse = submitGuest;
      });
    },

    setPasteConnectionString: (s: string | null) => {
      set(state => { state.pasteConnectionString = s; });
    },

    setPasteResponseString: (s: string | null) => {
      set(state => { state.pasteResponseString = s; });
    },

    /** Create room without server (copy-paste signaling). Default for P2P. */
    createRoomOffline: async (playerName: string): Promise<string | null> => {
      const playerId = nanoid();
      const roomId = generateRoomCode();
      set(state => {
        state.roomId = roomId;
        state.localPlayerId = playerId;
        state.localPlayerName = playerName;
        state.isHost = true;
        state.isConnected = true;
        state.signalingMode = 'paste';
        state.pasteConnectionString = null;
        state.pasteResponseString = null;
        state.peerConnectionEstablished = false;
        state.gameState = createInitialState(roomId, playerId);
      });
      const action: GameAction = { type: 'JOIN_GAME', playerId, playerName };
      get().applyActionFromNetwork(action);
      return roomId;
    },

    /** Join room without server; guest pastes host's connection string in lobby. */
    joinRoomOffline: async (roomId: string, playerName: string): Promise<string | null> => {
      const playerId = nanoid();
      set(state => {
        state.roomId = roomId.toUpperCase();
        state.localPlayerId = playerId;
        state.localPlayerName = playerName;
        state.isHost = false;
        state.isConnected = true;
        state.signalingMode = 'paste';
        state.pasteConnectionString = null;
        state.pasteResponseString = null;
        state.peerConnectionEstablished = false;
        state.gameState = createInitialState(roomId.toUpperCase(), HOST_PEER_ID);
      });
      const action: GameAction = { type: 'JOIN_GAME', playerId, playerName };
      get().applyActionFromNetwork(action);
      return roomId.toUpperCase();
    },

    createRoom: async (playerName: string): Promise<string | null> => {
      const playerId = nanoid();
      try {
        const response = await fetch('/api/signaling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create-room', peerId: playerId }),
        });
        if (!response.ok) throw new Error('Failed to create room');

        const data = await response.json();
        const roomId = data.roomId;

        set(state => {
          state.roomId = roomId;
          state.localPlayerId = playerId;
          state.localPlayerName = playerName;
          state.isHost = true;
          state.isConnected = true;
          state.signalingMode = 'server';
          state.gameState = createInitialState(roomId, playerId);
        });

        const action: GameAction = { type: 'JOIN_GAME', playerId, playerName };
        get().applyActionFromNetwork(action);
        return roomId;
      } catch (error) {
        console.error('Failed to create room:', error);
        set(state => { state.connectionError = 'Failed to create room'; });
        return null;
      }
    },

    joinRoom: async (roomId: string, playerName: string): Promise<string | null> => {
      const playerId = nanoid();
      try {
        const response = await fetch('/api/signaling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'join-room', peerId: playerId, roomId: roomId.toUpperCase() }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Room not found');
        }

        const data = await response.json();
        set(state => {
          state.roomId = data.roomId;
          state.localPlayerId = playerId;
          state.localPlayerName = playerName;
          state.isHost = false;
          state.isConnected = true;
          state.signalingMode = 'server';
          state.gameState = createInitialState(data.roomId, data.hostId);
        });

        const action: GameAction = { type: 'JOIN_GAME', playerId, playerName };
        get().applyActionFromNetwork(action);
        return data.roomId;
      } catch (error) {
        console.error('Failed to join room:', error);
        set(state => {
          state.connectionError = error instanceof Error ? error.message : 'Failed to join room';
        });
        return null;
      }
    },

    selectToken: (token: import('../../../game/types').TokenType) => {
      const { localPlayerId, isHost, broadcastAction, sendToHost, gameState } = get();
      if (!localPlayerId || !gameState) return;

      const takenTokens = Object.values(gameState.players).map(p => p.token);
      if (takenTokens.includes(token) && gameState.players[localPlayerId]?.token !== token) return;

      const action: GameAction = { type: 'SELECT_TOKEN', playerId: localPlayerId, token };
      set(state => { state.selectedToken = token; });

      if (isHost) {
        get().applyActionFromNetwork(action);
        broadcastAction?.(action);
      } else {
        sendToHost?.(action);
      }
    },

    startGame: () => {
      const { isHost, broadcastAction, gameState } = get();
      if (!isHost || !gameState) return;

      const turnOrder = shuffleArray(Object.keys(gameState.players));
      const action: GameAction = { type: 'START_GAME', turnOrder };
      get().applyActionFromNetwork(action);
      broadcastAction?.(action);
    },
  };
}
