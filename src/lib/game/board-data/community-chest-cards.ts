// ============================================
// CRYPTOPOLI - Community Chest cards (Airdrop)
// ============================================

import type { Card } from '../types';

export const COMMUNITY_CHEST_CARDS: Card[] = [
  { id: 'chest-1', type: 'community-chest', title: 'Retroactive Airdrop', description: 'Advance to GO. Collect $200.', action: { type: 'move-to', tileIndex: 0, collectGo: false } },
  { id: 'chest-2', type: 'community-chest', title: 'Protocol Treasury', description: 'Bank error in your favor. Collect $200.', action: { type: 'collect', amount: 200 } },
  { id: 'chest-3', type: 'community-chest', title: 'Tax Return', description: "Doctor's fees. Pay $50.", action: { type: 'pay', amount: 50 } },
  { id: 'chest-4', type: 'community-chest', title: 'NFT Sale', description: 'From sale of NFTs you get $50.', action: { type: 'collect', amount: 50 } },
  { id: 'chest-5', type: 'community-chest', title: 'Get Out of Jail Free', description: 'Keep this card until needed. Get out of Rug Pull Jail free.', action: { type: 'get-out-of-jail-free' } },
  { id: 'chest-6', type: 'community-chest', title: 'SEC Investigation', description: 'Go directly to Rug Pull Jail. Do not pass GO. Do not collect $200.', action: { type: 'go-to-jail' } },
  { id: 'chest-7', type: 'community-chest', title: 'Holiday Airdrop', description: 'Xmas fund matures. Collect $100.', action: { type: 'collect', amount: 100 } },
  { id: 'chest-8', type: 'community-chest', title: 'Tax Refund', description: 'Income tax refund. Collect $20.', action: { type: 'collect', amount: 20 } },
  { id: 'chest-9', type: 'community-chest', title: 'Community Rewards', description: 'It is your birthday. Collect $10 from every player.', action: { type: 'collect-from-each', amount: 10 } },
  { id: 'chest-10', type: 'community-chest', title: 'Life Insurance', description: 'Life insurance matures. Collect $100.', action: { type: 'collect', amount: 100 } },
  { id: 'chest-11', type: 'community-chest', title: 'Hospital Fees', description: 'Pay hospital $100.', action: { type: 'pay', amount: 100 } },
  { id: 'chest-12', type: 'community-chest', title: 'School Fees', description: 'Pay school tax of $150.', action: { type: 'pay', amount: 150 } },
  { id: 'chest-13', type: 'community-chest', title: 'Consulting Fee', description: 'Receive $25 consultancy fee.', action: { type: 'collect', amount: 25 } },
  { id: 'chest-14', type: 'community-chest', title: 'Property Assessment', description: 'You are assessed for street repairs: $40 per house, $115 per hotel.', action: { type: 'repairs', perHouse: 40, perHotel: 115 } },
  { id: 'chest-15', type: 'community-chest', title: 'Hackathon Prize', description: 'You have won second prize in a hackathon. Collect $10.', action: { type: 'collect', amount: 10 } },
  { id: 'chest-16', type: 'community-chest', title: 'Token Sale', description: 'From token sale you inherit $100.', action: { type: 'collect', amount: 100 } },
];
