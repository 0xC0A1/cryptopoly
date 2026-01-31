// ============================================
// CRYPTOPOLI - Dice helpers
// ============================================

export function rollDice(): [number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
}

export function isDoubles(roll: [number, number]): boolean {
  return roll[0] === roll[1];
}

export function getDiceTotal(roll: [number, number]): number {
  return roll[0] + roll[1];
}
