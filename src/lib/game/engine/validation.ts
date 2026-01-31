// ============================================
// CRYPTOPOLI - Validation helpers (can build, can sell, etc.)
// ============================================

import type { GameState, Player, PropertyTile, PropertyGroup, RailroadTile, UtilityTile } from '../types';
import { TILES, getTilesByGroup } from '../board-data';

export function canAfford(player: Player, amount: number): boolean {
  return player.money >= amount;
}

export function hasMonopoly(
  playerId: string,
  group: PropertyGroup,
  state: GameState
): boolean {
  const groupTiles = getTilesByGroup(group);
  return groupTiles.every(
    tile => state.properties[tile.index]?.ownerId === playerId
  );
}

export function canBuildHouse(
  playerId: string,
  tileIndex: number,
  state: GameState
): boolean {
  const tile = TILES[tileIndex];
  if (tile.type !== 'property') return false;

  const propTile = tile as PropertyTile;
  const propertyState = state.properties[tileIndex];

  if (propertyState?.ownerId !== playerId) return false;
  if (propertyState.isMortgaged) return false;
  if (!hasMonopoly(playerId, propTile.group, state)) return false;
  if (propertyState.houses >= 5) return false;

  const player = state.players[playerId];
  if (!canAfford(player, propTile.houseCost)) return false;

  const groupTiles = getTilesByGroup(propTile.group);
  const minHouses = Math.min(
    ...groupTiles.map(t => state.properties[t.index]?.houses || 0)
  );
  if (propertyState.houses > minHouses) return false;

  return true;
}

export function canSellHouse(
  playerId: string,
  tileIndex: number,
  state: GameState
): boolean {
  const tile = TILES[tileIndex];
  if (tile.type !== 'property') return false;

  const propertyState = state.properties[tileIndex];

  if (propertyState?.ownerId !== playerId) return false;
  if (propertyState.houses < 1) return false;

  const propTile = tile as PropertyTile;
  const groupTiles = getTilesByGroup(propTile.group);
  const maxHouses = Math.max(
    ...groupTiles.map(t => state.properties[t.index]?.houses || 0)
  );
  if (propertyState.houses < maxHouses) return false;

  return true;
}

export function getTotalAssets(playerId: string, state: GameState): number {
  const player = state.players[playerId];
  if (!player) return 0;

  let total = player.money;

  for (const tileIndex of player.properties) {
    const tile = TILES[tileIndex];
    const propertyState = state.properties[tileIndex];

    if (tile.type === 'property') {
      const propTile = tile as PropertyTile;
      if (propertyState.isMortgaged) {
        total += propTile.mortgage;
      } else {
        total += propTile.mortgage;
        total += propertyState.houses * (propTile.houseCost / 2);
      }
    } else if (tile.type === 'railroad' || tile.type === 'utility') {
      const otherTile = tile as RailroadTile | UtilityTile;
      total += otherTile.mortgage;
    }
  }

  return total;
}

export function checkWinner(state: GameState): string | null {
  const activePlayers = Object.values(state.players).filter(p => !p.isBankrupt);
  if (activePlayers.length === 1) {
    return activePlayers[0].id;
  }
  return null;
}
