// ============================================
// CRYPTOPOLY - Board helpers
// ============================================

import type { PropertyGroup } from '../types';
import { RAILROAD_TILE_INDICES, UTILITY_TILE_INDICES } from '../constants';
import { TILES } from './tiles';

export function getPropertyTiles() {
  return TILES.filter(tile => tile.type === 'property');
}

export function getTilesByGroup(group: PropertyGroup) {
  return TILES.filter(tile => tile.type === 'property' && tile.group === group);
}

export function getRailroadTiles() {
  return TILES.filter(tile => tile.type === 'railroad');
}

export function getUtilityTiles() {
  return TILES.filter(tile => tile.type === 'utility');
}

export function getNextRailroadIndex(fromIndex: number): number {
  for (const rr of RAILROAD_TILE_INDICES) {
    if (rr > fromIndex) return rr;
  }
  return RAILROAD_TILE_INDICES[0];
}

export function getNextUtilityIndex(fromIndex: number): number {
  for (const util of UTILITY_TILE_INDICES) {
    if (util > fromIndex) return util;
  }
  return UTILITY_TILE_INDICES[0];
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
