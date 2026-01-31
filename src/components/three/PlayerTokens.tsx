'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/lib/stores/game-store';
import { TOKEN_COLORS, TokenType, Player } from '@/lib/game/types';
import { TILES } from '@/lib/game/board-data';

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

function PlayerToken({ player, playerIndex, totalPlayers, isCurrentPlayer }: PlayerTokenProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [currentPos, setCurrentPos] = useState<THREE.Vector3>(() => getTilePosition3D(player.position));
  const [targetPos, setTargetPos] = useState<THREE.Vector3>(() => getTilePosition3D(player.position));
  const [isAnimating, setIsAnimating] = useState(false);

  const color = TOKEN_COLORS[player.token];

  // Update target position when player moves (offset computed inside effect so deps are stable primitives)
  useEffect(() => {
    const offset = getTokenOffset(playerIndex, totalPlayers);
    const newTarget = getTilePosition3D(player.position).add(offset);
    setTargetPos(newTarget);
    if (!currentPos.equals(newTarget)) {
      setIsAnimating(true);
    }
  }, [player.position, playerIndex, totalPlayers]);

  // Animate movement
  useFrame((_, delta) => {
    if (!isAnimating) return;

    const speed = 8;
    const newPos = currentPos.clone().lerp(targetPos, Math.min(1, delta * speed));

    if (newPos.distanceTo(targetPos) < 0.01) {
      setCurrentPos(targetPos.clone());
      setIsAnimating(false);
    } else {
      setCurrentPos(newPos);
    }
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
