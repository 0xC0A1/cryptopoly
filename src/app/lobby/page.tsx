'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/lib/stores/game-store';
import { TokenType, TOKEN_COLORS, TOKEN_NAMES, Player } from '@/lib/game/types';
import { cn } from '@/lib/utils';

const AVAILABLE_TOKENS: TokenType[] = ['bitcoin', 'ethereum', 'solana', 'dogecoin', 'cardano', 'polkadot'];

const TOKEN_SYMBOLS: Record<TokenType, string> = {
  bitcoin: '₿',
  ethereum: 'Ξ',
  solana: '◎',
  dogecoin: 'Ð',
  cardano: 'A',
  polkadot: '●',
};

export default function LobbyPage() {
  const router = useRouter();
  const roomId = useGameStore(state => state.roomId);
  const isHost = useGameStore(state => state.isHost);
  const gameState = useGameStore(state => state.gameState);
  const localPlayerId = useGameStore(state => state.localPlayerId);
  const selectToken = useGameStore(state => state.selectToken);
  const startGame = useGameStore(state => state.startGame);

  // Use useShallow to properly compare the players object
  const playersRecord = useGameStore(useShallow(state => state.gameState?.players ?? {}));
  const players = useMemo(() => Object.values(playersRecord), [playersRecord]);
  const myPlayer = localPlayerId ? playersRecord[localPlayerId] : null;

  const [copied, setCopied] = useState(false);

  // Redirect to home if no room
  useEffect(() => {
    if (!roomId && !gameState) {
      router.push('/');
    }
  }, [roomId, gameState, router]);

  // Redirect to game when it starts
  useEffect(() => {
    if (gameState?.phase === 'playing') {
      router.push(`/game/${roomId}`);
    }
  }, [gameState?.phase, roomId, router]);

  const copyRoomCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const takenTokens = players.map(p => p.token);
  const canStart = players.length >= 2 && players.length <= 6;

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 overflow-auto bg-black">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-white mb-2">Game Lobby</h1>
        <p className="text-white/60">Waiting for players to join...</p>
      </div>

      {/* Room Code */}
      <div className="card mb-8 text-center">
        <div className="text-sm text-white/60 mb-2">Room Code</div>
        <div className="flex items-center justify-center gap-4">
          <div className="text-3xl font-semibold text-white tracking-widest">
            {roomId}
          </div>
          <button
            onClick={copyRoomCode}
            className="btn btn-secondary text-sm px-4 py-2"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-sm text-white/50 mt-2">
          Share this code with friends to join the game
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Token Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Choose Your Token</h2>
          <p className="text-sm text-white/50 mb-3">
            Pick a token; others will see which are taken.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {AVAILABLE_TOKENS.map(token => {
              const isTaken = takenTokens.includes(token) && myPlayer?.token !== token;
              const isSelected = myPlayer?.token === token;
              const takenBy = players.find(p => p.token === token);

              return (
                <button
                  key={token}
                  onClick={() => !isTaken && selectToken(token)}
                  disabled={isTaken}
                  className={cn(
                    'p-4 rounded-lg transition-colors duration-150',
                    'flex flex-col items-center gap-2',
                    'border',
                    isSelected
                      ? 'border-white bg-white/10'
                      : 'border-white/20 bg-black hover:border-white/40',
                    isTaken && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: TOKEN_COLORS[token] }}
                  >
                    {TOKEN_SYMBOLS[token]}
                  </div>
                  <span className="text-sm text-white">{TOKEN_NAMES[token]}</span>
                  {isTaken && takenBy && (
                    <span className="text-xs text-white/50">Taken by {takenBy.name}</span>
                  )}
                  {isSelected && (
                    <span className="text-xs text-white/80">You</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Players List */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">
            Players ({players.length}/6)
          </h2>
          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-white/10"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ backgroundColor: TOKEN_COLORS[player.token] }}
                >
                  {TOKEN_SYMBOLS[player.token]}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">
                    {player.name}
                    {player.id === gameState?.hostId && (
                      <span className="ml-2 text-xs text-white/60">Host</span>
                    )}
                  </div>
                  <div className="text-sm text-white/60">
                    {TOKEN_NAMES[player.token]}
                  </div>
                </div>
                {index === 0 && (
                  <div className="text-xs text-white/70 px-2 py-1 border border-white/20 rounded">
                    #1
                  </div>
                )}
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 6 - players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-white/20"
              >
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                  <span className="text-white/30">?</span>
                </div>
                <div className="text-white/40 text-sm">Waiting for player...</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Start Game Button */}
      {isHost && (
        <div className="mt-8 text-center">
          {players.length < 2 && (
            <p className="text-sm text-white/50 mb-2">
              Other players will appear above when they join with the room code.
            </p>
          )}
          <button
            onClick={startGame}
            disabled={!canStart}
            className="btn btn-primary text-lg px-8 py-4"
          >
            {players.length < 2
              ? 'Need at least 2 players'
              : 'Start Game'}
          </button>
        </div>
      )}

      {!isHost && (
        <div className="mt-8 text-white/60 text-sm">
          Waiting for host to start the game...
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => {
          useGameStore.getState().reset();
          router.push('/');
        }}
        className="mt-4 text-sm text-white/50 hover:text-white/70 transition-colors"
      >
        Leave Lobby
      </button>
    </div>
  );
}
