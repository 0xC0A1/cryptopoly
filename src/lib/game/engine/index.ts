// ============================================
// CRYPTOPOLI - Game engine (public API)
// ============================================

export {
  STARTING_MONEY,
  GO_SALARY,
  JAIL_FINE,
  MAX_JAIL_TURNS,
  MAX_DOUBLES,
  JAIL_INDEX,
  GO_TO_JAIL_INDEX,
} from './constants';

export { createInitialState, createPlayer } from './state';
export { rollDice, isDoubles, getDiceTotal } from './dice';
export { movePlayer } from './movement';
export { calculateRent } from './rent';
export {
  canAfford,
  hasMonopoly,
  canBuildHouse,
  canSellHouse,
  getTotalAssets,
  checkWinner,
} from './validation';
export { getCurrentPlayer } from './players';
export { applyAction } from './apply-action';
