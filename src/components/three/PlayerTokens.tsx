'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/lib/stores/game-store';
import { TOKEN_COLORS, TokenType, Player } from '@/lib/game/types';
import { TILES } from '@/lib/game/board-data';

const TILE_COUNT = 40;

// Board dimensions (must match Board.tsx)
const BOARD_SIZE = 25;
const TILE_WIDTH = 2;
const TILE_DEPTH = 3.5;
const CORNER_SIZE = 3.5;
const BOARD_HEIGHT = 0.3;
const END_CORNER_OFFSET = CORNER_SIZE + 9 * TILE_WIDTH + CORNER_SIZE / 2;

// Get 3D position for a tile index (centers match Board.tsx)
function getTilePosition3D(index: number): THREE.Vector3 {
  const y = BOARD_HEIGHT + 0.5;

  if (index >= 0 && index <= 10) {
    const offset =
      index === 0 ? CORNER_SIZE / 2 : index === 10 ? END_CORNER_OFFSET : CORNER_SIZE + TILE_WIDTH / 2 + (index - 1) * TILE_WIDTH;
    return new THREE.Vector3(BOARD_SIZE / 2 - offset, y, BOARD_SIZE / 2 - TILE_DEPTH / 2);
  } else if (index >= 11 && index <= 19) {
    const offset = CORNER_SIZE + TILE_WIDTH / 2 + (index - 11) * TILE_WIDTH;
    return new THREE.Vector3(-BOARD_SIZE / 2 + TILE_DEPTH / 2, y, BOARD_SIZE / 2 - offset);
  } else if (index >= 20 && index <= 30) {
    const idx = index - 20;
    const offset =
      idx === 0 ? CORNER_SIZE / 2 : idx === 10 ? END_CORNER_OFFSET : CORNER_SIZE + TILE_WIDTH / 2 + (idx - 1) * TILE_WIDTH;
    return new THREE.Vector3(-BOARD_SIZE / 2 + offset, y, -BOARD_SIZE / 2 + TILE_DEPTH / 2);
  } else {
    const offset = CORNER_SIZE + TILE_WIDTH / 2 + (index - 31) * TILE_WIDTH;
    return new THREE.Vector3(BOARD_SIZE / 2 - TILE_DEPTH / 2, y, -BOARD_SIZE / 2 + offset);
  }
}

// Path from fromTile to toTile stepping forward one tile at a time (wrapping at 40)
function getPath(fromTile: number, toTile: number): number[] {
  if (fromTile === toTile) return [];
  const path: number[] = [];
  let steps = (toTile - fromTile + TILE_COUNT) % TILE_COUNT;
  if (steps === 0) return [];
  for (let i = 1; i <= steps; i++) {
    path.push((fromTile + i) % TILE_COUNT);
  }
  return path;
}

// Offset tokens so they don't overlap on same tile
function getTokenOffset(playerIndex: number, totalPlayers: number): THREE.Vector3 {
  const offsets: THREE.Vector3[] = [
    new THREE.Vector3(-0.4, 0, -0.4),
    new THREE.Vector3(0.4, 0, -0.4),
    new THREE.Vector3(-0.4, 0, 0.4),
    new THREE.Vector3(0.4, 0, 0.4),
    new THREE.Vector3(0, 0, -0.6),
    new THREE.Vector3(0, 0, 0.6),
  ];
  return offsets[playerIndex % offsets.length] || new THREE.Vector3();
}

interface PlayerTokenProps {
  player: Player;
  playerIndex: number;
  totalPlayers: number;
  isCurrentPlayer: boolean;
}

// How fast the token moves along the path (world units per second)
const MOVE_SPEED = 8;
// Height of the little jump when moving between tiles
const JUMP_HEIGHT = 0.35;

