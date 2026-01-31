'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/lib/stores/game-store';
import { getCurrentPlayer } from '@/lib/game/engine';
import { TOKEN_IMAGES, TOKEN_NAMES, Player } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  isLocalPlayer: boolean;
}

function PlayerCard({ player, isCurrentPlayer, isLocalPlayer }: PlayerCardProps) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg transition-colors duration-150',
        'border',
        isCurrentPlayer && 'border-white bg-white/5',
        !isCurrentPlayer && 'border-white/20 bg-black',
        isLocalPlayer && 'bg-white/5',
        player.isBankrupt && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Token indicator */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-black/20">
          <img
            src={TOKEN_IMAGES[player.token]}
            alt={TOKEN_NAMES[player.token]}
            className="w-8 h-8 object-contain"
          />
        </div>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate text-sm">
              {player.name}
            </span>
            {isLocalPlayer && (
              <span className="text-xs text-white/70">(You)</span>
            )}
            {isCurrentPlayer && (
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </div>
          <div className="text-xs text-white/70 font-medium">
            ${player.money.toLocaleString()}
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex flex-col items-end gap-1">
          {player.inJail && (
            <span className="text-xs px-2 py-0.5 rounded border border-white/30 text-white/80">
              In Jail
            </span>
          )}
          {player.isBankrupt && (
            <span className="text-xs px-2 py-0.5 rounded border border-white/20 text-white/50">
              Bankrupt
            </span>
          )}
          {player.properties.length > 0 && (
            <span className="text-xs text-white/50">
              {player.properties.length} props
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
    <div className="rounded-lg border border-white/20 bg-black/90 p-4 w-64">
      <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
        Players
        <span className="text-xs text-white/50 font-normal">({players.length})</span>
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
        <div className="mt-4 p-3 rounded-lg border border-white/20">
          <div className="text-xs text-white/60">Free Parking</div>
          <div className="text-base font-semibold text-white">
            ${gameState.freeParking.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
