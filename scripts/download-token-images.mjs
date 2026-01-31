#!/usr/bin/env node
/**
 * Download token logos from CoinGecko into public/assets/tokens.
 * Run: node scripts/download-token-images.mjs  (or pnpm download-token-images)
 */
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'assets', 'tokens');

const COINGECKO_IMAGES = {
  bitcoin: 'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png?1696501400',
  ethereum: 'https://coin-images.coingecko.com/coins/images/279/small/ethereum.png?1696501628',
  solana: 'https://coin-images.coingecko.com/coins/images/4128/small/solana.png?1718769756',
  dogecoin: 'https://coin-images.coingecko.com/coins/images/5/small/dogecoin.png?1696501409',
  cardano: 'https://coin-images.coingecko.com/coins/images/975/small/cardano.png?1696502090',
  polkadot: 'https://coin-images.coingecko.com/coins/images/12171/small/polkadot.jpg?1766533446',
};

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const [token, url] of Object.entries(COINGECKO_IMAGES)) {
    const ext = url.includes('.jpg') ? '.jpg' : '.png';
    const path = join(OUT_DIR, `${token}${ext}`);
    const buf = await download(url);
    await writeFile(path, buf);
    console.log(`Saved ${token}${ext}`);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
