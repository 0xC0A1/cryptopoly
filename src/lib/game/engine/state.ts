// ============================================
// CRYPTOPOLI - Initial state and player creation
// ============================================

import type { GameState, Player, PropertyState, TokenType } from '../types';
import { TILES, CHANCE_CARDS, COMMUNITY_CHEST_CARDS, shuffleArray } from '../board-data';
import { STARTING_MONEY } from './constants';

function initializeProperties(): Record<number, PropertyState> {
  const properties: Record<number, PropertyState> = {};
  TILES.forEach(tile => {
    if (tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility') {
      properties[tile.index] = {
        ownerId: null,
        houses: 0,
        isMortgaged: false,
      };
    }
  });
  return properties;
}

export function createInitialState(roomId: string, hostId: string): GameState {
  return {
    roomId,
    hostId,
    phase: 'lobby',
    turnOrder: [],
    currentPlayerIndex: 0,
    turnPhase: 'pre-roll',
    currentDiceRoll: null,
    lastDiceRollId: 0,
    lastDiceRollSeed: undefined,
    doublesCount: 0,
    players: {},
    properties: initializeProperties(),
    chanceCards: shuffleArray(CHANCE_CARDS),
    communityChestCards: shuffleArray(COMMUNITY_CHEST_CARDS),
    drawnCard: null,
    freeParking: 0,
    pendingAction: null,
    tradeOffers: [],
    winnerId: null,
    createdAt: Date.now(),
    lastUpdateAt: Date.now(),
  };
}

export function createPlayer(id: string, name: string, token: TokenType): Player {
  return {
    id,
    name,
    token,
    position: 0,
    money: STARTING_MONEY,
    properties: [],
    inJail: false,
    jailTurns: 0,
    getOutOfJailCards: 0,
    isBankrupt: false,
    isConnected: true,
    hasRolled: false,
  };
}
