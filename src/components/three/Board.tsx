'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Sparkles } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { TILES, getTilePosition } from '@/lib/game/board-data';
import { GAME_NAME, CHANCE_DECK_NAME, COMMUNITY_CHEST_DECK_NAME } from '@/lib/game/constants';
import { GROUP_COLORS, PropertyGroup, Tile, PropertyTile, Card } from '@/lib/game/types';
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

// Card pile – vertical stack (deck standing on table) for Chance / Community Chest
const CARD_COUNT = 10;
const CARD_THICKNESS = 0.06;
const CARD_WIDTH = 2.2;
const CARD_HEIGHT = 1.4;
// Drawn card displayed in center – larger for readability, avoids z-fighting with back face
const DRAWN_CARD_WIDTH = 3.2;
const DRAWN_CARD_HEIGHT = 2.0;
const DRAWN_CARD_FACE_OFFSET = 0.012; // push face plane slightly in front of box to prevent z-fighting

function CardPile({
  color,
  isChance,
}: {
  color: string;
  isChance: boolean;
}) {
  return (
    <group position={[0, 0.02, 0]}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (i - (CARD_COUNT - 1) / 2) * 0.02,
            i * CARD_THICKNESS,
            (i - (CARD_COUNT - 1) / 2) * 0.02,
          ]}
          rotation={[0, 0, (i - (CARD_COUNT - 1) / 2) * 0.015]}
        >
          <boxGeometry args={[CARD_WIDTH, CARD_THICKNESS, CARD_HEIGHT]} />
          <meshStandardMaterial
            color={i === CARD_COUNT - 1 ? color : '#1a1a2a'}
            metalness={0.2}
            roughness={0.8}
            emissive={i === CARD_COUNT - 1 ? color : undefined}
            emissiveIntensity={i === CARD_COUNT - 1 ? 0.2 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

// Stack top Y in board space (card pile group y = BOARD_HEIGHT/2 + 0.02, top card at (CARD_COUNT-1)*CARD_THICKNESS)
const STACK_TOP_Y = (BOARD_HEIGHT / 2 + 0.02) + (CARD_COUNT - 1) * CARD_THICKNESS;
// Piles at opposite diagonal corners of the center (like real Monopoly)
const CHANCE_STACK_POS: [number, number, number] = [-5, STACK_TOP_Y, -5];
const CHEST_STACK_POS: [number, number, number] = [5, STACK_TOP_Y, 5];
// Collider: pile base Y in world (same as card pile group), center Y = base + half stack height
const PILE_BASE_Y = BOARD_HEIGHT / 2 + 0.02;
const PILE_COLLIDER_HALF_Y = (CARD_COUNT * CARD_THICKNESS) / 2;
const PILE_COLLIDER_CENTER_Y = PILE_BASE_Y + PILE_COLLIDER_HALF_Y;
const DRAWN_CARD_DURATION = 0.6;
const DISPLAY_POSITION: [number, number, number] = [0, 2, 0];

/** Create a canvas texture with card color, title, and description for the drawn card front face */
function useCardFaceTexture(title: string, description: string, color: string): THREE.CanvasTexture {
  return useMemo(() => {
    const w = 896;
    const h = 560;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Slightly darker background for contrast, with thin border
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);

    const pad = 56;
    let y = 88;

    // Title – bold, large for readability
    ctx.font = 'bold 72px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleWords = title.split(/\s+/);
    const titleLines: string[] = [];
    let line = '';
    for (const word of titleWords) {
      const next = line ? line + ' ' + word : word;
      if (ctx.measureText(next).width <= w - pad * 2) line = next;
      else {
        if (line) titleLines.push(line);
        line = word;
      }
    }
    if (line) titleLines.push(line);
    titleLines.forEach((l) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 3;
      ctx.strokeText(l, w / 2, y);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillText(l, w / 2, y);
      y += 78;
    });

    y += 28;
    ctx.font = '44px system-ui, sans-serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    const descWords = description.split(/\s+/);
    let descLine = '';
    for (const word of descWords) {
      const next = descLine ? descLine + ' ' + word : word;
      if (ctx.measureText(next).width <= w - pad * 2) descLine = next;
      else {
        if (descLine) {
          ctx.strokeText(descLine, w / 2, y);
          ctx.fillText(descLine, w / 2, y);
          y += 50;
        }
        descLine = word;
      }
    }
    if (descLine) {
      ctx.strokeText(descLine, w / 2, y);
      ctx.fillText(descLine, w / 2, y);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [title, description, color]);
}

function DrawnCard({ card, cardType }: { card: Card; cardType: 'chance' | 'community-chest' }) {
  const groupRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef<number | null>(null);
  const color = cardType === 'chance' ? '#ff6b35' : '#4ecdc4';
  const faceTexture = useCardFaceTexture(card.title, card.description, color);
  const startPos = cardType === 'chance' ? CHANCE_STACK_POS : CHEST_STACK_POS;

  useFrame((state) => {
    if (!groupRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    if (startTimeRef.current === null) startTimeRef.current = elapsed;
    const start = startTimeRef.current;
    const t = Math.min(1, (elapsed - start) / DRAWN_CARD_DURATION);
    const eased = 1 - (1 - t) * (1 - t); // ease out quad

    groupRef.current.position.x = startPos[0] + (DISPLAY_POSITION[0] - startPos[0]) * eased;
    groupRef.current.position.y = startPos[1] + (DISPLAY_POSITION[1] - startPos[1]) * eased;
    groupRef.current.position.z = startPos[2] + (DISPLAY_POSITION[2] - startPos[2]) * eased;

    groupRef.current.rotation.x = (-Math.PI / 2) * eased;
  });

  return (
    <group ref={groupRef} position={[...startPos]}>
      <mesh>
        <boxGeometry args={[DRAWN_CARD_WIDTH, CARD_THICKNESS, DRAWN_CARD_HEIGHT]} />
        <meshStandardMaterial
          color={color}
          metalness={0.2}
          roughness={0.8}
          emissive={color}
          emissiveIntensity={0.25}
        />
      </mesh>
      {/* Front face plane: on card’s -Y face so when card tilts -90° X it faces camera (+Z) */}
      <mesh
        position={[0, -CARD_THICKNESS / 2 - DRAWN_CARD_FACE_OFFSET, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[DRAWN_CARD_WIDTH, DRAWN_CARD_HEIGHT]} />
        <meshStandardMaterial
          map={faceTexture}
          transparent={false}
          side={THREE.FrontSide}
          depthWrite={true}
          polygonOffset={true}
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
    </group>
  );
}

interface TileComponentProps {
  tile: Tile;
  index: number;
}

function TileComponent({ tile, index }: TileComponentProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const gameState = useGameStore(state => state.gameState);
  const setShowPropertyCard = useGameStore(state => state.setShowPropertyCard);
  const propertyState = gameState?.properties[index];
  const owner = propertyState?.ownerId ? gameState?.players[propertyState.ownerId] : null;
  const isClickable =
    tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility';

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
  // On side columns (left/right), inner edge is local +Z; on top/bottom rows it's local -Z
  const isSideColumn = (index >= 11 && index <= 19) || (index >= 31 && index <= 39);
  const colorBandZ = isSideColumn ? position.depth / 2 - 0.4 : -position.depth / 2 + 0.4;
  const innerEdgeZ = isSideColumn ? position.depth / 2 - 0.8 : -position.depth / 2 + 0.8;

  // Name and price go on the OUTER edge (away from color band). Inner is -Z for bottom/right, +Z for top/left.
  const outerNameZ = isSideColumn ? -0.3 : isCorner ? 0 : 0.3;
  const outerPriceZ = isSideColumn ? -position.depth / 2 + 0.5 : position.depth / 2 - 0.5;

  // Text: lay flat and readable. Corners and horizontal rows (top/bottom) = unflipped flat; sides need Y flip.
  const isHorizontalRow = position.rotation === 0 || position.rotation === Math.PI;
  const textRotation: [number, number, number] = isCorner || isHorizontalRow
    ? [-Math.PI / 2, 0, 0]
    : [Math.PI / 2, Math.PI, 0];

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
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          if (isClickable) document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isClickable) setShowPropertyCard(index);
        }}
      >
        <boxGeometry args={[position.width - 0.05, 0.1, position.depth - 0.05]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : '#1a1a2a'}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Color band for properties – always on inner edge (toward board center) */}
      {hasColorBand && (
        <mesh
          position={[0, 0.06, colorBandZ]}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'default';
          }}
          onClick={(e) => {
            e.stopPropagation();
            setShowPropertyCard(index);
          }}
        >
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

      {/* Tile name – on outer edge so not in color band */}
      <Text
        position={[0, 0.12, outerNameZ]}
        rotation={textRotation}
        fontSize={isCorner ? 0.35 : 0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={position.width - 0.2}
        textAlign="center"
      >
        {getShortName(tile)}
      </Text>

      {/* Price for purchasable tiles – on outer edge, below name */}
      {'price' in tile && (
        <Text
          position={[0, 0.12, outerPriceZ]}
          rotation={textRotation}
          fontSize={0.2}
          color="#00ffa3"
          anchorX="center"
          anchorY="middle"
        >
          ${tile.price}
        </Text>
      )}

      {/* Tax/penalty amount for tax tiles – on outer edge, below name */}
      {tile.type === 'tax' && 'amount' in tile && (
        <Text
          position={[0, 0.12, outerPriceZ]}
          rotation={textRotation}
          fontSize={0.2}
          color="#ff8888"
          anchorX="center"
          anchorY="middle"
        >
          -${tile.amount}
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
        <group position={[0, 0.2, innerEdgeZ]}>
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
        <mesh position={[0, 0.25, innerEdgeZ]}>
          <boxGeometry args={[0.6, 0.4, 0.4]} />
          <meshStandardMaterial color="#cc0000" />
        </mesh>
      )}

      {/* Big icon for corner tiles */}
      {isCorner && (
        <group position={[0, 0.18, outerNameZ * 0.5]}>
          <Text
            position={[0, 0, 0]}
            rotation={textRotation}
            fontSize={1.1}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {tile.type === 'go'
              ? '₿'
              : tile.type === 'jail'
                ? '◉'
                : tile.type === 'free-parking'
                  ? 'P'
                  : tile.type === 'go-to-jail'
                    ? '!'
                    : ''}
          </Text>
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
      )}

      {/* Small icon for special non-corner tiles (at inner edge as badge) */}
      {!isCorner &&
        (tile.type === 'chance' || tile.type === 'community-chest' || tile.type === 'tax' || tile.type === 'railroad' || tile.type === 'utility') && (
          <Text
            position={[0, 0.14, innerEdgeZ + 0.2]}
            rotation={textRotation}
            fontSize={0.45}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {tile.type === 'chance'
              ? '?'
              : tile.type === 'community-chest'
                ? '▣'
                : tile.type === 'tax'
                  ? '$'
                  : tile.type === 'railroad'
                    ? '◆'
                    : tile.type === 'utility'
                      ? '⚡'
                      : ''}
          </Text>
        )}

    </group>
  );
}

