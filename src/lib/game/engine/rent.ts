// ============================================
// CRYPTOPOLY - Rent calculation
// ============================================

import type { GameState, Tile, PropertyTile, RailroadTile, UtilityTile } from '../types';
import { getTilesByGroup } from '../board-data';
import {
  RAILROAD_TILE_INDICES,
  UTILITY_TILE_INDICES,
  UTILITY_RENT_1_MULTIPLIER,
  UTILITY_RENT_2_MULTIPLIER,
} from './constants';
import { getDiceTotal } from './dice';

export function calculateRent(
  tile: Tile,
  state: GameState,
  diceRoll?: [number, number]
): number {
  if (tile.type !== 'property' && tile.type !== 'railroad' && tile.type !== 'utility') {
    return 0;
  }

  const propertyState = state.properties[tile.index];
  if (!propertyState || !propertyState.ownerId || propertyState.isMortgaged) {
    return 0;
  }

  if (tile.type === 'property') {
    const propTile = tile as PropertyTile;
    const houses = propertyState.houses;

    const groupTiles = getTilesByGroup(propTile.group);
    const hasMonopoly = groupTiles.every(
      t => state.properties[t.index]?.ownerId === propertyState.ownerId
    );

    if (houses === 0) {
      return hasMonopoly ? propTile.rent[0] * 2 : propTile.rent[0];
    }
    return propTile.rent[houses];
  }

  if (tile.type === 'railroad') {
    const rrTile = tile as RailroadTile;
    const ownerId = propertyState.ownerId;

    const ownedCount = RAILROAD_TILE_INDICES.filter(
      idx => state.properties[idx]?.ownerId === ownerId
    ).length;

    return rrTile.rent[ownedCount - 1] || 0;
  }

  if (tile.type === 'utility') {
    const ownerId = propertyState.ownerId;

    const ownedCount = UTILITY_TILE_INDICES.filter(
      idx => state.properties[idx]?.ownerId === ownerId
    ).length;

    const diceTotal = diceRoll ? getDiceTotal(diceRoll) : 7;

    if (ownedCount === 1) {
      return diceTotal * UTILITY_RENT_1_MULTIPLIER;
    }
    if (ownedCount === 2) {
      return diceTotal * UTILITY_RENT_2_MULTIPLIER;
    }
  }

  return 0;
}
