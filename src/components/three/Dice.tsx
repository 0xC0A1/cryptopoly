'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CuboidCollider, interactionGroups } from '@react-three/rapier';
import * as THREE from 'three';

/** Seeded RNG (mulberry32) – same seed produces same sequence on all clients */
function createSeededRng(seed: number): () => number {
  return function next() {
    seed |= 0;
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    return ((t ^ (t >>> 7)) >>> 0) / 4294967296;
  };
}

// Dice face configurations (value -> rotation in euler angles)
const FACE_ROTATIONS: Record<number, [number, number, number]> = {
  1: [0, 0, 0],
  2: [0, 0, Math.PI / 2],
  3: [Math.PI / 2, 0, 0],
  4: [-Math.PI / 2, 0, 0],
  5: [0, 0, -Math.PI / 2],
  6: [Math.PI, 0, 0],
};

// Local face normals (must match mesh: 1=+Z, 2=+X, 3=+Y, 4=-Y, 5=-X, 6=-Z)
const FACE_NORMALS: [number, number, number][] = [
  [0, 0, 1],   // 1: front (+Z)
  [1, 0, 0],   // 2: right (+X)
  [0, 1, 0],   // 3: top (+Y)
  [0, -1, 0],  // 4: bottom (-Y)
  [-1, 0, 0],  // 5: left (-X)
  [0, 0, -1],  // 6: back (-Z)
];

/** Which face is pointing up (world +Y) by transforming local normals. */
function getFaceValueFromQuaternion(q: { x: number; y: number; z: number; w: number }): number {
  const quat = new THREE.Quaternion(q.x, q.y, q.z, q.w);
  const up = new THREE.Vector3(0, 1, 0);
  let bestFace = 1;
  let bestDot = -Infinity;
  for (let face = 1; face <= 6; face++) {
    const [nx, ny, nz] = FACE_NORMALS[face - 1];
    const normal = new THREE.Vector3(nx, ny, nz).applyQuaternion(quat);
    const dot = normal.dot(up);
    if (dot > bestDot) {
      bestDot = dot;
      bestFace = face;
    }
  }
  return bestFace;
}

interface SingleDieProps {
  position: [number, number, number];
  color: string;
  onSettled?: (value: number) => void;
  triggerRoll?: boolean;
  targetValue?: number;
  /** Deterministic RNG – same seed on all clients gives same animation */
  getNextRandom?: () => number;
}

