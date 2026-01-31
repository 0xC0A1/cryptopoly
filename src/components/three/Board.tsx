'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Sparkles } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { TILES, getTilePosition } from '@/lib/game/board-data';
import { GROUP_COLORS, PropertyGroup, Tile, PropertyTile } from '@/lib/game/types';
import { useGameStore } from '@/lib/stores/game-store';

// Board dimensions – square board: each side = 2*CORNER + 9*TILE_WIDTH = 25
const BOARD_SIZE = 25;
const TILE_WIDTH = 2;
const TILE_DEPTH = 3.5;
const CORNER_SIZE = 3.5;
const BOARD_HEIGHT = 0.3;
// Offset for the "inner" corner on each side (Jail, Free Parking, Go to Jail) so they sit at board edge
const END_CORNER_OFFSET = CORNER_SIZE + 9 * TILE_WIDTH + CORNER_SIZE / 2;

// Get color for tile
function getTileColor(tile: Tile): string {
  if (tile.type === 'property') {
    const propTile = tile as PropertyTile;
    return GROUP_COLORS[propTile.group];
  }
  if (tile.type === 'railroad') return '#2f2f2f';
  if (tile.type === 'utility') return '#808080';
  if (tile.type === 'chance') return '#ff6b35';
  if (tile.type === 'community-chest') return '#4ecdc4';
  if (tile.type === 'tax') return '#dc143c';
  if (tile.type === 'go') return '#00ffa3';
  if (tile.type === 'jail') return '#8b0000';
  if (tile.type === 'free-parking') return '#ffd700';
  if (tile.type === 'go-to-jail') return '#4a0080';
  return '#333333';
}

// Get short name for display
function getShortName(tile: Tile): string {
  const name = tile.name;
  if (name.length > 12) {
    return name.split(' ').slice(0, 2).join(' ');
  }
  return name;
}

interface TileComponentProps {
  tile: Tile;
  index: number;
}

