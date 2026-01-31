// ============================================
// CRYPTOPOLI - Player movement
// ============================================

import type { GameState, Player } from '../types';

export function movePlayer(
  player: Player,
  spaces: number,
  _state: GameState
): { newPosition: number; passedGo: boolean } {
  const oldPosition = player.position;
  let newPosition = (oldPosition + spaces) % 40;
  if (newPosition < 0) newPosition += 40;

  const passedGo = spaces > 0 && newPosition < oldPosition;

  return { newPosition, passedGo };
}
