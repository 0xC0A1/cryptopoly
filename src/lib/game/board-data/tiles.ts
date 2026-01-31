// ============================================
// CRYPTOPOLY - Board tiles
// ============================================

import type { Tile } from '../types';
import { HOUSE_COSTS, TILE_NAMES } from '../constants';

export const TILES: Tile[] = [
  { index: 0, type: 'go', name: TILE_NAMES[0] },
  { index: 1, type: 'property', name: TILE_NAMES[1], group: 'meme', price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: HOUSE_COSTS.meme, hotelCost: HOUSE_COSTS.meme, mortgage: 30 },
  { index: 2, type: 'community-chest', name: TILE_NAMES[2] },
  { index: 3, type: 'property', name: TILE_NAMES[3], group: 'meme', price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: HOUSE_COSTS.meme, hotelCost: HOUSE_COSTS.meme, mortgage: 30 },
  { index: 4, type: 'tax', name: TILE_NAMES[4], amount: 200 },
  { index: 5, type: 'railroad', name: TILE_NAMES[5], price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { index: 6, type: 'property', name: TILE_NAMES[6], group: 'layer2', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: HOUSE_COSTS.layer2, hotelCost: HOUSE_COSTS.layer2, mortgage: 50 },
  { index: 7, type: 'chance', name: TILE_NAMES[7] },
  { index: 8, type: 'property', name: TILE_NAMES[8], group: 'layer2', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: HOUSE_COSTS.layer2, hotelCost: HOUSE_COSTS.layer2, mortgage: 50 },
  { index: 9, type: 'property', name: TILE_NAMES[9], group: 'layer2', price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: HOUSE_COSTS.layer2, hotelCost: HOUSE_COSTS.layer2, mortgage: 60 },
  { index: 10, type: 'jail', name: TILE_NAMES[10] },
  { index: 11, type: 'property', name: TILE_NAMES[11], group: 'defi', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: HOUSE_COSTS.defi, hotelCost: HOUSE_COSTS.defi, mortgage: 70 },
  { index: 12, type: 'utility', name: TILE_NAMES[12], price: 150, mortgage: 75 },
  { index: 13, type: 'property', name: TILE_NAMES[13], group: 'defi', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: HOUSE_COSTS.defi, hotelCost: HOUSE_COSTS.defi, mortgage: 70 },
  { index: 14, type: 'property', name: TILE_NAMES[14], group: 'defi', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: HOUSE_COSTS.defi, hotelCost: HOUSE_COSTS.defi, mortgage: 80 },
  { index: 15, type: 'railroad', name: TILE_NAMES[15], price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { index: 16, type: 'property', name: TILE_NAMES[16], group: 'smart', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: HOUSE_COSTS.smart, hotelCost: HOUSE_COSTS.smart, mortgage: 90 },
  { index: 17, type: 'community-chest', name: TILE_NAMES[17] },
  { index: 18, type: 'property', name: TILE_NAMES[18], group: 'smart', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: HOUSE_COSTS.smart, hotelCost: HOUSE_COSTS.smart, mortgage: 90 },
  { index: 19, type: 'property', name: TILE_NAMES[19], group: 'smart', price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: HOUSE_COSTS.smart, hotelCost: HOUSE_COSTS.smart, mortgage: 100 },
  { index: 20, type: 'free-parking', name: TILE_NAMES[20] },
  { index: 21, type: 'property', name: TILE_NAMES[21], group: 'oracle', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: HOUSE_COSTS.oracle, hotelCost: HOUSE_COSTS.oracle, mortgage: 110 },
  { index: 22, type: 'chance', name: TILE_NAMES[22] },
  { index: 23, type: 'property', name: TILE_NAMES[23], group: 'oracle', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: HOUSE_COSTS.oracle, hotelCost: HOUSE_COSTS.oracle, mortgage: 110 },
  { index: 24, type: 'property', name: TILE_NAMES[24], group: 'oracle', price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: HOUSE_COSTS.oracle, hotelCost: HOUSE_COSTS.oracle, mortgage: 120 },
  { index: 25, type: 'railroad', name: TILE_NAMES[25], price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { index: 26, type: 'property', name: TILE_NAMES[26], group: 'rising', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: HOUSE_COSTS.rising, hotelCost: HOUSE_COSTS.rising, mortgage: 130 },
  { index: 27, type: 'property', name: TILE_NAMES[27], group: 'rising', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: HOUSE_COSTS.rising, hotelCost: HOUSE_COSTS.rising, mortgage: 130 },
  { index: 28, type: 'utility', name: TILE_NAMES[28], price: 150, mortgage: 75 },
  { index: 29, type: 'property', name: TILE_NAMES[29], group: 'rising', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: HOUSE_COSTS.rising, hotelCost: HOUSE_COSTS.rising, mortgage: 140 },
  { index: 30, type: 'go-to-jail', name: TILE_NAMES[30] },
  { index: 31, type: 'property', name: TILE_NAMES[31], group: 'layer1', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: HOUSE_COSTS.layer1, hotelCost: HOUSE_COSTS.layer1, mortgage: 150 },
  { index: 32, type: 'property', name: TILE_NAMES[32], group: 'layer1', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: HOUSE_COSTS.layer1, hotelCost: HOUSE_COSTS.layer1, mortgage: 150 },
  { index: 33, type: 'community-chest', name: TILE_NAMES[33] },
  { index: 34, type: 'property', name: TILE_NAMES[34], group: 'layer1', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: HOUSE_COSTS.layer1, hotelCost: HOUSE_COSTS.layer1, mortgage: 160 },
  { index: 35, type: 'railroad', name: TILE_NAMES[35], price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { index: 36, type: 'chance', name: TILE_NAMES[36] },
  { index: 37, type: 'property', name: TILE_NAMES[37], group: 'elite', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: HOUSE_COSTS.elite, hotelCost: HOUSE_COSTS.elite, mortgage: 175 },
  { index: 38, type: 'tax', name: TILE_NAMES[38], amount: 100 },
  { index: 39, type: 'property', name: TILE_NAMES[39], group: 'elite', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: HOUSE_COSTS.elite, hotelCost: HOUSE_COSTS.elite, mortgage: 200 },
];

export function getTilePosition(index: number): { x: number; z: number; rotation: number } {
  const boardSize = 10;
  const tileSize = boardSize / 5;

  if (index >= 0 && index <= 10) {
    return { x: boardSize - (index * tileSize), z: boardSize, rotation: 0 };
  }
  if (index >= 11 && index <= 20) {
    return { x: -boardSize, z: boardSize - ((index - 10) * tileSize), rotation: Math.PI / 2 };
  }
  if (index >= 21 && index <= 30) {
    return { x: -boardSize + ((index - 20) * tileSize), z: -boardSize, rotation: Math.PI };
  }
  return { x: boardSize, z: -boardSize + ((index - 30) * tileSize), rotation: -Math.PI / 2 };
}
