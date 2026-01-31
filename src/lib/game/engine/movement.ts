// ============================================
// CRYPTOPOLY - Player movement
// ============================================

import type { GameState, Player } from '../types';
import { BOARD_SIZE } from './constants';

export function movePlayer(
  player: Player,
  spaces: number,
  _state: GameState
): { newPosition: number; passedGo: boolean } {
  const oldPosition = player.position;
  let newPosition = (oldPosition + spaces) % BOARD_SIZE;
  if (newPosition < 0) newPosition += BOARD_SIZE;

  const passedGo = spaces > 0 && newPosition < oldPosition;

  return { newPosition, passedGo };
}
