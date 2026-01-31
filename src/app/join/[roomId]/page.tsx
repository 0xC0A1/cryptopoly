'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useGameStore } from '@/lib/stores/game-store';
import Link from 'next/link';

const PENDING_OFFER_KEY = (roomId: string) => `cryptopoli_pendingOffer_${roomId}`;

/** Extract base64 offer from URL (hash or pasted full URL). */
function getOfferFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith('http')) {
      const url = new URL(trimmed);
      const hash = url.hash.slice(1);
      return hash || null;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

const JOIN_PAGE_STEPS = 2; // Step 3 is on the lobby

export default function JoinRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = (params?.roomId as string)?.toUpperCase() ?? '';
  const joinRoomOffline = useGameStore(state => state.joinRoomOffline);

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [error, setError] = useState('');
  const [hasOffer, setHasOffer] = useState(false);

  // If we landed with hash (host's join link), store offer and go to step 2
  useEffect(() => {
    if (typeof window === 'undefined' || !roomId) return;
    const hash = window.location.hash?.slice(1);
    if (hash) {
      try {
        sessionStorage.setItem(PENDING_OFFER_KEY(roomId), hash);
        setHasOffer(true);
        setStep(2);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch {
        setError('Could not read join link.');
      }
    } else {
      const stored = sessionStorage.getItem(PENDING_OFFER_KEY(roomId));
      setHasOffer(!!stored);
      if (stored) setStep(2);
    }
  }, [roomId]);

  const handleStep1Continue = () => {
    const offer = getOfferFromInput(linkInput);
    if (offer) {
      try {
        sessionStorage.setItem(PENDING_OFFER_KEY(roomId), offer);
        setHasOffer(true);
        setLinkInput('');
        setError('');
        setStep(2);
      } catch {
        setError('Invalid link.');
      }
    } else {
      setError('Paste the join link from the host, or open it in this browser.');
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    const offer = sessionStorage.getItem(PENDING_OFFER_KEY(roomId));
    if (!offer) {
      setError('Open the join link from the host first, or paste it in Step 1.');
      return;
    }
    setError('');
    const id = await joinRoomOffline(roomId, name.trim());
    if (id) {
      router.push('/lobby');
    } else {
      setError('Could not join room.');
    }
  };

  const goBackToStep1 = () => {
    setStep(1);
    setError('');
  };

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-black">
        <div className="text-white">Invalid room.</div>
        <Link href="/" className="text-white/70 hover:text-white ml-2">Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-black">
      <div className="card w-full max-w-md">
        <p className="text-sm text-white/50 mb-2 text-center">
          Step {step} of {JOIN_PAGE_STEPS}
        </p>
        <h1 className="text-xl font-semibold text-white mb-1 text-center">
          {step === 1 ? "Step 1: Get the host's link" : 'Step 2: Your name & join'}
        </h1>
        <p className="text-sm text-white/60 mb-6 text-center">
          {step === 1
            ? 'Open the join link the host sent you in this browser, or paste it below.'
            : 'Enter your name and join the lobby. Then you’ll get a link to send back to the host.'}
        </p>

        {step === 1 ? (
          <>
            <div className="mb-4">
              <label className="block text-sm text-white/70 mb-1">Paste the join link from the host</label>
              <input
                type="text"
                value={linkInput}
                onChange={(e) => { setLinkInput(e.target.value); setError(''); }}
                placeholder="https://…/join/ROOM#…"
                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-white text-sm placeholder:text-white/40"
              />
            </div>
            <button
              type="button"
              onClick={handleStep1Continue}
              disabled={!linkInput.trim()}
              className="btn btn-primary w-full"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm text-white/70 mb-1">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="Your name"
                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder:text-white/40"
                maxLength={20}
              />
            </div>
            <button
              type="button"
              onClick={handleJoin}
              disabled={!name.trim()}
              className="btn btn-primary w-full mb-2"
            >
              Join lobby
            </button>
            <button
              type="button"
              onClick={goBackToStep1}
              className="w-full text-sm text-white/50 hover:text-white/70"
            >
              ← Back to Step 1
            </button>
          </>
        )}

        {error && <p className="text-sm text-red-400 mt-4">{error}</p>}

        <Link href="/" className="inline-block mt-6 text-sm text-white/50 hover:text-white/70 text-center w-full">
          Back to home
        </Link>
      </div>
    </div>
  );
}
