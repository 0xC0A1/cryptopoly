// ============================================
// CRYPTOPOLI - Chance cards (Market Volatility)
// ============================================

import type { Card } from '../types';

export const CHANCE_CARDS: Card[] = [
  { id: 'chance-1', type: 'chance', title: 'Bull Run!', description: 'Advance to Bitcoin Jungle. If you pass GO, collect $200.', action: { type: 'move-to', tileIndex: 39, collectGo: true } },
  { id: 'chance-2', type: 'chance', title: 'Pump It!', description: 'Advance to Solana Beach. If you pass GO, collect $200.', action: { type: 'move-to', tileIndex: 31, collectGo: true } },
  { id: 'chance-3', type: 'chance', title: 'Exchange Listing', description: 'Advance to the nearest Exchange. Pay owner twice the normal rent.', action: { type: 'advance-to-nearest', tileType: 'railroad', payMultiple: 2 } },
  { id: 'chance-4', type: 'chance', title: 'Mining Rewards', description: 'Advance to nearest Mining/Staking. Pay owner 10x dice roll.', action: { type: 'advance-to-nearest', tileType: 'utility', payMultiple: 10 } },
  { id: 'chance-5', type: 'chance', title: 'Staking Rewards', description: 'Bank pays you dividend of $50.', action: { type: 'collect', amount: 50 } },
  { id: 'chance-6', type: 'chance', title: 'Get Out of Jail Free', description: 'Keep this card until needed. Get out of Rug Pull Jail free.', action: { type: 'get-out-of-jail-free' } },
  { id: 'chance-7', type: 'chance', title: 'Flash Crash', description: 'Go back 3 spaces.', action: { type: 'move-back', spaces: 3 } },
  { id: 'chance-8', type: 'chance', title: 'SEC Investigation', description: 'Go directly to Rug Pull Jail. Do not pass GO. Do not collect $200.', action: { type: 'go-to-jail' } },
  { id: 'chance-9', type: 'chance', title: 'Smart Contract Bug', description: 'Make general repairs on all your properties: $25 per house, $100 per hotel.', action: { type: 'repairs', perHouse: 25, perHotel: 100 } },
  { id: 'chance-10', type: 'chance', title: 'Network Fee Spike', description: 'Pay poor tax of $15.', action: { type: 'pay', amount: 15 } },
  { id: 'chance-11', type: 'chance', title: 'Layer 2 Migration', description: 'Advance to Polygon Plaza. If you pass GO, collect $200.', action: { type: 'move-to', tileIndex: 6, collectGo: true } },
  { id: 'chance-12', type: 'chance', title: 'DeFi Summer', description: 'Advance to Uniswap Unicorn. If you pass GO, collect $200.', action: { type: 'move-to', tileIndex: 11, collectGo: true } },
  { id: 'chance-13', type: 'chance', title: 'VC Funding Round', description: 'Your building and loan matures. Collect $150.', action: { type: 'collect', amount: 150 } },
  { id: 'chance-14', type: 'chance', title: 'Whale Alert', description: 'You have been elected Chairman of the Board. Pay each player $50.', action: { type: 'pay-each-player', amount: 50 } },
  { id: 'chance-15', type: 'chance', title: 'Return to Genesis', description: 'Advance to GO. Collect $200.', action: { type: 'move-to', tileIndex: 0, collectGo: false } },
  { id: 'chance-16', type: 'chance', title: 'Exchange Hack', description: 'Advance to the nearest Exchange. Pay owner twice the normal rent.', action: { type: 'advance-to-nearest', tileType: 'railroad', payMultiple: 2 } },
];
