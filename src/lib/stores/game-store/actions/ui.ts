// ============================================
// CRYPTOPOLI - UI and reset actions
// ============================================

import { nanoid } from 'nanoid';
import type { StoreSet, StoreGet } from '../types';

export function createUIActions(set: StoreSet, get: StoreGet) {
  return {
    setShowPropertyCard: (tileIndex: number | null) => {
      set(state => {
        state.showPropertyCard = tileIndex;
      });
    },

    addChatMessage: (playerId: string, playerName: string, message: string) => {
      set(state => {
        state.chatMessages.push({
          id: nanoid(),
          playerId,
          playerName,
          message,
          timestamp: Date.now(),
        });
        if (state.chatMessages.length > 100) {
          state.chatMessages = state.chatMessages.slice(-100);
        }
      });
    },

    sendChatMessage: (message: string) => {
      const { localPlayerId, localPlayerName } = get();
      if (!localPlayerId || !message.trim()) return;
      get().addChatMessage(localPlayerId, localPlayerName, message);
    },

    reset: () => {
      set(state => {
        state.roomId = null;
        state.localPlayerId = null;
        state.localPlayerName = '';
        state.isHost = false;
        state.isConnected = false;
        state.connectionError = null;
        state.gameState = null;
        state.selectedToken = null;
        state.isRolling = false;
        state.diceResult = null;
        state.showPropertyCard = null;
        state.chatMessages = [];
      });
    },
  };
}
