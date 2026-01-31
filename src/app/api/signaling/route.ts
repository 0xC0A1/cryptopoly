// ============================================
// CRYPTOPOLI - Signaling API Route
// ============================================
// Note: This is a polling-based signaling server for development.
// For production, use a proper WebSocket server (e.g., Socket.io, Pusher, or a separate Node.js server).

import { NextRequest, NextResponse } from 'next/server';

// In-memory room storage (for development only)
interface Room {
  id: string;
  hostId: string;
  peers: Set<string>;
  messages: Map<string, { timestamp: number; message: unknown }[]>;
  createdAt: number;
}

// Global room storage (note: this resets on each deployment/restart)
const rooms = new Map<string, Room>();

// Clean up old rooms periodically
function cleanupOldRooms() {
  const maxAge = 1000 * 60 * 60 * 2; // 2 hours
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now - room.createdAt > maxAge) {
      rooms.delete(id);
    }
  }
}

// Generate room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST - Create room, join room, or send message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, peerId, roomId, targetPeerId, message } = body;

    cleanupOldRooms();

    switch (action) {
      case 'create-room': {
        if (!peerId) {
          return NextResponse.json({ error: 'peerId is required' }, { status: 400 });
        }

        let newRoomId = generateRoomCode();
        while (rooms.has(newRoomId)) {
          newRoomId = generateRoomCode();
        }

        const room: Room = {
          id: newRoomId,
          hostId: peerId,
          peers: new Set([peerId]),
          messages: new Map(),
          createdAt: Date.now(),
        };
        room.messages.set(peerId, []);
        rooms.set(newRoomId, room);

        return NextResponse.json({
          type: 'room-created',
          roomId: newRoomId,
        });
      }

      case 'join-room': {
        if (!peerId || !roomId) {
          return NextResponse.json({ error: 'peerId and roomId are required' }, { status: 400 });
        }

        const room = rooms.get(roomId.toUpperCase());
        if (!room) {
          return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        const existingPeers = Array.from(room.peers);
        room.peers.add(peerId);
        room.messages.set(peerId, []);

        // Notify existing peers
        for (const existingPeerId of existingPeers) {
          const peerMessages = room.messages.get(existingPeerId);
          if (peerMessages) {
            peerMessages.push({
              timestamp: Date.now(),
              message: { type: 'peer-joined', peerId },
            });
          }
        }

        return NextResponse.json({
          type: 'room-joined',
          roomId: room.id,
          hostId: room.hostId,
          peers: existingPeers,
        });
      }

      case 'send-message': {
        if (!peerId || !roomId || !targetPeerId || !message) {
          return NextResponse.json(
            { error: 'peerId, roomId, targetPeerId, and message are required' },
            { status: 400 }
          );
        }

        const room = rooms.get(roomId.toUpperCase());
        if (!room) {
          return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        const targetMessages = room.messages.get(targetPeerId);
        if (targetMessages) {
          targetMessages.push({
            timestamp: Date.now(),
            message: { ...message, fromPeerId: peerId },
          });
        }

        return NextResponse.json({ success: true });
      }

      case 'leave-room': {
        if (!peerId || !roomId) {
          return NextResponse.json({ error: 'peerId and roomId are required' }, { status: 400 });
        }

        const room = rooms.get(roomId.toUpperCase());
        if (room) {
          room.peers.delete(peerId);
          room.messages.delete(peerId);

          // Notify remaining peers
          for (const remainingPeerId of room.peers) {
            const peerMessages = room.messages.get(remainingPeerId);
            if (peerMessages) {
              peerMessages.push({
                timestamp: Date.now(),
                message: { type: 'peer-left', peerId },
              });
            }
          }

          // Delete room if empty
          if (room.peers.size === 0) {
            rooms.delete(roomId.toUpperCase());
          }
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Poll for messages
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const peerId = searchParams.get('peerId');
  const roomId = searchParams.get('roomId');
  const since = parseInt(searchParams.get('since') || '0', 10);

  if (!peerId || !roomId) {
    return NextResponse.json({ error: 'peerId and roomId are required' }, { status: 400 });
  }

  const room = rooms.get(roomId.toUpperCase());
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const messages = room.messages.get(peerId) || [];
  const newMessages = messages.filter(m => m.timestamp > since);

  // Clear old messages
  room.messages.set(
    peerId,
    messages.filter(m => m.timestamp > Date.now() - 10000)
  );

  return NextResponse.json({
    messages: newMessages.map(m => m.message),
    timestamp: Date.now(),
  });
}