export function Board() {
  const gameState = useGameStore(state => state.gameState);
  const drawnCard = gameState?.drawnCard ?? null;
  const pendingAction = gameState?.pendingAction;
  const showDrawnCard = drawnCard && pendingAction?.type === 'card-action';

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

      {/* Card pile colliders so dice collide with the stacks */}
      <RigidBody type="fixed" position={[CHANCE_STACK_POS[0], PILE_COLLIDER_CENTER_Y, CHANCE_STACK_POS[2]]} friction={0.5} restitution={0.2}>
        <CuboidCollider args={[CARD_WIDTH / 2, PILE_COLLIDER_HALF_Y, CARD_HEIGHT / 2]} />
      </RigidBody>
      <RigidBody type="fixed" position={[CHEST_STACK_POS[0], PILE_COLLIDER_CENTER_Y, CHEST_STACK_POS[2]]} friction={0.5} restitution={0.2}>
        <CuboidCollider args={[CARD_WIDTH / 2, PILE_COLLIDER_HALF_Y, CARD_HEIGHT / 2]} />
      </RigidBody>

      {/* Two card piles at opposite diagonal corners of center (like real Monopoly) */}
      <group position={[0, BOARD_HEIGHT / 2 + 0.02, 0]}>
        <group position={[CHANCE_STACK_POS[0], 0, CHANCE_STACK_POS[2]]}>
          <CardPile color="#ff6b35" isChance />
          <Text
            position={[0, 0.08, 1.8]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.55}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            maxWidth={3}
            textAlign="center"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {CHANCE_DECK_NAME}
          </Text>
        </group>
        <group position={[CHEST_STACK_POS[0], 0, CHEST_STACK_POS[2]]}>
          <CardPile color="#4ecdc4" isChance={false} />
          <Text
            position={[0, 0.08, 1.8]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.55}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            maxWidth={3}
            textAlign="center"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {COMMUNITY_CHEST_DECK_NAME}
          </Text>
        </group>
      </group>

      {/* Drawn card – animates from stack to center when a card is drawn */}
      {showDrawnCard && drawnCard && (
        <DrawnCard key={drawnCard.id} card={drawnCard} cardType={drawnCard.type} />
      )}

      {/* Center logo */}
      <group position={[0, BOARD_HEIGHT / 2 + 0.1, 0]}>
        <Text
          fontSize={1.5}
          color="#00ffa3"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {GAME_NAME.toUpperCase()}
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

      {/* Board edge glow – circular ring (many segments so it’s round, not diamond) */}
      <mesh position={[0, BOARD_HEIGHT / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[BOARD_SIZE / 2 - 0.1, BOARD_SIZE / 2 + 0.1, 64]} />
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
