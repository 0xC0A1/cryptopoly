'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PENDING_GUEST_RESPONSE_KEY = 'cryptopoli_pendingGuestResponse';

/**
 * Host opens the "complete" link from the guest (e.g. /connect#<response>).
 * We store the response in sessionStorage and redirect to lobby so the host's
 * lobby can apply it and finish the connection.
 */
export default function ConnectPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash?.slice(1);
    if (hash) {
      try {
        sessionStorage.setItem(PENDING_GUEST_RESPONSE_KEY, hash);
      } catch {
        // ignore
      }
    }
    router.replace('/lobby');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <p className="text-white/60">Completing connection…</p>
    </div>
  );
}
