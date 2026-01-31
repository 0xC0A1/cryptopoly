'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/stores/game-store';

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createRoom = useGameStore(state => state.createRoom);
  const joinRoom = useGameStore(state => state.joinRoom);

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    setIsLoading(true);
    setError('');

    const roomId = await createRoom(playerName.trim());

    if (roomId) {
      router.push('/lobby');
    } else {
      setError('Failed to create room. Please try again.');
      setIsLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setIsLoading(true);
    setError('');

    const roomId = await joinRoom(roomCode.toUpperCase(), playerName.trim());

    if (roomId) {
      router.push('/lobby');
    } else {
      setError('Room not found');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 overflow-auto">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)] rounded-full blur-[150px] opacity-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--secondary)] rounded-full blur-[150px] opacity-10" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[var(--accent)] rounded-full blur-[100px] opacity-10" />
      </div>

      {/* Logo */}
      <div className="text-center mb-12">
        <h1 className="text-6xl md:text-8xl font-bold text-gradient mb-4">
          CRYPTOPOLI
        </h1>
        <p className="text-xl text-white/60">
          The Crypto Trading Game
        </p>
      </div>

      {/* Crypto symbols decoration */}
      <div className="flex gap-8 mb-12 text-4xl">
        <span className="text-[#f7931a]">₿</span>
        <span className="text-[#627eea]">Ξ</span>
        <span className="text-[#00ffa3]">◎</span>
        <span className="text-[#c2a633]">Ð</span>
        <span className="text-[#0033ad]">A</span>
        <span className="text-[#e6007a]">●</span>
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
              Join Game
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Create New Game</h2>
            <div>
              <label className="block text-sm text-white/60 mb-1">Your Name</label>
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
            {error && <p className="text-red-400 text-sm">{error}</p>}
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
            <h2 className="text-xl font-bold text-white mb-4">Join Game</h2>
            <div>
              <label className="block text-sm text-white/60 mb-1">Your Name</label>
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
            <div>
              <label className="block text-sm text-white/60 mb-1">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="Enter 6-character code"
                className="w-full text-center text-2xl tracking-widest font-mono"
                maxLength={6}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setMode('menu')}
                className="btn btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleJoinGame}
                className="btn btn-primary flex-1"
              >
                Join
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        <div className="text-center">
          <div className="text-3xl mb-2">🎮</div>
          <h3 className="text-lg font-semibold text-white mb-1">Multiplayer</h3>
          <p className="text-sm text-white/60">Play with 2-6 friends via P2P connection</p>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2">🌐</div>
          <h3 className="text-lg font-semibold text-white mb-1">3D Board</h3>
          <p className="text-sm text-white/60">Beautiful 3D rendered game board</p>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="text-lg font-semibold text-white mb-1">Crypto Themed</h3>
          <p className="text-sm text-white/60">Properties named after real cryptocurrencies</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-white/40 text-sm">
        Built with Next.js, React Three Fiber & WebRTC
      </div>
    </div>
  );
}
