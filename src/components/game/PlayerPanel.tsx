'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/lib/stores/game-store';
import { getCurrentPlayer } from '@/lib/game/engine';
import { TOKEN_COLORS, Player } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  isLocalPlayer: boolean;
}

function PlayerCard({ player, isCurrentPlayer, isLocalPlayer }: PlayerCardProps) {
  const tokenColor = TOKEN_COLORS[player.token];

  return (
    <div
      className={cn(
        'p-3 rounded-xl transition-all duration-300',
        'bg-white/5 border border-white/10',
        isCurrentPlayer && 'border-[var(--primary)] glow-primary',
        isLocalPlayer && 'bg-white/10',
        player.isBankrupt && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Token indicator */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: tokenColor }}
        >
          <span className="text-lg font-bold text-white">
            {player.token === 'bitcoin' && '₿'}
            {player.token === 'ethereum' && 'Ξ'}
            {player.token === 'solana' && '◎'}
            {player.token === 'dogecoin' && 'Ð'}
            {player.token === 'cardano' && 'A'}
            {player.token === 'polkadot' && '●'}
          </span>
        </div>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white truncate">
              {player.name}
            </span>
            {isLocalPlayer && (
              <span className="text-xs text-[var(--primary)]">(You)</span>
            )}
            {isCurrentPlayer && (
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            )}
          </div>
          <div className="text-sm text-[var(--primary)] font-mono">
            ${player.money.toLocaleString()}
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex flex-col items-end gap-1">
          {player.inJail && (
            <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
              In Jail
            </span>
          )}
          {player.isBankrupt && (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-500/20 text-gray-400">
              Bankrupt
            </span>
          )}
          {player.properties.length > 0 && (
            <span className="text-xs text-white/60">
              {player.properties.length} properties
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlayerPanel() {
  const gameState = useGameStore(state => state.gameState);
  const localPlayerId = useGameStore(state => state.localPlayerId);
  const playersRecord = useGameStore(useShallow(state => state.gameState?.players ?? {}));

  const players = useMemo(() => Object.values(playersRecord), [playersRecord]);
  const currentPlayer = gameState ? getCurrentPlayer(gameState) : null;

  if (!gameState || gameState.phase === 'lobby') return null;

  return (
    <div className="glass rounded-2xl p-4 w-64">
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <span className="text-[var(--primary)]">Players</span>
        <span className="text-sm text-white/40">({players.length})</span>
      </h2>

      <div className="space-y-2">
        {players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            isCurrentPlayer={currentPlayer?.id === player.id}
            isLocalPlayer={player.id === localPlayerId}
          />
        ))}
      </div>

      {/* Free Parking Money */}
      {gameState.freeParking > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <div className="text-sm text-yellow-400">Free Parking</div>
          <div className="text-lg font-bold text-yellow-500">
            ${gameState.freeParking.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
