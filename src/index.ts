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

export interface PlayerInputMessage {
  seq: number;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  aimX: number;
  aimY: number;
  attacking: boolean;
}

export interface AttackMessage {
  aimX: number;
  aimY: number;
}

export interface ConvertMessage {
  targetFaction: Faction;
}

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
  Reset: 'reset'
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
  humanRadius: 16,
  botRadius: 12,
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
  botAttackPreferenceChance: 0.75,
  botsPerHumanPlayer: 3,
  flagCaptureSeconds: 6,
  humanFlagCaptureSpeedMultiplier: 1.2
} as const;
