'use client';

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
  Stars,
  Float,
} from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Board } from './Board';
import { Dice } from './Dice';
import { PlayerTokens } from './PlayerTokens';

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00ffa3" wireframe />
    </mesh>
  );
}

interface SceneContentProps {
  onDiceRollComplete?: (result: [number, number], seed: number) => void;
  isRolling?: boolean;
  currentDiceRoll?: [number, number] | null;
  rollId?: number;
  diceRollSeed?: number;
}

function SceneContent({ onDiceRollComplete, isRolling, currentDiceRoll, rollId, diceRollSeed }: SceneContentProps) {
  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 25, 25]} fov={50} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={15}
        maxDistance={50}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <directionalLight
        position={[-10, 15, -10]}
        intensity={0.5}
      />

      {/* Point lights for crypto glow effect */}
      <pointLight position={[10, 5, 10]} intensity={0.5} color="#00ffa3" />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#627eea" />
      <pointLight position={[10, 5, -10]} intensity={0.3} color="#f7931a" />

      {/* Background stars */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {/* Physics world for dice */}
      <Physics gravity={[0, -30, 0]}>
        {/* Game Board */}
        <Board />

        {/* Player Tokens */}
        <PlayerTokens />

        {/* Dice - driven by currentDiceRoll + diceRollSeed so all clients see same deterministic animation */}
        <Dice
          onRollComplete={onDiceRollComplete}
          isRolling={isRolling}
          targetResult={currentDiceRoll ?? null}
          rollId={rollId ?? 0}
          diceRollSeed={diceRollSeed}
        />
      </Physics>

      {/* Environment for reflections */}
      <Environment preset="city" />
    </>
  );
}

interface GameSceneProps {
  onDiceRollComplete?: (result: [number, number], seed: number) => void;
  isRolling?: boolean;
  currentDiceRoll?: [number, number] | null;
  rollId?: number;
  diceRollSeed?: number;
}

export function GameScene({ onDiceRollComplete, isRolling, currentDiceRoll, rollId, diceRollSeed }: GameSceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
        }}
        style={{ background: 'linear-gradient(to bottom, #0a0a0f 0%, #1a1a2f 100%)' }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <SceneContent
            onDiceRollComplete={onDiceRollComplete}
            isRolling={isRolling}
            currentDiceRoll={currentDiceRoll}
            rollId={rollId}
            diceRollSeed={diceRollSeed}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