function PlayerToken({ player, playerIndex, totalPlayers, isCurrentPlayer }: PlayerTokenProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const previousTileRef = useRef<number>(player.position);
  const [currentPos, setCurrentPos] = useState<THREE.Vector3>(() => {
    const base = getTilePosition3D(player.position);
    const off = getTokenOffset(playerIndex, totalPlayers);
    return base.add(off);
  });
  // Path of tile indices we're still animating through (one tile at a time)
  const [path, setPath] = useState<number[]>([]);
  const pathIndexRef = useRef(0);
  const segmentStartDistRef = useRef(0);

  const color = TOKEN_COLORS[player.token];
  const offset = useMemo(() => getTokenOffset(playerIndex, totalPlayers), [playerIndex, totalPlayers]);

  // When player.position changes, build path from previous tile to new tile and animate through it
  useEffect(() => {
    const prev = previousTileRef.current;
    const next = player.position;
    if (prev === next) return;

    const newPath = getPath(prev, next);
    previousTileRef.current = next;
    pathIndexRef.current = 0;
    segmentStartDistRef.current = 0;
    if (newPath.length > 0) {
      setPath(newPath);
    }
  }, [player.position]);

  // Animate movement along path: move tile-by-tile over the board with a small jump per tile
  useFrame((_, delta) => {
    if (path.length === 0) return;

    const tileIndex = path[pathIndexRef.current];
    const baseTarget = getTilePosition3D(tileIndex).add(offset);
    const dist = currentPos.distanceTo(baseTarget);

    // Lazy-init segment distance at start of each segment
    if (segmentStartDistRef.current <= 0) {
      segmentStartDistRef.current = Math.max(0.01, currentPos.distanceTo(baseTarget));
    }

    if (dist < 0.02) {
      // Reached this tile; advance to next in path
      setCurrentPos(baseTarget.clone());
      pathIndexRef.current += 1;
      segmentStartDistRef.current = 0;
      if (pathIndexRef.current >= path.length) {
        setPath([]);
      }
      return;
    }

    const step = Math.min(1, (delta * MOVE_SPEED) / Math.max(0.01, dist));
    const newPos = currentPos.clone().lerp(baseTarget, step);

    // Parabolic jump over this segment: 0 at start, peak at middle, 0 at end
    const segmentProgress = 1 - newPos.distanceTo(baseTarget) / segmentStartDistRef.current;
    const jumpY = Math.sin(Math.max(0, Math.min(1, segmentProgress)) * Math.PI) * JUMP_HEIGHT;
    newPos.y = getTilePosition3D(tileIndex).y + jumpY;

    setCurrentPos(newPos);
  });

  // Rotate current player token
  useFrame((_, delta) => {
    if (meshRef.current && isCurrentPlayer) {
      meshRef.current.rotation.y += delta * 2;
    }
  });

  // Token geometry based on type
  const TokenGeometry = useMemo(() => {
    switch (player.token) {
      case 'bitcoin':
        return (
          <group>
            <mesh ref={meshRef} castShadow>
              <cylinderGeometry args={[0.4, 0.4, 0.15, 32]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            <Text
              position={[0, 0.1, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.35}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              ₿
            </Text>
          </group>
        );

      case 'ethereum':
        return (
          <group>
            <mesh ref={meshRef} castShadow rotation={[0, 0, Math.PI / 4]}>
              <octahedronGeometry args={[0.4]} />
              <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        );

      case 'solana':
        return (
          <group>
            <mesh ref={meshRef} castShadow>
              <torusGeometry args={[0.3, 0.12, 16, 32]} />
              <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        );

      case 'dogecoin':
        return (
          <group>
            <mesh ref={meshRef} castShadow>
              <cylinderGeometry args={[0.35, 0.35, 0.2, 32]} />
              <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
            </mesh>
            <Text
              position={[0, 0.12, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.3}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              Ð
            </Text>
          </group>
        );

      case 'cardano':
        return (
          <group>
            <mesh ref={meshRef} castShadow>
              <dodecahedronGeometry args={[0.35]} />
              <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        );

      case 'polkadot':
        return (
          <group>
            <mesh ref={meshRef} castShadow>
              <sphereGeometry args={[0.35, 32, 32]} />
              <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Polkadot's characteristic dots */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i / 6) * Math.PI * 2;
              return (
                <mesh
                  key={i}
                  position={[
                    Math.cos(angle) * 0.25,
                    Math.sin(angle) * 0.25,
                    0.25,
                  ]}
                >
                  <sphereGeometry args={[0.06, 16, 16]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
              );
            })}
          </group>
        );

      default:
        return (
          <mesh ref={meshRef} castShadow>
            <coneGeometry args={[0.3, 0.6, 6]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
    }
  }, [player.token, color]);

  // In jail - show with a cage effect
  const isInJail = player.inJail;

  return (
    <group position={currentPos.toArray()}>
      {/* Glow effect for current player */}
      {isCurrentPlayer && (
        <pointLight
          position={[0, 0.5, 0]}
          intensity={2}
          distance={3}
          color={color}
        />
      )}

      {/* Token */}
      <Float
        speed={isCurrentPlayer ? 4 : 2}
        rotationIntensity={0}
        floatIntensity={isCurrentPlayer ? 0.5 : 0.2}
      >
        {TokenGeometry}
      </Float>

      {/* Jail bars effect */}
      {isInJail && (
        <group>
          {[-0.3, 0, 0.3].map((x, i) => (
            <mesh key={i} position={[x, 0.4, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
              <meshStandardMaterial color="#666666" />
            </mesh>
          ))}
          {[-0.3, 0, 0.3].map((z, i) => (
            <mesh key={`h-${i}`} position={[0, 0.4, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
              <meshStandardMaterial color="#666666" />
            </mesh>
          ))}
        </group>
      )}

      {/* Player name label */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {player.name}
      </Text>

      {/* Money indicator */}
      <Text
        position={[0, 0.95, 0]}
        fontSize={0.18}
        color="#00ffa3"
        anchorX="center"
        anchorY="middle"
      >
        ${player.money}
      </Text>

      {/* Selection ring for current player */}
      {isCurrentPlayer && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

export function PlayerTokens() {
  const gameState = useGameStore(state => state.gameState);
  const localPlayerId = useGameStore(state => state.localPlayerId);

  if (!gameState || gameState.phase === 'lobby') return null;

  const players = Object.values(gameState.players).filter(p => !p.isBankrupt);
  const currentPlayerId = gameState.turnOrder[gameState.currentPlayerIndex];

  return (
    <group>
      {players.map((player, index) => (
        <PlayerToken
          key={player.id}
          player={player}
          playerIndex={index}
          totalPlayers={players.length}
          isCurrentPlayer={player.id === currentPlayerId}
        />
      ))}
    </group>
  );
}
