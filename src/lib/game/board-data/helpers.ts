// ============================================
// CRYPTOPOLI - Board helpers
// ============================================

import type { PropertyGroup } from '../types';
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
  const railroads = [5, 15, 25, 35];
  for (const rr of railroads) {
    if (rr > fromIndex) return rr;
  }
  return railroads[0];
}

export function getNextUtilityIndex(fromIndex: number): number {
  const utilities = [12, 28];
  for (const util of utilities) {
    if (util > fromIndex) return util;
  }
  return utilities[0];
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
