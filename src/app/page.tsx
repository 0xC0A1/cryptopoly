'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/stores/game-store';
import { GAME_NAME, GAME_TAGLINE } from '@/lib/game/constants';

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [joinLink, setJoinLink] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createRoomOffline = useGameStore(state => state.createRoomOffline);

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    setIsLoading(true);
    setError('');

    const roomId = await createRoomOffline(playerName.trim());

    if (roomId) {
      router.push('/lobby');
    } else {
      setError('Failed to create room. Please try again.');
      setIsLoading(false);
    }
  };

  const handleOpenJoinLink = () => {
    const raw = joinLink.trim();
    if (!raw) {
      setError('Paste the join link the host sent you');
      return;
    }
    setError('');
    try {
      const url = raw.startsWith('http') ? raw : `https://${raw}`;
      if (new URL(url).pathname.startsWith('/join/')) {
        window.location.href = url;
        return;
      }
    } catch {
      // not a full URL
    }
    setError('That doesn’t look like a join link. Open the link the host sent you in your browser.');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 overflow-auto bg-black">
      {/* Logo */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
          {GAME_NAME.toUpperCase()}
        </h1>
        <p className="text-lg text-white/70">
          {GAME_TAGLINE}
        </p>
      </div>

      {/* Menu */}
      <div className="card w-full max-w-md">
        {mode === 'menu' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="btn btn-primary w-full text-lg py-4"
            >
              Create Game
            </button>
            <button
              onClick={() => setMode('join')}
              className="btn btn-secondary w-full text-lg py-4"
            >
              I have a join link
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Create New Game</h2>
            <div>
              <label className="block text-sm text-white/70 mb-1">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setError('');
                }}
                placeholder="Enter your name"
                className="w-full"
                maxLength={20}
              />
            </div>
            {error && <p className="text-white/80 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setMode('menu')}
                className="btn btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleCreateGame}
                className="btn btn-primary flex-1"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Join Game</h2>
            <p className="text-sm text-white/60 mb-2">
              Open the join link the host sent you (in your browser or paste it below).
            </p>
            <div>
              <label className="block text-sm text-white/70 mb-1">Join link</label>
              <input
                type="text"
                value={joinLink}
                onChange={(e) => { setJoinLink(e.target.value); setError(''); }}
                placeholder="Paste the link here…"
                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder:text-white/40 text-sm"
              />
            </div>
            {error && <p className="text-white/80 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setMode('menu')}
                className="btn btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleOpenJoinLink}
                className="btn btn-primary flex-1"
              >
                Open link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        <div className="text-center">
          <h3 className="text-base font-medium text-white mb-1">Multiplayer</h3>
          <p className="text-sm text-white/60">Play with 2-6 friends via P2P connection</p>
        </div>
        <div className="text-center">
          <h3 className="text-base font-medium text-white mb-1">3D Board</h3>
          <p className="text-sm text-white/60">3D rendered game board</p>
        </div>
        <div className="text-center">
          <h3 className="text-base font-medium text-white mb-1">Crypto Themed</h3>
          <p className="text-sm text-white/60">Properties named after real cryptocurrencies</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-white/50 text-sm">
        Next.js · React Three Fiber · WebRTC
      </div>
    </div>
  );
}
