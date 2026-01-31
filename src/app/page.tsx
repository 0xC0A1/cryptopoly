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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 overflow-auto bg-black">
      {/* Logo */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
          CRYPTOPOLY
        </h1>
        <p className="text-lg text-white/70">
          The Crypto Trading Game
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
              Join Game
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
            <div>
              <label className="block text-sm text-white/70 mb-1">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="Enter 6-character code"
                className="w-full text-center text-2xl tracking-widest"
                maxLength={6}
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
