// ============================================
// CRYPTOPOLI - Player helpers
// ============================================

import type { GameState, Player } from '../types';

export function getCurrentPlayer(state: GameState): Player | null {
  if (state.turnOrder.length === 0) return null;
  const playerId = state.turnOrder[state.currentPlayerIndex];
  return state.players[playerId] || null;
}

export function getNextPlayerIndex(state: GameState): number {
  let nextIndex = (state.currentPlayerIndex + 1) % state.turnOrder.length;
  let attempts = 0;

  while (attempts < state.turnOrder.length) {
    const playerId = state.turnOrder[nextIndex];
    const player = state.players[playerId];
    if (player && !player.isBankrupt) {
      return nextIndex;
    }
    nextIndex = (nextIndex + 1) % state.turnOrder.length;
    attempts++;
  }

  return state.currentPlayerIndex;
}
