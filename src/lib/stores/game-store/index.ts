// ============================================
// CRYPTOPOLI - Game store (Zustand)
// ============================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { TILES } from '../../game/board-data';
import type { GameStore } from './types';
import { createLobbyActions } from './actions/lobby';
import { createGameActions } from './actions/game';
import { createTradeActions } from './actions/trade';
import { createSyncActions } from './actions/sync';
import { createUIActions } from './actions/ui';

const initialState = {
  roomId: null as string | null,
  localPlayerId: null as string | null,
  localPlayerName: '',
  isHost: false,
  isConnected: false,
  connectionError: null as string | null,
  gameState: null as GameStore['gameState'],
  selectedToken: null as GameStore['selectedToken'],
  isRolling: false,
  diceResult: null as [number, number] | null,
  showPropertyCard: null as number | null,
  chatMessages: [] as GameStore['chatMessages'],
  broadcastAction: null as GameStore['broadcastAction'],
  sendToHost: null as GameStore['sendToHost'],
};

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    ...initialState,

    ...createLobbyActions(set, get),
    ...createGameActions(set, get),
    ...createTradeActions(get),
    ...createSyncActions(set, get),
    ...createUIActions(set, get),
  }))
);

export const selectTile = (index: number) => TILES[index];
