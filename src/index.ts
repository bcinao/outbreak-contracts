export type Faction = 'human' | 'zombie';

export type EntityKind = 'player' | 'bot';

export type FlagOwner = Faction | 'neutral';

export interface MapObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface JoinOptions {
  displayName?: string;
  preferredFaction?: Faction;
}

export interface ViewportInterest {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlayerInputMessage {
  seq: number;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  aimX: number;
  aimY: number;
  attacking: boolean;
  viewport: ViewportInterest;
}

export interface AttackMessage {
  aimX: number;
  aimY: number;
}

export interface ConvertMessage {
  targetFaction: Faction;
}

export interface BotsEnabledMessage {
  enabled: boolean;
}

export type InputValidationResult =
  | { ok: true; value: PlayerInputMessage }
  | { ok: false; reason: string };

export interface EntitySnapshot {
  id: string;
  kind: EntityKind;
  faction: Faction;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
}

export interface FlagSnapshot {
  id: string;
  x: number;
  y: number;
  owner: FlagOwner;
  progress: number;
  capturingFaction: FlagOwner;
}

export const OUTBREAK_ROOM_NAME = 'outbreak';

export const ClientMessage = {
  Input: 'input',
  Attack: 'attack',
  Convert: 'convert',
  Reset: 'reset',
  SetBotsEnabled: 'setBotsEnabled'
} as const;

export const ServerMessage = {
  Killed: 'killed',
  Converted: 'converted',
  FlagCaptured: 'flagCaptured',
  GameOver: 'gameOver'
} as const;

export const GameRules = {
  mapWidth: 4096,
  mapHeight: 4096,
  obstacles: [
    { x: 430, y: 240, width: 120, height: 42 },
    { x: 735, y: 438, width: 160, height: 42 },
    { x: 600, y: 96, width: 52, height: 160 },
    { x: 210, y: 475, width: 86, height: 96 },
    { x: 940, y: 145, width: 140, height: 70 },
    { x: 1040, y: 560, width: 58, height: 110 },
    { x: 1480, y: 300, width: 260, height: 70 },
    { x: 1940, y: 620, width: 90, height: 290 },
    { x: 2440, y: 210, width: 180, height: 150 },
    { x: 3120, y: 520, width: 330, height: 64 },
    { x: 3540, y: 980, width: 72, height: 330 },
    { x: 430, y: 1280, width: 300, height: 74 },
    { x: 960, y: 1620, width: 70, height: 300 },
    { x: 1530, y: 1380, width: 250, height: 96 },
    { x: 2220, y: 1620, width: 360, height: 78 },
    { x: 3020, y: 1460, width: 92, height: 360 },
    { x: 3480, y: 1740, width: 260, height: 96 },
    { x: 620, y: 2300, width: 120, height: 360 },
    { x: 1180, y: 2540, width: 340, height: 82 },
    { x: 1860, y: 2220, width: 86, height: 320 },
    { x: 2460, y: 2580, width: 300, height: 72 },
    { x: 3300, y: 2380, width: 140, height: 300 },
    { x: 340, y: 3340, width: 420, height: 76 },
    { x: 1120, y: 3240, width: 82, height: 300 },
    { x: 1780, y: 3460, width: 300, height: 90 },
    { x: 2600, y: 3180, width: 90, height: 360 },
    { x: 3340, y: 3360, width: 360, height: 82 }
  ],
  humanHitboxWidth: 24,
  humanHitboxHeight: 48,
  humanHitboxBottomOffset: 30,
  zombieHitboxWidth: 32,
  zombieHitboxHeight: 66,
  zombieHitboxBottomOffset: 42,
  flagRadius: 38,
  humanSpeed: 210,
  zombieSpeed: 105,
  humanAttackRange: 220,
  zombieAttackRange: 20,
  attackDamage: 18,
  attackCooldownMs: 450,
  maxHpHuman: 120,
  maxHpZombie: 300,
  respawnMs: 2000,
  botSpawnMoveCooldownMs: 1000,
  botAiTickMs: 100,
  botDetectionRadius: 1300,
  spatialGridCellSize: 512,
  botAttackPreferenceChance: 0.75,
  botsPerHumanPlayer: 3,
  maxBotsPerRoom: 120,
  flagCaptureSeconds: 6,
  humanFlagCaptureSpeedMultiplier: 1.2
} as const;

const MAX_INPUT_SEQ = 1_000_000_000;

export function validatePlayerInputMessage(message: unknown): InputValidationResult {
  if (!isRecord(message)) {
    return { ok: false, reason: 'input payload must be an object' };
  }

  if (
    typeof message.up !== 'boolean' ||
    typeof message.down !== 'boolean' ||
    typeof message.left !== 'boolean' ||
    typeof message.right !== 'boolean' ||
    typeof message.attacking !== 'boolean'
  ) {
    return { ok: false, reason: 'movement and attack fields must be booleans' };
  }

  const seq = finiteNumber(message.seq);
  const aimX = finiteNumber(message.aimX);
  const aimY = finiteNumber(message.aimY);
  if (seq === undefined || aimX === undefined || aimY === undefined) {
    return { ok: false, reason: 'seq and aim fields must be finite numbers' };
  }

  const viewport = validateViewportInterest(message.viewport);
  if (!viewport.ok) {
    return viewport;
  }

  return {
    ok: true,
    value: {
      seq: clampValue(Math.trunc(seq), 0, MAX_INPUT_SEQ),
      up: message.up,
      down: message.down,
      left: message.left,
      right: message.right,
      aimX: clampValue(aimX, 0, GameRules.mapWidth),
      aimY: clampValue(aimY, 0, GameRules.mapHeight),
      attacking: message.attacking,
      viewport: viewport.value
    }
  };
}

type ViewportValidationResult =
  | { ok: true; value: ViewportInterest }
  | { ok: false; reason: string };

function validateViewportInterest(value: unknown): ViewportValidationResult {
  if (!isRecord(value)) {
    return { ok: false, reason: 'viewport must be an object' };
  }

  const x = finiteNumber(value.x);
  const y = finiteNumber(value.y);
  const width = finiteNumber(value.width);
  const height = finiteNumber(value.height);
  if (x === undefined || y === undefined || width === undefined || height === undefined) {
    return { ok: false, reason: 'viewport fields must be finite numbers' };
  }

  return {
    ok: true,
    value: {
      x,
      y,
      width,
      height
    }
  };
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export * from './simulation';
