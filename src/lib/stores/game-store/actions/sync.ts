// ============================================
// CRYPTOPOLI - State sync actions
// ============================================

import type { GameState, GameAction } from '../../../game/types';
import { applyAction } from '../../../game/engine';
import type { StoreSet, StoreGet } from '../types';

export function createSyncActions(set: StoreSet, get: StoreGet) {
  return {
    applyStateUpdate: (state: GameState) => {
      set(draft => {
        draft.gameState = state;
      });
    },

    applyActionFromNetwork: (action: GameAction) => {
      set(draft => {
        if (draft.gameState) {
          draft.gameState = applyAction(draft.gameState, action);
        }
      });
    },
  };
}
