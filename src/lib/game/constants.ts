// ============================================
// CRYPTOPOLY - Game constants (single place to tweak)
// ============================================

import type { PropertyGroup, TokenType } from './types';

// ─── Room code (client-side, same format as API) ─────────────────────────────
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** Generate a 6-character room code (for offline/paste mode; no server). */
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

// ─── Game name & branding ───────────────────────────────────────────────────
/** Display name of the game (logo, headers, page title). */
export const GAME_NAME = 'Cryptopoly';
/** Short tagline (home page, metadata). */
export const GAME_TAGLINE = 'The Crypto Trading Game';

// ─── Board tile names (index 0–39, same order as TILES) ──────────────────────
/** Display names for each board tile. Change these to rebrand or localize. */
export const TILE_NAMES: readonly string[] = [
  'Collect 200 USDT',      // 0  go
  'Dogecoin Den',          // 1
  'Airdrop',               // 2  community-chest
  'Shiba Inu Shack',       // 3
  'Gas Fees',              // 4  tax
  'Binance Station',       // 5  railroad
  'Polygon Plaza',         // 6
  'Market Volatility',     // 7  chance
  'Arbitrum Avenue',       // 8
  'Optimism Oasis',        // 9
  'Rug Pull Jail',         // 10 jail
  'Uniswap Unicorn',       // 11
  'Mining Farm',           // 12 utility
  'Aave Atrium',           // 13
  'Compound Castle',       // 14
  'Coinbase Central',      // 15 railroad
  'Cardano Cove',          // 16
  'Airdrop',               // 17 community-chest
  'Avalanche Alps',        // 18
  'Polkadot Park',         // 19
  'HODL Parking',          // 20 free-parking
  'Chainlink Link',        // 21
  'Market Volatility',     // 22 chance
  'Cosmos Hub',            // 23
  'Tezos Tower',           // 24
  'Kraken Depot',          // 25 railroad
  'Near Protocol',         // 26
  'Fantom Forest',         // 27
  'Staking Pool',          // 28 utility
  'Hedera Heights',        // 29
  'SEC Investigation',     // 30 go-to-jail
  'Solana Beach',          // 31
  'BNB Boulevard',         // 32
  'Airdrop',               // 33 community-chest
  'XRP Rapids',            // 34
  'OKX Terminal',          // 35 railroad
  'Market Volatility',     // 36 chance
  'Ethereum Heights',      // 37
  'Capital Gains Tax',     // 38 tax
  'Bitcoin Jungle',        // 39
];

/** Label for the Chance deck (e.g. card pile / UI). */
export const CHANCE_DECK_NAME = 'Market Volatility';
/** Label for the Community Chest deck (e.g. card pile / UI). */
export const COMMUNITY_CHEST_DECK_NAME = 'Airdrop';

// ─── Game rules ─────────────────────────────────────────────────────────────
/** Starting cash for each player (USDT). */
export const STARTING_MONEY = 1500;
/** Amount collected when passing or landing on Go. */
export const GO_SALARY = 200;
/** Cost to pay to get out of jail. */
export const JAIL_FINE = 50;
/** Max turns in jail before must pay or use card. */
export const MAX_JAIL_TURNS = 3;
/** Consecutive doubles allowed before “go to jail”. */
export const MAX_DOUBLES = 3;

// ─── Board layout ───────────────────────────────────────────────────────────
/** Total number of tiles on the board. */
export const BOARD_SIZE = 40;
/** Tile index for “in jail” / just visiting. */
export const JAIL_INDEX = 10;
/** Tile index for “Go to jail”. */
export const GO_TO_JAIL_INDEX = 30;
/** Tile indices for railroad (exchange) spaces. */
export const RAILROAD_TILE_INDICES: readonly number[] = [5, 15, 25, 35];
/** Tile indices for utility (mining/staking) spaces. */
export const UTILITY_TILE_INDICES: readonly number[] = [12, 28];

// ─── Economy ────────────────────────────────────────────────────────────────
/** Unmortgage cost = mortgage value × this (e.g. 1.1 = 10% interest). */
export const UNMORTGAGE_MULTIPLIER = 1.1;
/** Selling a house gives houseCost × this (e.g. 0.5 = half back). */
export const HOUSE_SELL_BACK_RATIO = 0.5;

// ─── Utility rent (dice × multiplier when owning 1 or 2 utilities) ──────────
export const UTILITY_RENT_1_MULTIPLIER = 4;
export const UTILITY_RENT_2_MULTIPLIER = 10;

// ─── Players ───────────────────────────────────────────────────────────────
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

// ─── Tokens (crypto-themed pieces) ───────────────────────────────────────────
/** Token types available for player selection, in display order. */
export const AVAILABLE_TOKENS: TokenType[] = [
  'bitcoin',
  'ethereum',
  'solana',
  'dogecoin',
  'cardano',
  'polkadot',
];

/** Default token when joining (first available). */
export const DEFAULT_TOKEN: TokenType = 'bitcoin';

// ─── House / hotel costs per property group ─────────────────────────────────
/** Cost to build one house (or hotel) per property group. */
export const HOUSE_COSTS: Record<PropertyGroup, number> = {
  meme: 50,
  layer2: 50,
  defi: 100,
  smart: 100,
  oracle: 150,
  rising: 150,
  layer1: 200,
  elite: 200,
  railroad: 0,
  utility: 0,
};
