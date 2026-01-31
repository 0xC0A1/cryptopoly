'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/lib/stores/game-store';
import { TokenType, TOKEN_COLORS, TOKEN_NAMES, TOKEN_IMAGES, Player } from '@/lib/game/types';
import { cn } from '@/lib/utils';

const AVAILABLE_TOKENS: TokenType[] = ['bitcoin', 'ethereum', 'solana', 'dogecoin', 'cardano', 'polkadot'];

const PENDING_OFFER_KEY = (roomId: string) => `cryptopoli_pendingOffer_${roomId}`;
const PENDING_GUEST_RESPONSE_KEY = 'cryptopoli_pendingGuestResponse';

export default function LobbyPage() {
  const router = useRouter();
  const roomId = useGameStore(state => state.roomId);
  const isHost = useGameStore(state => state.isHost);
  const signalingMode = useGameStore(state => state.signalingMode);
  const gameState = useGameStore(state => state.gameState);
  const localPlayerId = useGameStore(state => state.localPlayerId);
  const pasteConnectionString = useGameStore(state => state.pasteConnectionString);
  const pasteResponseString = useGameStore(state => state.pasteResponseString);
  const peerConnectionEstablished = useGameStore(state => state.peerConnectionEstablished);
  const submitPasteHostOffer = useGameStore(state => state.submitPasteHostOffer);
  const submitPasteGuestResponse = useGameStore(state => state.submitPasteGuestResponse);
  const selectToken = useGameStore(state => state.selectToken);
  const startGame = useGameStore(state => state.startGame);

  // Use useShallow to properly compare the players object
  const playersRecord = useGameStore(useShallow(state => state.gameState?.players ?? {}));
  const players = useMemo(() => Object.values(playersRecord), [playersRecord]);
  const myPlayer = localPlayerId ? playersRecord[localPlayerId] : null;

  const [copied, setCopied] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [pasteError, setPasteError] = useState('');
  const isPasteMode = signalingMode === 'paste';

  /** Guests in paste mode see Step 3 until the host pastes their link (peer connection established). */
  const showGuestStep3Only = isPasteMode && !isHost && !peerConnectionEstablished;

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

  // Paste mode: inject pending offer (guest) or pending guest response (host) from sessionStorage
  useEffect(() => {
    if (!isPasteMode || !roomId || typeof window === 'undefined') return;
    try {
      if (!isHost) {
        const pending = sessionStorage.getItem(PENDING_OFFER_KEY(roomId));
        if (pending && submitPasteHostOffer?.(pending)) {
          sessionStorage.removeItem(PENDING_OFFER_KEY(roomId));
        }
      } else {
        const pending = sessionStorage.getItem(PENDING_GUEST_RESPONSE_KEY);
        if (pending && submitPasteGuestResponse?.(pending)) {
          sessionStorage.removeItem(PENDING_GUEST_RESPONSE_KEY);
        }
      }
    } catch {
      // ignore
    }
  }, [isPasteMode, isHost, roomId, submitPasteHostOffer, submitPasteGuestResponse]);

  const takenTokens = players.map(p => p.token);
  const canStart = players.length >= 2 && players.length <= 6;

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  // Guests in paste mode: dedicated Step 3 screen (give link to host) until they continue
  if (showGuestStep3Only) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-black">
        <div className="card w-full max-w-md">
          <p className="text-sm text-white/50 mb-1">Step 3 of 3</p>
          <h1 className="text-xl font-semibold text-white mb-2">Give this link to the host</h1>
          <p className="text-sm text-white/70 mb-4">
            Send this link to the host. They open it (or paste it on the connect page) to complete the connection. You’ll join the lobby once they do.
          </p>
          {pasteResponseString ? (
            <div className="flex gap-2 mb-4">
              <input
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/connect#${pasteResponseString}` : ''}
                className="flex-1 min-w-0 p-3 rounded-lg bg-white/5 border border-white/20 text-white text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(`${window.location.origin}/connect#${pasteResponseString}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="btn btn-secondary shrink-0"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm flex items-center gap-2 mb-4">
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Generating your link…
            </div>
          )}
          <p className="text-sm text-white/50 mb-4">
            Waiting for the host to open your link…
          </p>
          <button
            onClick={() => {
              useGameStore.getState().reset();
              router.push('/');
            }}
            className="mt-4 w-full text-sm text-white/50 hover:text-white/70 transition-colors"
          >
            Leave Lobby
          </button>
        </div>
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

      {/* Paste-mode connection: shareable links only (no server, no room code) */}
      {isPasteMode && (
        <div className="card mb-8 w-full max-w-2xl">
          <h2 className="text-lg font-semibold text-white mb-3">
            {isHost ? 'Connect (no server)' : 'Step 3: Give this link to the host'}
          </h2>
          {!isHost && (
            <p className="text-sm text-white/50 mb-3">Step 3 of 3</p>
          )}
          {isHost ? (
            <>
              <div className="mb-4">
                <label className="block text-sm text-white/70 mb-1">Join link — share with the other player</label>
                <p className="text-xs text-white/50 mb-2">They open this link (or paste it on the join page) and enter their name.</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={
                      pasteConnectionString
                        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${roomId}#${pasteConnectionString}`
                        : 'Generating…'
                    }
                    className="flex-1 min-w-0 p-3 rounded-lg bg-white/5 border border-white/20 text-white text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (pasteConnectionString && typeof window !== 'undefined') {
                        const url = `${window.location.origin}/join/${roomId}#${pasteConnectionString}`;
                        navigator.clipboard.writeText(url);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    disabled={!pasteConnectionString}
                    className="btn btn-secondary shrink-0"
                  >
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">When they connect, they’ll send you a link — open it to complete</label>
                <p className="text-xs text-white/50 mb-2">Or paste the link below and click Connect.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pasteInput}
                    onChange={(e) => { setPasteInput(e.target.value); setPasteError(''); }}
                    placeholder="https://…/connect#…"
                    className="flex-1 min-w-0 p-3 rounded-lg bg-white/5 border border-white/20 text-white text-sm placeholder:text-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const raw = pasteInput.trim();
                      const hash = raw.startsWith('http') ? (() => { try { return new URL(raw).hash.slice(1); } catch { return raw; } })() : raw;
                      const ok = hash && submitPasteGuestResponse?.(hash);
                      if (ok) {
                        setPasteInput('');
                        setPasteError('');
                      } else {
                        setPasteError('Invalid link. Open the link they sent you, or paste it here.');
                      }
                    }}
                    disabled={!pasteInput.trim()}
                    className="btn btn-primary shrink-0"
                  >
                    Connect
                  </button>
                </div>
                {pasteError && <p className="text-sm text-red-400 mt-1">{pasteError}</p>}
              </div>
            </>
          ) : (
            <div>
              <p className="text-sm text-white/70 mb-3">
                Send this link to the host. They open it (or paste it on the connect page) to complete the connection.
              </p>
              {pasteResponseString ? (
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={
                      typeof window !== 'undefined'
                        ? `${window.location.origin}/connect#${pasteResponseString}`
                        : ''
                    }
                    className="flex-1 min-w-0 p-3 rounded-lg bg-white/5 border border-white/20 text-white text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        const url = `${window.location.origin}/connect#${pasteResponseString}`;
                        navigator.clipboard.writeText(url);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    className="btn btn-secondary shrink-0"
                  >
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Generating your link…
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
                  <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-black/20">
                    <img
                      src={TOKEN_IMAGES[token]}
                      alt={TOKEN_NAMES[token]}
                      className="w-10 h-10 object-contain"
                    />
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
                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-black/20">
                  <img
                    src={TOKEN_IMAGES[player.token]}
                    alt={TOKEN_NAMES[player.token]}
                    className="w-8 h-8 object-contain"
                  />
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
