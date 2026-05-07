import { GameRules, type Faction, type MapObstacle } from './index';

export type CapsuleHitbox = {
  width: number;
  height: number;
  bottomOffset: number;
};

export type MoveIntent = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export type PlayerMotion = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export function distanceSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function normalize(dx: number, dy: number): { x: number; y: number } {
  const len = Math.hypot(dx, dy);
  if (len <= 0.0001) {
    return { x: 0, y: 0 };
  }
  return { x: dx / len, y: dy / len };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function factionHitbox(faction: Faction): CapsuleHitbox {
  return faction === 'zombie'
    ? {
      width: GameRules.zombieHitboxWidth,
      height: GameRules.zombieHitboxHeight,
      bottomOffset: GameRules.zombieHitboxBottomOffset
    }
    : {
      width: GameRules.humanHitboxWidth,
      height: GameRules.humanHitboxHeight,
      bottomOffset: GameRules.humanHitboxBottomOffset
    };
}

export function integratePlayerMotion(motion: PlayerMotion, intent: MoveIntent, faction: Faction, dt: number): PlayerMotion {
  const ix = Number(intent.right) - Number(intent.left);
  const iy = Number(intent.down) - Number(intent.up);
  const dir = normalize(ix, iy);
  const speed = faction === 'human' ? GameRules.humanSpeed : GameRules.zombieSpeed;
  const hitbox = factionHitbox(faction);
  const next = resolveCapsuleRectCollisions(
    motion.x + dir.x * speed * dt,
    motion.y + dir.y * speed * dt,
    hitbox,
    GameRules.obstacles
  );
  const bounded = clampCapsuleToBounds(next.x, next.y, hitbox, GameRules.mapWidth, GameRules.mapHeight);

  return {
    x: bounded.x,
    y: bounded.y,
    vx: dir.x * speed,
    vy: dir.y * speed
  };
}

export function clampCapsuleToBounds(
  x: number,
  y: number,
  hitbox: CapsuleHitbox,
  width: number,
  height: number
): { x: number; y: number } {
  const radius = hitbox.width / 2;
  return {
    x: clamp(x, radius, width - radius),
    y: clamp(y, hitbox.height - hitbox.bottomOffset, height - hitbox.bottomOffset)
  };
}

export function capsulePointDistanceSq(x: number, y: number, hitbox: CapsuleHitbox, pointX: number, pointY: number): number {
  const segment = capsuleSegment(x, y, hitbox);
  const closestY = clamp(pointY, segment.top, segment.bottom);
  const centerDistance = Math.hypot(x - pointX, closestY - pointY);
  const surfaceDistance = Math.max(0, centerDistance - hitbox.width / 2);
  return surfaceDistance * surfaceDistance;
}

export function capsuleDistanceSq(
  ax: number,
  ay: number,
  aHitbox: CapsuleHitbox,
  bx: number,
  by: number,
  bHitbox: CapsuleHitbox
): number {
  const a = capsuleSegment(ax, ay, aHitbox);
  const b = capsuleSegment(bx, by, bHitbox);
  const dx = ax - bx;
  let dy = 0;

  if (a.bottom < b.top) {
    dy = a.bottom - b.top;
  } else if (b.bottom < a.top) {
    dy = a.top - b.bottom;
  }

  const radius = aHitbox.width / 2 + bHitbox.width / 2;
  const centerDistance = Math.hypot(dx, dy);
  const surfaceDistance = Math.max(0, centerDistance - radius);
  return surfaceDistance * surfaceDistance;
}

export function resolveCapsuleRectCollisions(
  x: number,
  y: number,
  hitbox: CapsuleHitbox,
  obstacles: readonly MapObstacle[]
): { x: number; y: number } {
  let resolvedX = x;
  let resolvedY = y;
  const radius = hitbox.width / 2;

  for (const obstacle of obstacles) {
    const left = obstacle.x;
    const right = obstacle.x + obstacle.width;
    const top = obstacle.y;
    const bottom = obstacle.y + obstacle.height;
    const segmentTop = resolvedY + hitbox.bottomOffset - hitbox.height + radius;
    const segmentBottom = resolvedY + hitbox.bottomOffset - radius;
    const closestX = clamp(resolvedX, left, right);
    const { segmentY, rectY } = closestSegmentRectY(segmentTop, segmentBottom, top, bottom);
    const dx = resolvedX - closestX;
    const dy = segmentY - rectY;
    const distSq = dx * dx + dy * dy;

    if (distSq > 0 && distSq < radius * radius) {
      const dist = Math.sqrt(distSq);
      const push = radius - dist;
      resolvedX += (dx / dist) * push;
      resolvedY += (dy / dist) * push;
      continue;
    }

    if (distSq === 0 && resolvedX >= left && resolvedX <= right && segmentBottom >= top && segmentTop <= bottom) {
      const pushLeft = resolvedX + radius - left;
      const pushRight = right + radius - resolvedX;
      const pushTop = segmentBottom + radius - top;
      const pushBottom = bottom + radius - segmentTop;
      const minPush = Math.min(pushLeft, pushRight, pushTop, pushBottom);

      if (minPush === pushLeft) {
        resolvedX -= pushLeft;
      } else if (minPush === pushRight) {
        resolvedX += pushRight;
      } else if (minPush === pushTop) {
        resolvedY -= pushTop;
      } else {
        resolvedY += pushBottom;
      }
    }
  }

  return { x: resolvedX, y: resolvedY };
}

export function capsuleIntersectsRect(x: number, y: number, hitbox: CapsuleHitbox, obstacle: MapObstacle): boolean {
  const radius = hitbox.width / 2;
  const segment = capsuleSegment(x, y, hitbox);
  const closestX = clamp(x, obstacle.x, obstacle.x + obstacle.width);
  const { segmentY, rectY } = closestSegmentRectY(segment.top, segment.bottom, obstacle.y, obstacle.y + obstacle.height);
  return distanceSq(x, segmentY, closestX, rectY) < radius * radius;
}

export function capsuleSegment(x: number, y: number, hitbox: CapsuleHitbox): { top: number; bottom: number } {
  const radius = hitbox.width / 2;
  return {
    top: y + hitbox.bottomOffset - hitbox.height + radius,
    bottom: y + hitbox.bottomOffset - radius
  };
}

function closestSegmentRectY(
  segmentTop: number,
  segmentBottom: number,
  rectTop: number,
  rectBottom: number
): { segmentY: number; rectY: number } {
  if (segmentBottom < rectTop) {
    return { segmentY: segmentBottom, rectY: rectTop };
  }
  if (segmentTop > rectBottom) {
    return { segmentY: segmentTop, rectY: rectBottom };
  }

  const overlapTop = Math.max(segmentTop, rectTop);
  const overlapBottom = Math.min(segmentBottom, rectBottom);
  const y = (overlapTop + overlapBottom) / 2;
  return { segmentY: y, rectY: y };
}

export function resolveCircleRectCollisions(
  x: number,
  y: number,
  radius: number,
  obstacles: readonly MapObstacle[]
): { x: number; y: number } {
  let resolvedX = x;
  let resolvedY = y;

  for (const obstacle of obstacles) {
    const left = obstacle.x;
    const right = obstacle.x + obstacle.width;
    const top = obstacle.y;
    const bottom = obstacle.y + obstacle.height;
    const closestX = clamp(resolvedX, left, right);
    const closestY = clamp(resolvedY, top, bottom);
    const dx = resolvedX - closestX;
    const dy = resolvedY - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq > 0 && distSq < radius * radius) {
      const dist = Math.sqrt(distSq);
      const push = radius - dist;
      resolvedX += (dx / dist) * push;
      resolvedY += (dy / dist) * push;
      continue;
    }

    if (distSq === 0 && resolvedX >= left && resolvedX <= right && resolvedY >= top && resolvedY <= bottom) {
      const pushLeft = Math.abs(resolvedX - left);
      const pushRight = Math.abs(right - resolvedX);
      const pushTop = Math.abs(resolvedY - top);
      const pushBottom = Math.abs(bottom - resolvedY);
      const minPush = Math.min(pushLeft, pushRight, pushTop, pushBottom);

      if (minPush === pushLeft) {
        resolvedX = left - radius;
      } else if (minPush === pushRight) {
        resolvedX = right + radius;
      } else if (minPush === pushTop) {
        resolvedY = top - radius;
      } else {
        resolvedY = bottom + radius;
      }
    }
  }

  return { x: resolvedX, y: resolvedY };
}
