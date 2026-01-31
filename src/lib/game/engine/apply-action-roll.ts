// ============================================
// CRYPTOPOLI - ROLL_DICE action handler
// ============================================

import type { GameState } from '../types';
import { TILES } from '../board-data';
import { GO_SALARY, JAIL_FINE, JAIL_INDEX, MAX_DOUBLES } from './constants';
import { getDiceTotal, isDoubles } from './dice';
import { movePlayer } from './movement';
import { getCurrentPlayer } from './players';
import { handleLandOnTile } from './tiles';

export function handleRollDice(
  newState: GameState,
  action: { type: 'ROLL_DICE'; playerId: string; result: [number, number]; seed: number }
): void {
  const currentPlayer = getCurrentPlayer(newState);
  if (!currentPlayer || currentPlayer.id !== action.playerId) return;

  if (
    newState.currentDiceRoll &&
    newState.currentDiceRoll[0] === action.result[0] &&
    newState.currentDiceRoll[1] === action.result[1] &&
    currentPlayer.hasRolled
  ) {
    return;
  }

  newState.currentDiceRoll = action.result;
  newState.lastDiceRollId = (newState.lastDiceRollId ?? 0) + 1;
  newState.lastDiceRollSeed = action.seed;
  const isDouble = isDoubles(action.result);
  const total = getDiceTotal(action.result);

  if (currentPlayer.inJail) {
    if (isDouble) {
      newState.players = {
        ...newState.players,
        [currentPlayer.id]: {
          ...currentPlayer,
          inJail: false,
          jailTurns: 0,
          hasRolled: true,
        },
      };
      const { newPosition, passedGo } = movePlayer(currentPlayer, total, newState);
      newState.players[currentPlayer.id].position = newPosition;
      if (passedGo) newState.players[currentPlayer.id].money += GO_SALARY;
    } else {
      const newJailTurns = currentPlayer.jailTurns + 1;
      if (newJailTurns >= 3) {
        newState.players = {
          ...newState.players,
          [currentPlayer.id]: {
            ...currentPlayer,
            inJail: false,
            jailTurns: 0,
            money: currentPlayer.money - JAIL_FINE,
            hasRolled: true,
          },
        };
        const { newPosition, passedGo } = movePlayer(newState.players[currentPlayer.id], total, newState);
        newState.players[currentPlayer.id].position = newPosition;
        if (passedGo) newState.players[currentPlayer.id].money += GO_SALARY;
      } else {
        newState.players = {
          ...newState.players,
          [currentPlayer.id]: {
            ...currentPlayer,
            jailTurns: newJailTurns,
            hasRolled: true,
          },
        };
        newState.turnPhase = 'end-turn';
      }
    }
    return;
  }

  if (isDouble) {
    newState.doublesCount += 1;
    if (newState.doublesCount >= MAX_DOUBLES) {
      newState.players = {
        ...newState.players,
        [currentPlayer.id]: {
          ...currentPlayer,
          position: JAIL_INDEX,
          inJail: true,
          hasRolled: true,
        },
      };
      newState.doublesCount = 0;
      newState.turnPhase = 'end-turn';
      return;
    }
  }

  const { newPosition, passedGo } = movePlayer(currentPlayer, total, newState);
  newState.players = {
    ...newState.players,
    [currentPlayer.id]: {
      ...currentPlayer,
      position: newPosition,
      money: passedGo ? currentPlayer.money + GO_SALARY : currentPlayer.money,
      hasRolled: true,
    },
  };

  newState.turnPhase = 'action';
  const landedTile = TILES[newPosition];
  handleLandOnTile(newState, currentPlayer.id, landedTile);
}
