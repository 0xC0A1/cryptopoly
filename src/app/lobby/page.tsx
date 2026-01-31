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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 overflow-auto">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)] rounded-full blur-[150px] opacity-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--secondary)] rounded-full blur-[150px] opacity-10" />
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gradient mb-2">Game Lobby</h1>
        <p className="text-white/60">Waiting for players to join...</p>
      </div>

      {/* Room Code */}
      <div className="card mb-8 text-center">
        <div className="text-sm text-white/60 mb-2">Room Code</div>
        <div className="flex items-center justify-center gap-4">
          <div className="text-4xl font-mono font-bold text-[var(--primary)] tracking-widest">
            {roomId}
          </div>
          <button
            onClick={copyRoomCode}
            className="btn btn-secondary text-sm px-4 py-2"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-sm text-white/40 mt-2">
          Share this code with friends to join the game
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Token Selection */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Choose Your Token</h2>
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
                    'p-4 rounded-xl transition-all duration-200',
                    'flex flex-col items-center gap-2',
                    'border-2',
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary)]/20'
                      : 'border-white/10 bg-white/5 hover:border-white/30',
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
                    <span className="text-xs text-[var(--primary)]">You</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Players List */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">
            Players ({players.length}/6)
          </h2>
          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ backgroundColor: TOKEN_COLORS[player.token] }}
                >
                  {TOKEN_SYMBOLS[player.token]}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">
                    {player.name}
                    {player.id === gameState?.hostId && (
                      <span className="ml-2 text-xs text-[var(--accent)]">Host</span>
                    )}
                  </div>
                  <div className="text-sm text-white/60">
                    {TOKEN_NAMES[player.token]}
                  </div>
                </div>
                {index === 0 && (
                  <div className="text-xs text-[var(--primary)] px-2 py-1 bg-[var(--primary)]/10 rounded">
                    #1
                  </div>
                )}
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 6 - players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-white/10"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="text-white/20">?</span>
                </div>
                <div className="text-white/30">Waiting for player...</div>
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
        <div className="mt-8 text-white/60">
          Waiting for host to start the game...
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => {
          useGameStore.getState().reset();
          router.push('/');
        }}
        className="mt-4 text-white/40 hover:text-white/60 transition-colors"
      >
        Leave Lobby
      </button>
    </div>
  );
}