function SingleDie({ position, color, onSettled, triggerRoll, targetValue, getNextRandom }: SingleDieProps) {
  const rigidBodyRef = useRef<RapierRigidBody | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [isSettled, setIsSettled] = useState(true);
  const settledTimeRef = useRef(0);
  const hasReportedRef = useRef(false);
  const hasRolledForTriggerRef = useRef(false);
  const rngRef = useRef<() => number>(() => Math.random());
  rngRef.current = getNextRandom ?? (() => Math.random());

  // Roll the die – only call when we have a valid body (e.g. from useFrame)
  const roll = useCallback((rb: RapierRigidBody) => {
    const rng = rngRef.current;
    hasReportedRef.current = false;
    setIsSettled(false);
    settledTimeRef.current = 0;

    // Reset position (high so they fall and tumble)
    rb.setTranslation({ x: position[0], y: 8, z: position[2] }, true);

    const randomRotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        rng() * Math.PI * 2,
        rng() * Math.PI * 2,
        rng() * Math.PI * 2
      )
    );
    rb.setRotation(randomRotation, true);

    rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

    const impulse = {
      x: (rng() - 0.5) * 12,
      y: -8,
      z: (rng() - 0.5) * 12,
    };
    rb.applyImpulse(impulse, true);

    const torque = {
      x: (rng() - 0.5) * 40,
      y: (rng() - 0.5) * 40,
      z: (rng() - 0.5) * 40,
    };
    rb.applyTorqueImpulse(torque, true);
  }, [position]);

  // Trigger roll from useFrame once we have a body – ensures ref is set and physics world exists
  useFrame(() => {
    if (!triggerRoll || hasRolledForTriggerRef.current) return;
    const rb = rigidBodyRef.current;
    if (!rb) return;

    hasRolledForTriggerRef.current = true;
    roll(rb);
  });

  // Reset "have rolled" when trigger goes off so next roll can fire
  useEffect(() => {
    if (!triggerRoll) hasRolledForTriggerRef.current = false;
  }, [triggerRoll]);

  // Check if die has settled
  useFrame((_, delta) => {
    if (!rigidBodyRef.current || isSettled) return;

    const rb = rigidBodyRef.current;
    const linvel = rb.linvel();
    const angvel = rb.angvel();

    const speed = Math.sqrt(linvel.x ** 2 + linvel.y ** 2 + linvel.z ** 2);
    const angSpeed = Math.sqrt(angvel.x ** 2 + angvel.y ** 2 + angvel.z ** 2);

    const totalSpeed = speed + angSpeed;

    if (totalSpeed < 0.5) {
      settledTimeRef.current += delta;

      if (settledTimeRef.current > 0.5 && !hasReportedRef.current) {
        setIsSettled(true);
        hasReportedRef.current = true;

        const rot = rb.rotation();
        const physicsValue = getFaceValueFromQuaternion(rot);
        const value = targetValue ?? physicsValue;
        // Don't snap rotation – deterministic physics already landed the correct face; snapping would break the animation
        onSettled?.(value);
      }
    } else {
      settledTimeRef.current = 0;
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      colliders={false}
      restitution={0.3}
      friction={0.8}
      mass={1}
    >
      <CuboidCollider args={[0.5, 0.5, 0.5]} collisionGroups={interactionGroups(0)} />
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Dice dots - Face 1 (front) */}
      <mesh position={[0, 0, 0.51]}>
        <circleGeometry args={[0.12, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Face 6 (back) */}
      {[[-0.25, 0.25], [0.25, 0.25], [-0.25, 0], [0.25, 0], [-0.25, -0.25], [0.25, -0.25]].map(([x, y], i) => (
        <mesh key={`f6-${i}`} position={[x, y, -0.51]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.08, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}

      {/* Face 2 (right) */}
      {[[-0.25, 0.25], [0.25, -0.25]].map(([y, z], i) => (
        <mesh key={`f2-${i}`} position={[0.51, y, z]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.1, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}

      {/* Face 5 (left) */}
      {[[-0.25, 0.25], [0.25, 0.25], [0, 0], [-0.25, -0.25], [0.25, -0.25]].map(([y, z], i) => (
        <mesh key={`f5-${i}`} position={[-0.51, y, z]} rotation={[0, -Math.PI / 2, 0]}>
          <circleGeometry args={[0.08, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}

      {/* Face 3 (top) */}
      {[[-0.25, 0.25], [0, 0], [0.25, -0.25]].map(([x, z], i) => (
        <mesh key={`f3-${i}`} position={[x, 0.51, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.1, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}

      {/* Face 4 (bottom) */}
      {[[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25], [0.25, -0.25]].map(([x, z], i) => (
        <mesh key={`f4-${i}`} position={[x, -0.51, z]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.09, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}
    </RigidBody>
  );
}

interface DiceProps {
  onRollComplete?: (result: [number, number], seed: number) => void;
  isRolling?: boolean;
  /** Authoritative result from game state - drives animation for all clients and ensures dice show correct values */
  targetResult?: [number, number] | null;
  /** Unique id per roll (from game state lastDiceRollId) - trigger animation exactly once per roll */
  rollId?: number;
  /** Seed for deterministic display roll – same on all clients so animation matches */
  diceRollSeed?: number;
}

export function Dice({ onRollComplete, isRolling, targetResult, rollId = 0, diceRollSeed }: DiceProps) {
  const [die1Value, setDie1Value] = useState<number | null>(null);
  const [die2Value, setDie2Value] = useState<number | null>(null);
  const [rollTrigger, setRollTrigger] = useState(0);
  const [pendingResult, setPendingResult] = useState<{ die1?: number; die2?: number }>({});
  const lastTriggeredRollIdRef = useRef<number>(-1);
  const lastIsRollingRef = useRef(false);
  const isPhysicsRollInProgressRef = useRef(false);
  const hasReportedRollRef = useRef(false);
  /** Seed for current roll – generated for physics roll, from props for display roll */
  const rollSeedRef = useRef<number>(0);
  const seededRngRef = useRef<() => number>(() => Math.random());

  // Physics roll: current player clicked roll – trigger dice with no targetValue; value comes from physics when settled
  useEffect(() => {
    if (isRolling && !lastIsRollingRef.current && !targetResult?.length) {
      lastIsRollingRef.current = true;
      isPhysicsRollInProgressRef.current = true;
      rollSeedRef.current = (Math.random() * 0xffffffff) >>> 0;
      seededRngRef.current = createSeededRng(rollSeedRef.current);
      setDie1Value(null);
      setDie2Value(null);
      setPendingResult({});
      setRollTrigger(prev => prev + 1);
    }
    if (!isRolling) lastIsRollingRef.current = false;
  }, [isRolling, targetResult?.length]);

  // Display roll: received roll from network – trigger once per rollId when we have targetResult and seed
  const rollResultKey = targetResult?.length === 2 ? `${targetResult[0]},${targetResult[1]}` : '';
  useEffect(() => {
    if (rollId <= 0 || !rollResultKey) return;
    if (rollId === lastTriggeredRollIdRef.current) return;
    if (isPhysicsRollInProgressRef.current) {
      isPhysicsRollInProgressRef.current = false;
      lastTriggeredRollIdRef.current = rollId;
      return;
    }

    lastTriggeredRollIdRef.current = rollId;
    const seed = diceRollSeed ?? 0;
    rollSeedRef.current = seed;
    seededRngRef.current = createSeededRng(seed);
    setDie1Value(null);
    setDie2Value(null);
    setPendingResult({});
    setRollTrigger(prev => prev + 1);
  }, [rollId, rollResultKey, diceRollSeed]);

  // Report roll once when both dice have settled. Defer so we don't update store during useFrame/setState.
  const reportRollOnce = useCallback(
    (result: [number, number], seed: number) => {
      if (hasReportedRollRef.current) return;
      hasReportedRollRef.current = true;
      queueMicrotask(() => onRollComplete?.(result, seed));
    },
    [onRollComplete]
  );

  // Reset "reported" when we start a new roll (rollTrigger changes when we mount new dice)
  useEffect(() => {
    hasReportedRollRef.current = false;
  }, [rollTrigger]);

  const handleDie1Settled = useCallback(
    (value: number) => {
      setDie1Value(value);
      setPendingResult(prev => {
        const newResult = { ...prev, die1: value };
        if (newResult.die2 !== undefined) {
          reportRollOnce([value, newResult.die2], rollSeedRef.current);
        }
        return newResult;
      });
    },
    [reportRollOnce]
  );

  const handleDie2Settled = useCallback(
    (value: number) => {
      setDie2Value(value);
      setPendingResult(prev => {
        const newResult = { ...prev, die2: value };
        if (newResult.die1 !== undefined) {
          reportRollOnce([newResult.die1, value], rollSeedRef.current);
        }
        return newResult;
      });
    },
    [reportRollOnce]
  );

  // Dice pit: closed box so dice land on the board. Board top is at y=0.15 (BOARD_HEIGHT/2).
  // Floor collider top = PIT_FLOOR_Y + 0.5; set so that equals 0.15 so dice rest on table.
  const PIT_HALF = 6;
  const PIT_FLOOR_Y = 0.15 - 0.5; // -0.35 so floor top is at 0.15 (board top)
  const PIT_WALL_HEIGHT = 7;
  const PIT_CEILING_Y = 14;

  return (
    <group position={[0, 0, 0]}>
      {/* Invisible floor */}
      <RigidBody type="fixed" position={[0, PIT_FLOOR_Y, 0]}>
        <CuboidCollider args={[PIT_HALF, 0.5, PIT_HALF]} />
      </RigidBody>

      {/* Invisible walls (tall enough that dice dropping from y=8 can't bounce over) */}
      <RigidBody type="fixed" position={[PIT_HALF, PIT_WALL_HEIGHT, 0]}>
        <CuboidCollider args={[0.5, PIT_WALL_HEIGHT, PIT_HALF]} />
      </RigidBody>
      <RigidBody type="fixed" position={[-PIT_HALF, PIT_WALL_HEIGHT, 0]}>
        <CuboidCollider args={[0.5, PIT_WALL_HEIGHT, PIT_HALF]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, PIT_WALL_HEIGHT, PIT_HALF]}>
        <CuboidCollider args={[PIT_HALF, PIT_WALL_HEIGHT, 0.5]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, PIT_WALL_HEIGHT, -PIT_HALF]}>
        <CuboidCollider args={[PIT_HALF, PIT_WALL_HEIGHT, 0.5]} />
      </RigidBody>

      {/* Invisible ceiling so dice can't escape upward */}
      <RigidBody type="fixed" position={[0, PIT_CEILING_Y, 0]}>
        <CuboidCollider args={[PIT_HALF, 0.5, PIT_HALF]} />
      </RigidBody>

      {/* Shared seeded RNG so both dice use same sequence (deterministic across clients) */}
      <SingleDie
        key={`die1-${rollTrigger}`}
        position={[-1.5, 5, 0]}
        color="#1a1a2a"
        onSettled={handleDie1Settled}
        triggerRoll={rollTrigger > 0 && ((isRolling && !targetResult?.length) || !!targetResult?.length)}
        targetValue={targetResult?.[0]}
        getNextRandom={seededRngRef.current}
      />
      <SingleDie
        key={`die2-${rollTrigger}`}
        position={[1.5, 5, 0]}
        color="#1a1a2a"
        onSettled={handleDie2Settled}
        triggerRoll={rollTrigger > 0 && ((isRolling && !targetResult?.length) || !!targetResult?.length)}
        targetValue={targetResult?.[1]}
        getNextRandom={seededRngRef.current}
      />
    </group>
  );
}