function TileComponent({ tile, index }: TileComponentProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const gameState = useGameStore(state => state.gameState);
  const propertyState = gameState?.properties[index];
  const owner = propertyState?.ownerId ? gameState?.players[propertyState.ownerId] : null;

  // Calculate position based on index – corners are square (CORNER_SIZE × CORNER_SIZE), no overlap
  const position = useMemo(() => {
    const isCorner = [0, 10, 20, 30].includes(index);
    const size = isCorner ? CORNER_SIZE : TILE_WIDTH;

    if (index >= 0 && index <= 10) {
      // Bottom row (right to left): GO at right, Jail at left
      const offset =
        index === 0
          ? CORNER_SIZE / 2
          : index === 10
            ? END_CORNER_OFFSET
            : CORNER_SIZE + TILE_WIDTH / 2 + (index - 1) * TILE_WIDTH;
      return {
        x: BOARD_SIZE / 2 - offset,
        z: BOARD_SIZE / 2 - TILE_DEPTH / 2,
        rotation: 0,
        width: size,
        depth: TILE_DEPTH,
      };
    } else if (index >= 11 && index <= 19) {
      // Left column (bottom to top)
      const offset = CORNER_SIZE + TILE_WIDTH / 2 + (index - 11) * TILE_WIDTH;
      return {
        x: -BOARD_SIZE / 2 + TILE_DEPTH / 2,
        z: BOARD_SIZE / 2 - offset,
        rotation: Math.PI / 2,
        width: TILE_WIDTH,
        depth: TILE_DEPTH,
      };
    } else if (index >= 20 && index <= 30) {
      // Top row (left to right): Free Parking at left, Go to Jail at right
      const idx = index - 20;
      const offset =
        idx === 0
          ? CORNER_SIZE / 2
          : idx === 10
            ? END_CORNER_OFFSET
            : CORNER_SIZE + TILE_WIDTH / 2 + (idx - 1) * TILE_WIDTH;
      return {
        x: -BOARD_SIZE / 2 + offset,
        z: -BOARD_SIZE / 2 + TILE_DEPTH / 2,
        rotation: Math.PI,
        width: idx === 0 || idx === 10 ? CORNER_SIZE : TILE_WIDTH,
        depth: TILE_DEPTH,
      };
    } else {
      // Right column (top to bottom)
      const offset = CORNER_SIZE + TILE_WIDTH / 2 + (index - 31) * TILE_WIDTH;
      return {
        x: BOARD_SIZE / 2 - TILE_DEPTH / 2,
        z: -BOARD_SIZE / 2 + offset,
        rotation: -Math.PI / 2,
        width: TILE_WIDTH,
        depth: TILE_DEPTH,
      };
    }
  }, [index]);

  const isCorner = [0, 10, 20, 30].includes(index);
  const tileColor = getTileColor(tile);
  const hasColorBand = tile.type === 'property';

  // Hover effect
  const [hovered, setHovered] = useState(false);

  return (
    <group
      position={[position.x, BOARD_HEIGHT / 2 + 0.01, position.z]}
      rotation={[0, position.rotation, 0]}
    >
      {/* Tile base */}
      <mesh
        ref={meshRef}
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[position.width - 0.05, 0.1, position.depth - 0.05]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : '#1a1a2a'}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Color band for properties */}
      {hasColorBand && (
        <mesh position={[0, 0.06, -position.depth / 2 + 0.4]}>
          <boxGeometry args={[position.width - 0.1, 0.05, 0.7]} />
          <meshStandardMaterial
            color={tileColor}
            metalness={0.5}
            roughness={0.3}
            emissive={tileColor}
            emissiveIntensity={0.2}
          />
        </mesh>
      )}

      {/* Tile name */}
      <Text
        position={[0, 0.12, isCorner ? 0 : 0.3]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={isCorner ? 0.35 : 0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={position.width - 0.2}
        textAlign="center"
      >
        {getShortName(tile)}
      </Text>

      {/* Price for purchasable tiles */}
      {'price' in tile && (
        <Text
          position={[0, 0.12, position.depth / 2 - 0.5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color="#00ffa3"
          anchorX="center"
          anchorY="middle"
        >
          ${tile.price}
        </Text>
      )}

      {/* Owner indicator */}
      {owner && (
        <mesh position={[position.width / 2 - 0.3, 0.15, position.depth / 2 - 0.3]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color={owner.token === 'bitcoin' ? '#f7931a' :
                   owner.token === 'ethereum' ? '#627eea' :
                   owner.token === 'solana' ? '#00ffa3' :
                   owner.token === 'dogecoin' ? '#c2a633' :
                   owner.token === 'cardano' ? '#0033ad' :
                   '#e6007a'}
            emissive={owner.token === 'bitcoin' ? '#f7931a' :
                      owner.token === 'ethereum' ? '#627eea' :
                      owner.token === 'solana' ? '#00ffa3' :
                      owner.token === 'dogecoin' ? '#c2a633' :
                      owner.token === 'cardano' ? '#0033ad' :
                      '#e6007a'}
            emissiveIntensity={0.5}
          />
        </mesh>
      )}

      {/* Houses */}
      {propertyState && propertyState.houses > 0 && propertyState.houses < 5 && (
        <group position={[0, 0.2, -position.depth / 2 + 0.8]}>
          {Array.from({ length: propertyState.houses }).map((_, i) => (
            <mesh
              key={i}
              position={[(i - (propertyState.houses - 1) / 2) * 0.4, 0, 0]}
            >
              <boxGeometry args={[0.25, 0.3, 0.25]} />
              <meshStandardMaterial color="#00aa00" />
            </mesh>
          ))}
        </group>
      )}

      {/* Hotel */}
      {propertyState && propertyState.houses === 5 && (
        <mesh position={[0, 0.25, -position.depth / 2 + 0.8]}>
          <boxGeometry args={[0.6, 0.4, 0.4]} />
          <meshStandardMaterial color="#cc0000" />
        </mesh>
      )}

      {/* Special tile decorations */}
      {tile.type === 'go' && (
        <Sparkles
          count={20}
          scale={[position.width, 1, position.depth]}
          size={3}
          speed={0.5}
          color="#00ffa3"
        />
      )}
    </group>
  );
}

import { useState } from 'react';

export function Board() {
  return (
    <group>
      {/* Main board base */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[BOARD_SIZE, BOARD_HEIGHT, BOARD_SIZE]} />
          <meshStandardMaterial
            color="#0a0a15"
            metalness={0.4}
            roughness={0.6}
          />
        </mesh>
      </RigidBody>

      {/* Center area */}
      <mesh position={[0, BOARD_HEIGHT / 2 + 0.01, 0]}>
        <boxGeometry args={[BOARD_SIZE - TILE_DEPTH * 2 - 0.2, 0.02, BOARD_SIZE - TILE_DEPTH * 2 - 0.2]} />
        <meshStandardMaterial
          color="#0f0f1a"
          metalness={0.3}
          roughness={0.8}
        />
      </mesh>

      {/* Center logo */}
      <group position={[0, BOARD_HEIGHT / 2 + 0.1, 0]}>
        <Text
          fontSize={1.5}
          color="#00ffa3"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          CRYPTOPOLI
        </Text>
        <Text
          position={[0, 0, 1.5]}
          fontSize={0.4}
          color="#627eea"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          The Crypto Trading Game
        </Text>

        {/* Decorative crypto symbols */}
        <Text
          position={[-3, 0, -2]}
          fontSize={1}
          color="#f7931a"
          anchorX="center"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          ₿
        </Text>
        <Text
          position={[3, 0, -2]}
          fontSize={1}
          color="#627eea"
          anchorX="center"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          Ξ
        </Text>
        <Text
          position={[-3, 0, 3]}
          fontSize={0.8}
          color="#00ffa3"
          anchorX="center"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          ◎
        </Text>
        <Text
          position={[3, 0, 3]}
          fontSize={0.8}
          color="#c2a633"
          anchorX="center"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          Ð
        </Text>
      </group>

      {/* Board edge glow */}
      <mesh position={[0, BOARD_HEIGHT / 2, 0]}>
        <ringGeometry args={[BOARD_SIZE / 2 - 0.1, BOARD_SIZE / 2 + 0.1, 4]} />
        <meshBasicMaterial
          color="#00ffa3"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Render all tiles */}
      {TILES.map((tile, index) => (
        <TileComponent key={index} tile={tile} index={index} />
      ))}
    </group>
  );
}
