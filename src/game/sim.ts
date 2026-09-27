import type { Art } from "@/game/assets";
import type { Sfx } from "@/game/audio";
import {
  BUFFS,
  ENEMIES,
  MAX_PICKS,
  SALVO,
  WORLD,
  difficultyDamage,
  emptySave,
  loadSave,
  writeSave,
  xpToNext,
  type BuffId,
  type Difficulty,
  type EnemyKind,
  type SaveData,
} from "@/game/balance";

/**
 * Top-down survivor. Screen space is +x right, +y down.
 * A / Left decreases x (left on screen). D / Right increases x.
 * W / Up decreases y (up on screen). S / Down increases y.
 * Movement is strafe, not vehicle yaw.
 */

export type Mode = "menu" | "play" | "levelup" | "pause" | "dead" | "win";

export type Choice = {
  id: BuffId;
  name: string;
  detail: string;
  rank: number;
  max: number;
};

export type HudSnap = {
  mode: Mode;
  hp: number;
  maxHp: number;
  xp: number;
  xpNeed: number;
  level: number;
  time: number;
  kills: number;
  banner: string;
  bossName: string;
  bossHp: number;
  bossMax: number;
  objective: string;
  buffs: { id: BuffId; name: string; rank: number }[];
  choices: Choice[];
  best: SaveData;
};

type BulletKind = "rocket" | "frag" | "mine" | "bolt" | "pellet" | "shell";

type Bullet = {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  dmg: number;
  ttl: number;
  friendly: boolean;
  kind: BulletKind;
  bounces: number;
  canSplit: boolean;
  explode: number;
  fuse: number;
  ignoreUid: number;
};

export type Enemy = {
  alive: boolean;
  uid: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  maxHp: number;
  cool: number;
  tele: number;
  windMax: number;
  burstLeft: number;
  touchCd: number;
  flash: number;
  elite: boolean;
  angle: number;
  faceLeft: boolean;
  lastSwing: number;
};

type Gem = {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
};

export type Particle = {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  kind: "spark" | "dust" | "text" | "boom";
  text: string;
  color: string;
};

export type Decal = { x: number; y: number; r: number; life: number; max: number };

export type Tree = {
  x: number;
  y: number;
  r: number;
  kind: "palm" | "bush";
  s: number;
};

type ShotSpec = {
  range: number;
  cool: number;
  wind: number;
  burst: number;
  gap: number;
  speed: number;
  dmg: number;
  spread: number;
  pellets: number;
  ttl: number;
  explode: number;
  radius: number;
  kind: "bolt" | "pellet" | "shell";
};

const SHOTS: Partial<Record<EnemyKind, ShotSpec>> = {
  pistol: { range: 340, cool: 1.35, wind: 0.1, burst: 1, gap: 0.1, speed: 250, dmg: 9, spread: 0.06, pellets: 1, ttl: 1.5, explode: 0, radius: 4, kind: "bolt" },
  rifle: { range: 400, cool: 1.5, wind: 0.06, burst: 3, gap: 0.1, speed: 340, dmg: 6, spread: 0.1, pellets: 1, ttl: 1.2, explode: 0, radius: 4, kind: "bolt" },
  shotgun: { range: 172, cool: 1.35, wind: 0.16, burst: 1, gap: 0.1, speed: 300, dmg: 5, spread: 0.5, pellets: 5, ttl: 0.4, explode: 0, radius: 4, kind: "pellet" },
  sniper: { range: 580, cool: 2.45, wind: 0.82, burst: 1, gap: 0.1, speed: 820, dmg: 22, spread: 0.01, pellets: 1, ttl: 1.05, explode: 0, radius: 3, kind: "bolt" },
  jeep: { range: 430, cool: 1.65, wind: 0.04, burst: 7, gap: 0.07, speed: 390, dmg: 4, spread: 0.16, pellets: 1, ttl: 1.05, explode: 0, radius: 4, kind: "bolt" },
  apc: { range: 540, cool: 1.9, wind: 0.48, burst: 1, gap: 0.1, speed: 200, dmg: 18, spread: 0.03, pellets: 1, ttl: 2.3, explode: 44, radius: 9, kind: "shell" },
  tank: { range: 680, cool: 1.4, wind: 0.55, burst: 1, gap: 0.1, speed: 160, dmg: 26, spread: 0.02, pellets: 1, ttl: 2.8, explode: 60, radius: 11, kind: "shell" },
};

const WAVES: { kind: EnemyKind; start: number; every: number; cap: number }[] = [
  { kind: "machete", start: 0.4, every: 1.15, cap: 28 },
  { kind: "pistol", start: 16, every: 2.05, cap: 16 },
  { kind: "rifle", start: 36, every: 2.25, cap: 16 },
  { kind: "shotgun", start: 62, every: 3.5, cap: 8 },
  { kind: "sniper", start: 92, every: 4.3, cap: 5 },
  { kind: "jeep", start: 125, every: 13, cap: 3 },
];

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeBullet(): Bullet {
  return {
    alive: false, x: 0, y: 0, vx: 0, vy: 0, r: 6, dmg: 1, ttl: 1,
    friendly: true, kind: "rocket", bounces: 0, canSplit: false, explode: 40, fuse: -1, ignoreUid: 0,
  };
}

declare global {
  interface Window {
    __controlsTest?: {
      token?: object;
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      getY: () => number;
      setKeys: (codes: string[]) => void;
      setSteer?: (v: number) => void;
      grantXp?: (n: number) => void;
    };
  }
}

export class JungleGame {
  mode: Mode = "menu";
  anim = 0;
  time = 0;
  viewW = 800;
  viewH = 600;
  camX = WORLD / 2;
  camY = WORLD / 2;
  shakeX = 0;
  shakeY = 0;
  trauma = 0;
  hitstop = 0;
  banner = "";
  bannerT = 0;
  kills = 0;
  picks = 0;
  xp = 0;
  ranks: Record<BuffId, number> = {
    salvo: 0, firerate: 0, leech: 0, split: 0, speed: 0,
    drops: 0, rico: 0, damage: 0, hp: 0, macheteBuff: 0,
  };
  choices: Choice[] = [];
  best: SaveData = emptySave();
  trees: Tree[] = [];
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  gems: Gem[] = [];
  particles: Particle[] = [];
  decals: Decal[] = [];
  player = {
    x: WORLD / 2,
    y: WORLD / 2,
    vx: 0,
    vy: 0,
    r: 16,
    hp: 100,
    maxHp: 100,
    aim: Math.PI / 2,
    iframes: 0,
    fireCd: 0.2,
    dropCd: 0.4,
    swingCd: 0.3,
    swingAng: 0,
    swingFlash: 0,
    flash: 0,
  };
  joyX = 0;
  joyY = 0;
  difficulty: Difficulty = "normal";
  qaKeys: Set<string> | null = null;
  qaSteer: number | null = null;
  reduced = false;
  aimTarget: Enemy | null = null;

  private uid = 1;
  private spawnAcc: Record<string, number> = {};
  private spawnSerial = 0;
  private apcSpawned = false;
  private tankSpawned = false;
  private victoryLock = false;
  private winDelay = 0;
  private saved = false;
  private swingId = 1;
  private seed = 1;
  private rand = Math.random;
  private dirty = true;
  private probeToken = {};

  constructor(
    public art: Art,
    private keys: Set<string>,
    public sfx: Sfx,
  ) {
    this.best = loadSave();
    this.reduced =
      typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.growForest();
    this.reseed();
    for (let i = 0; i < 240; i++) this.bullets.push(makeBullet());
    this.bindProbe();
  }

  consumeDirty() {
    const d = this.dirty;
    this.dirty = false;
    return d;
  }

  private touch() {
    this.dirty = true;
  }

  destroy() {
    const probe = window.__controlsTest as { token?: object } | undefined;
    if (probe?.token === this.probeToken) delete window.__controlsTest;
  }

  private bindProbe() {
    const self = this;
    const probe = {
      token: this.probeToken,
      getYaw: () => self.player.aim,
      getSpeed: () => Math.hypot(self.player.vx, self.player.vy),
      getX: () => self.player.x,
      getY: () => self.player.y,
      setKeys: (codes: string[]) => {
        self.qaKeys = new Set(codes);
      },
      setSteer: (v: number) => {
        self.qaSteer = v;
      },
      grantXp: (n: number) => {
        if (self.mode !== "play") return;
        self.xp += n;
        self.tryLevel();
        self.touch();
      },
    };
    window.__controlsTest = probe;
  }

  start() {
    this.resetRun();
    this.mode = "play";
    this.sfx.musicOn = true;
    this.touch();
  }

  toMenu() {
    this.mode = "menu";
    this.victoryLock = false;
    this.clearActors();
    this.player.x = WORLD / 2;
    this.player.y = WORLD / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.sfx.musicOn = false;
    this.touch();
  }

  togglePause() {
    if (this.mode === "play") {
      this.mode = "pause";
      this.touch();
    } else if (this.mode === "pause") {
      this.mode = "play";
      this.touch();
    }
  }

  pick(index: number) {
    if (this.mode !== "levelup") return;
    const choice = this.choices[index];
    if (!choice) return;
    const id = choice.id;
    this.ranks[id] = Math.min(choice.max, this.ranks[id] + 1);
    if (id === "hp") {
      this.player.maxHp += 28;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 28);
    }
    this.picks += 1;
    this.sfx.level();
    this.banner = `УРОВЕНЬ ${Math.min(MAX_PICKS, this.picks)}`;
    this.bannerT = 1.3;
    if (this.picks < MAX_PICKS && this.xp >= xpToNext(this.picks + 1)) {
      this.xp -= xpToNext(this.picks + 1);
      this.openChoices();
    } else {
      this.mode = "play";
      this.choices = [];
    }
    this.touch();
  }

  update(dt: number) {
    this.trauma = Math.max(0, this.trauma - dt * 1.7);
    this.bannerT = Math.max(0, this.bannerT - dt);
    this.shakeX = 0;
    this.shakeY = 0;

    if (this.mode === "menu") {
      this.player.x = WORLD / 2;
      this.player.y = WORLD / 2;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.aim = Math.PI / 2;
      this.updateCamera(dt);
      return;
    }
    if (this.mode === "play" || this.mode === "levelup" || this.mode === "pause") {
      this.sfx.tick(dt);
    }
    if (this.mode !== "play") return;

    if (this.victoryLock) {
      this.updateBullets(dt);
      this.updateParticles(dt);
      this.updateGems(dt);
      this.winDelay -= dt;
      this.updateCamera(dt);
      if (this.winDelay <= 0) {
        this.mode = "win";
        this.sfx.musicOn = false;
        this.sfx.win();
        this.commit(true);
        this.touch();
      }
      return;
    }

    this.time += dt;
    this.player.iframes = Math.max(0, this.player.iframes - dt);
    this.player.flash = Math.max(0, this.player.flash - dt);
    this.player.fireCd -= dt;
    this.player.swingFlash = Math.max(0, this.player.swingFlash - dt);

    this.movePlayer(dt);
    this.updateEnemies(dt);
    this.firePlayer();
    this.swingMachete(dt);
    this.dropMines(dt);
    this.updateBullets(dt);
    this.touchDamage();
    this.updateGems(dt);
    this.updateParticles(dt);
    this.director(dt);
    this.updateCamera(dt);

    if (this.player.hp > 0 && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + dt);
    }

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.mode = "dead";
      this.sfx.musicOn = false;
      this.sfx.die();
      this.commit(false);
      this.touch();
    }
  }

  private resetRun() {
    this.clearActors();
    this.reseed();
    this.time = 0;
    this.kills = 0;
    this.picks = 0;
    this.xp = 0;
    this.banner = "";
    this.bannerT = 0;
    this.victoryLock = false;
    this.winDelay = 0;
    this.saved = false;
    this.apcSpawned = false;
    this.tankSpawned = false;
    this.spawnAcc = {};
    this.spawnSerial = 0;
    this.hitstop = 0;
    this.trauma = 0;
    this.ranks = {
      salvo: 0, firerate: 0, leech: 0, split: 0, speed: 0,
      drops: 0, rico: 0, damage: 0, hp: 0, macheteBuff: 0,
    };
    this.choices = [];
    this.player.x = WORLD / 2;
    this.player.y = WORLD / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.hp = 100;
    this.player.maxHp = 100;
    this.player.iframes = 0.4;
    this.player.fireCd = 0.35;
    this.player.aim = Math.PI / 2;
    this.camX = this.player.x;
    this.camY = this.player.y;
  }

  private reseed() {
    this.seed = 1000 + Math.floor(Math.random() * 90000);
    this.rand = mulberry(this.seed);
  }

  private clearActors() {
    for (const e of this.enemies) e.alive = false;
    for (const b of this.bullets) b.alive = false;
    for (const g of this.gems) g.alive = false;
    for (const p of this.particles) p.alive = false;
    this.decals.length = 0;
  }

  private growForest() {
    const rng = mulberry(42);
    const tryPlace = (minDist: number) => {
      for (let n = 0; n < 12; n++) {
        const x = 80 + rng() * (WORLD - 160);
        const y = 80 + rng() * (WORLD - 160);
        if (Math.hypot(x - WORLD / 2, y - WORLD / 2) < 200) continue;
        let ok = true;
        for (const t of this.trees) {
          if (Math.hypot(t.x - x, t.y - y) < minDist) {
            ok = false;
            break;
          }
        }
        if (ok) return { x, y };
      }
      return null;
    };
    for (let i = 0; i < 70; i++) {
      const p = tryPlace(110);
      if (!p) continue;
      this.trees.push({ ...p, r: 18, kind: "palm", s: 0.82 + rng() * 0.45 });
    }
    for (let i = 0; i < 100; i++) {
      const p = tryPlace(54);
      if (!p) continue;
      this.trees.push({ ...p, r: 0, kind: "bush", s: 0.65 + rng() * 0.7 });
    }
  }

  private axis() {
    if (this.qaKeys) {
      let x = 0;
      let y = 0;
      if (this.qaKeys.has("KeyA") || this.qaKeys.has("ArrowLeft")) x -= 1;
      if (this.qaKeys.has("KeyD") || this.qaKeys.has("ArrowRight")) x += 1;
      if (this.qaKeys.has("KeyW") || this.qaKeys.has("ArrowUp")) y -= 1;
      if (this.qaKeys.has("KeyS") || this.qaKeys.has("ArrowDown")) y += 1;
      const l = Math.hypot(x, y);
      if (l > 1) return { x: x / l, y: y / l };
      return { x, y };
    }
    let x = this.joyX;
    let y = this.joyY;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) x += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) y -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) y += 1;
    if (this.qaSteer !== null) x += -this.qaSteer;
    const gp = this.gamepad();
    x += gp.x;
    y += gp.y;
    const l = Math.hypot(x, y);
    if (l > 1) return { x: x / l, y: y / l };
    return { x, y };
  }

  private gamepad() {
    const pads = navigator.getGamepads?.();
    if (!pads) return { x: 0, y: 0 };
    for (const gp of pads) {
      if (!gp) continue;
      const ax = gp.axes[0] ?? 0;
      const ay = gp.axes[1] ?? 0;
      const len = Math.hypot(ax, ay);
      if (len < 0.22) continue;
      const s = Math.min(1, (len - 0.22) / 0.78);
      return { x: (ax / len) * s, y: (ay / len) * s };
    }
    return { x: 0, y: 0 };
  }

  private movePlayer(dt: number) {
    const a = this.axis();
    const speed = 172 * (1 + this.ranks.speed * 0.13);
    this.player.vx = a.x * speed;
    this.player.vy = a.y * speed;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;
    this.player.x = clamp(this.player.x, 36, WORLD - 36);
    this.player.y = clamp(this.player.y, 36, WORLD - 36);
    this.resolveTrees(this.player);
    const target = this.nearest(this.player.x, this.player.y, 920, 0);
    this.aimTarget = target;
    if (target) this.player.aim = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    else if (Math.hypot(this.player.vx, this.player.vy) > 8) {
      this.player.aim = Math.atan2(this.player.vy, this.player.vx);
    }
  }

  private resolveTrees(body: { x: number; y: number; r: number }) {
    for (const t of this.trees) {
      if (t.r <= 0) continue;
      const dx = body.x - t.x;
      const dy = body.y - t.y;
      const min = body.r + t.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= min * min || d2 < 0.01) continue;
      const d = Math.sqrt(d2);
      const push = (min - d) / d;
      body.x += dx * push;
      body.y += dy * push;
    }
  }

  private dmgMult() {
    return 1 + this.ranks.damage * 0.25;
  }

  private firePlayer() {
    if (this.player.fireCd > 0) return;
    const target = this.aimTarget ?? this.nearest(this.player.x, this.player.y, 920, 0);
    if (!target) return;
    const n = SALVO[this.ranks.salvo] ?? 1;
    const base = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    const spread = n <= 1 ? 0 : 0.14;
    const dmg = 24 * this.dmgMult();
    const speed = 360;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * spread;
      const b = this.acquireBullet();
      if (!b) break;
      b.x = this.player.x + Math.cos(a) * 18;
      b.y = this.player.y + Math.sin(a) * 18;
      b.vx = Math.cos(a) * speed;
      b.vy = Math.sin(a) * speed;
      b.r = 7;
      b.dmg = dmg;
      b.ttl = 1.25;
      b.friendly = true;
      b.kind = "rocket";
      b.bounces = this.ranks.rico;
      b.canSplit = this.ranks.split > 0;
      b.explode = 52;
      b.fuse = -1;
      b.ignoreUid = 0;
    }
    this.player.fireCd = 0.88 / (1 + this.ranks.firerate * 0.2);
    this.sfx.rocket();
    this.trauma = Math.min(1, this.trauma + 0.08);
  }

  private swingMachete(dt: number) {
    const rank = this.ranks.macheteBuff;
    if (rank <= 0) return;
    this.player.swingCd -= dt;
    if (this.player.swingCd > 0) return;
    this.player.swingCd = Math.max(0.42, 0.74 - rank * 0.04);
    this.swingId += 1;
    this.player.swingAng = this.anim * 2.4;
    this.player.swingFlash = 0.16;
    const radius = 58 + rank * 8;
    const dmg = (8 + rank * 6) * this.dmgMult();
    for (const e of this.enemies) {
      if (!e.alive || e.lastSwing === this.swingId) continue;
      if (Math.hypot(e.x - this.player.x, e.y - this.player.y) > radius + e.r) continue;
      e.lastSwing = this.swingId;
      this.damageEnemy(e, dmg, this.player.x, this.player.y);
    }
    this.sfx.swing();
  }

  private dropMines(dt: number) {
    const rank = this.ranks.drops;
    if (rank <= 0) return;
    if (Math.hypot(this.player.vx, this.player.vy) < 20) return;
    this.player.dropCd -= dt;
    if (this.player.dropCd > 0) return;
    this.player.dropCd = Math.max(0.28, 0.84 - rank * 0.1);
    const b = this.acquireBullet();
    if (!b) return;
    b.x = this.player.x;
    b.y = this.player.y;
    b.vx = 0;
    b.vy = 0;
    b.r = 8;
    b.dmg = (16 + rank * 4) * this.dmgMult();
    b.ttl = 1.4;
    b.friendly = true;
    b.kind = "mine";
    b.bounces = 0;
    b.canSplit = false;
    b.explode = 40 + rank * 2;
    b.fuse = 0.55;
    b.ignoreUid = 0;
  }

  private acquireBullet(skip?: Bullet) {
    for (const b of this.bullets) {
      if (!b.alive && b !== skip) {
        b.alive = true;
        return b;
      }
    }
    if (this.bullets.length >= 420) return null;
    const b = makeBullet();
    b.alive = true;
    this.bullets.push(b);
    return b;
  }

  private updateBullets(dt: number) {
    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.ttl -= dt;
      if (b.kind === "mine") {
        b.fuse -= dt;
        if (b.fuse <= 0 || b.ttl <= 0) this.explode(b);
        continue;
      }
      if (b.fuse > 0) b.fuse -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.fuse <= 0 && b.kind === "frag") {
        this.explode(b);
        continue;
      }
      if (b.ttl <= 0 || b.x < -40 || b.y < -40 || b.x > WORLD + 40 || b.y > WORLD + 40) {
        if (b.friendly && b.explode > 0) this.explode(b);
        else b.alive = false;
        continue;
      }
      let hitTree = false;
      for (const t of this.trees) {
        if (t.r <= 0) continue;
        if (Math.hypot(b.x - t.x, b.y - t.y) < t.r + b.r) {
          hitTree = true;
          break;
        }
      }
      if (hitTree) {
        if (b.explode > 0) this.explode(b);
        else b.alive = false;
        continue;
      }
      if (b.friendly) {
        const hit = this.nearest(b.x, b.y, b.r + 20, b.ignoreUid);
        if (hit && Math.hypot(hit.x - b.x, hit.y - b.y) < hit.r + b.r) {
          if (b.bounces > 0) {
            this.damageEnemy(hit, b.dmg * 0.65, b.x, b.y);
            b.bounces -= 1;
            b.ignoreUid = hit.uid;
            const next = this.nearest(b.x, b.y, 300, hit.uid);
            if (next) {
              const a = Math.atan2(next.y - b.y, next.x - b.x);
              const sp = Math.hypot(b.vx, b.vy) || 300;
              b.vx = Math.cos(a) * sp;
              b.vy = Math.sin(a) * sp;
              this.sfx.hit();
              continue;
            }
          }
          this.explode(b);
        }
      } else if (Math.hypot(b.x - this.player.x, b.y - this.player.y) < this.player.r + b.r) {
        if (b.explode > 0) this.explode(b);
        else {
          b.alive = false;
          this.hurtPlayer(b.dmg, b.x, b.y);
        }
      }
    }
  }

  private explode(b: Bullet) {
    if (!b.alive && b.ttl < -10) return;
    const x = b.x;
    const y = b.y;
    const dmg = b.dmg;
    const radius = b.explode;
    const friendly = b.friendly;
    const canSplit = b.canSplit;
    b.alive = false;
    b.ttl = -20;
    if (radius <= 0) return;
    if (friendly) {
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - x, e.y - y);
        if (d > radius + e.r) continue;
        const falloff = 1 - (d / (radius + e.r)) * 0.4;
        this.damageEnemy(e, dmg * falloff, x, y);
      }
      if (canSplit) this.spawnFrags(x, y, dmg);
    } else if (Math.hypot(this.player.x - x, this.player.y - y) < radius + this.player.r) {
      this.hurtPlayer(dmg, x, y);
    }
    this.burst(x, y, radius);
    this.sfx.boom();
    this.trauma = Math.min(1, this.trauma + (radius > 50 ? 0.34 : 0.16));
    if (!this.reduced) this.hitstop = Math.max(this.hitstop, radius > 50 ? 0.045 : 0.02);
    if (this.decals.length > 36) this.decals.shift();
    this.decals.push({ x, y, r: radius * 0.7, life: 6, max: 6 });
  }

  private spawnFrags(x: number, y: number, dmg: number) {
    const rank = this.ranks.split;
    const base = this.rand() * Math.PI * 2;
    for (let i = 0; i < 3; i++) {
      const b = this.acquireBullet();
      if (!b) return;
      const a = base + (i * Math.PI * 2) / 3;
      const sp = 150;
      b.x = x;
      b.y = y;
      b.vx = Math.cos(a) * sp;
      b.vy = Math.sin(a) * sp;
      b.r = 6;
      b.dmg = dmg * (0.42 + rank * 0.1);
      b.ttl = 0.7;
      b.friendly = true;
      b.kind = "frag";
      b.bounces = 0;
      b.canSplit = false;
      b.explode = 34 + rank * 3;
      b.fuse = 0.42;
      b.ignoreUid = 0;
    }
  }

  private damageEnemy(e: Enemy, dmg: number, sx: number, sy: number) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    const d = Math.hypot(e.x - sx, e.y - sy) || 1;
    const knock = e.kind === "tank" || e.kind === "apc" ? 8 : 26;
    e.x += ((e.x - sx) / d) * knock;
    e.y += ((e.y - sy) / d) * knock;
    this.floatText(e.x, e.y - e.r, Math.round(dmg).toString(), "#e6b325");
    if (e.hp <= 0) this.killEnemy(e);
    else this.sfx.hit();
  }

  private killEnemy(e: Enemy) {
    if (!e.alive) return;
    e.alive = false;
    this.kills += 1;
    const def = ENEMIES[e.kind];
    const xp = def.xp * (e.elite ? 2 : 1);
    this.spawnGem(e.x, e.y, xp);
    const n = e.kind === "tank" ? 28 : e.kind === "apc" || e.kind === "jeep" ? 16 : 8;
    for (let i = 0; i < n; i++) {
      const a = this.rand() * Math.PI * 2;
      const sp = 40 + this.rand() * 120;
      this.particle(e.x, e.y, Math.cos(a) * sp, Math.sin(a) * sp, 0.45, 3 + this.rand() * 4, "dust", "", i % 2 ? "#6b4a2a" : "#c45a12");
    }
    const heal = this.ranks.leech * (def.boss ? 4 : 1);
    if (heal > 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
      this.floatText(this.player.x, this.player.y - 28, `+${heal}`, "#7dcea0");
    }
    if (e.kind === "tank") {
      this.victoryLock = true;
      this.winDelay = 1.45;
      this.banner = "ТАНК УНИЧТОЖЕН";
      this.bannerT = 1.6;
      this.trauma = 1;
      if (!this.reduced) this.hitstop = 0.1;
      this.touch();
    }
  }

  private hurtPlayer(dmg: number, sx: number, sy: number) {
    if (this.player.iframes > 0 || this.mode !== "play" || this.victoryLock) return;
    const scaled = dmg * (1 + this.time / 500) * difficultyDamage(this.difficulty);
    this.player.hp -= scaled;
    this.player.iframes = 0.7;
    this.player.flash = 0.18;
    const d = Math.hypot(this.player.x - sx, this.player.y - sy) || 1;
    this.player.x += ((this.player.x - sx) / d) * 14;
    this.player.y += ((this.player.y - sy) / d) * 14;
    this.floatText(this.player.x, this.player.y - 30, `-${Math.round(scaled)}`, "#e23d3d");
    this.sfx.hurt();
    this.trauma = Math.min(1, this.trauma + 0.42);
    if (!this.reduced) this.hitstop = Math.max(this.hitstop, 0.04);
  }

  private updateEnemies(dt: number) {
    const px = this.player.x;
    const py = this.player.y;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.flash = Math.max(0, e.flash - dt);
      e.cool -= dt;
      e.touchCd = Math.max(0, e.touchCd - dt);
      const dx = px - e.x;
      const dy = py - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      let wx = dx / dist;
      let wy = dy / dist;
      let speed = ENEMIES[e.kind].speed * (e.elite ? 1.08 : 1);
      if (e.kind === "sniper") {
        if (dist < 230) {
          wx = -wx;
          wy = -wy;
        } else if (dist < 400) {
          const sx = -wy;
          const sy = wx;
          wx = sx;
          wy = sy;
          speed *= 0.55;
        }
      }
      let sepX = 0;
      let sepY = 0;
      for (const o of this.enemies) {
        if (!o.alive || o === e) continue;
        const sdx = e.x - o.x;
        const sdy = e.y - o.y;
        const sd = Math.hypot(sdx, sdy);
        const min = e.r + o.r;
        if (sd > 0 && sd < min) {
          sepX += (sdx / sd) * (min - sd);
          sepY += (sdy / sd) * (min - sd);
        }
      }
      e.vx = wx * speed + sepX * 6;
      e.vy = wy * speed + sepY * 6;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.x = clamp(e.x, 30, WORLD - 30);
      e.y = clamp(e.y, 30, WORLD - 30);
      this.resolveTrees(e);
      if (Math.hypot(e.vx, e.vy) > 12) {
        e.angle = Math.atan2(e.vy, e.vx);
        if (Math.abs(e.vx) > 18) e.faceLeft = e.vx < 0;
      }
      this.enemyShoot(e, dist);
    }
  }

  private enemyShoot(e: Enemy, dist: number) {
    const spec = SHOTS[e.kind];
    if (!spec) return;
    if (e.tele > 0) {
      e.tele -= 1 / 60;
      if (e.tele <= 0) this.releaseShot(e, spec);
      return;
    }
    if (e.cool <= 0 && dist < spec.range) {
      e.burstLeft = spec.burst;
      e.tele = spec.wind;
      e.windMax = spec.wind;
      e.cool = spec.cool;
    }
  }

  private releaseShot(e: Enemy, spec: ShotSpec) {
    const base = Math.atan2(this.player.y - e.y, this.player.x - e.x);
    const pellets = spec.pellets;
    for (let i = 0; i < pellets; i++) {
      const span = pellets > 1 ? spec.spread : 0;
      const a = base + (i - (pellets - 1) / 2) * (span / Math.max(1, pellets - 1)) + (this.rand() - 0.5) * spec.spread * 0.2;
      const b = this.acquireBullet();
      if (!b) break;
      const sp = spec.speed;
      b.x = e.x + Math.cos(a) * (e.r + 4);
      b.y = e.y + Math.sin(a) * (e.r + 4);
      b.vx = Math.cos(a) * sp;
      b.vy = Math.sin(a) * sp;
      b.r = spec.radius;
      b.dmg = spec.dmg * (e.elite ? 1.35 : 1);
      b.ttl = spec.ttl;
      b.friendly = false;
      b.kind = spec.kind;
      b.bounces = 0;
      b.canSplit = false;
      b.explode = spec.explode;
      b.fuse = -1;
      b.ignoreUid = 0;
    }
    e.burstLeft -= 1;
    if (e.burstLeft > 0) e.tele = spec.gap;
  }

  private touchDamage() {
    for (const e of this.enemies) {
      if (!e.alive || e.touchCd > 0) continue;
      if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.r + this.player.r) {
        e.touchCd = 0.55;
        this.hurtPlayer(ENEMIES[e.kind].touch * (e.elite ? 1.4 : 1), e.x, e.y);
      }
    }
  }

  private nearest(x: number, y: number, maxDist: number, ignoreUid: number) {
    let best: Enemy | null = null;
    let bestD = maxDist;
    for (const e of this.enemies) {
      if (!e.alive || e.uid === ignoreUid) continue;
      const d = Math.hypot(e.x - x, e.y - y) - e.r;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  private director(dt: number) {
    const alive = this.enemies.reduce((n, e) => n + (e.alive && !ENEMIES[e.kind].boss ? 1 : 0), 0);
    const scale = 1 + this.time / 110;
    if (alive < 74) {
      for (const w of WAVES) {
        if (this.time < w.start) continue;
        this.spawnAcc[w.kind] = (this.spawnAcc[w.kind] ?? 0) + dt;
        const every = Math.max(0.36, w.every / scale);
        if ((this.spawnAcc[w.kind] ?? 0) < every) continue;
        this.spawnAcc[w.kind] = 0;
        if (this.countKind(w.kind) >= w.cap) continue;
        const elite = this.spawnSerial % 18 === 17;
        this.spawnSerial += 1;
        this.spawnEnemy(w.kind, elite);
      }
    }
    if (!this.apcSpawned && this.time >= 200) {
      this.apcSpawned = true;
      this.spawnEnemy("apc", false);
      this.banner = "МИНИ-БОСС — БТР";
      this.bannerT = 2.6;
      this.touch();
    }
    const apcAlive = this.countKind("apc") > 0;
    if (!this.tankSpawned && (this.time >= 400 || (this.time >= 320 && this.apcSpawned && !apcAlive))) {
      this.tankSpawned = true;
      this.spawnEnemy("tank", false);
      this.banner = "БОСС — ТАНК";
      this.bannerT = 2.8;
      this.touch();
    }
  }

  private countKind(kind: EnemyKind) {
    let n = 0;
    for (const e of this.enemies) if (e.alive && e.kind === kind) n += 1;
    return n;
  }

  private spawnEnemy(kind: EnemyKind, elite: boolean) {
    let slot: Enemy | null = null;
    for (const e of this.enemies) {
      if (!e.alive) {
        slot = e;
        break;
      }
    }
    if (!slot) {
      if (this.enemies.length > 96 && !ENEMIES[kind].boss) return;
      slot = {
        alive: false, uid: 0, kind, x: 0, y: 0, vx: 0, vy: 0, r: 16, hp: 1, maxHp: 1,
        cool: 0, tele: 0, windMax: 0, burstLeft: 0, touchCd: 0, flash: 0, elite: false,
        angle: 0, faceLeft: false, lastSwing: 0,
      };
      this.enemies.push(slot);
    }
    const ang = this.rand() * Math.PI * 2;
    const dist = Math.hypot(this.viewW, this.viewH) * 0.55 + 50;
    let x = this.player.x + Math.cos(ang) * dist;
    let y = this.player.y + Math.sin(ang) * dist;
    x = clamp(x, 60, WORLD - 60);
    y = clamp(y, 60, WORLD - 60);
    if (Math.hypot(x - this.player.x, y - this.player.y) < 200) {
      x = this.player.x + Math.cos(ang) * 420;
      y = this.player.y + Math.sin(ang) * 420;
      x = clamp(x, 60, WORLD - 60);
      y = clamp(y, 60, WORLD - 60);
    }
    const def = ENEMIES[kind];
    const hpScale = def.boss ? 1 : 1 + this.time / 190;
    slot.alive = true;
    slot.uid = ++this.uid;
    slot.kind = kind;
    slot.x = x;
    slot.y = y;
    slot.vx = 0;
    slot.vy = 0;
    slot.r = def.radius * (elite ? 1.12 : 1);
    slot.maxHp = def.hp * hpScale * (elite ? 2.7 : 1);
    slot.hp = slot.maxHp;
    slot.cool = 0.4 + this.rand() * 0.6;
    slot.tele = 0;
    slot.windMax = 0;
    slot.burstLeft = 0;
    slot.touchCd = 0.3;
    slot.flash = 0;
    slot.elite = elite;
    slot.angle = ang + Math.PI;
    slot.faceLeft = false;
    slot.lastSwing = 0;
  }

  private spawnGem(x: number, y: number, value: number) {
    let g: Gem | null = null;
    for (const gem of this.gems) {
      if (!gem.alive) {
        g = gem;
        break;
      }
    }
    if (!g) {
      if (this.gems.length > 180) {
        this.xp += value;
        this.tryLevel();
        return;
      }
      g = { alive: false, x: 0, y: 0, vx: 0, vy: 0, value: 0 };
      this.gems.push(g);
    }
    const a = this.rand() * Math.PI * 2;
    const sp = 30 + this.rand() * 70;
    g.alive = true;
    g.x = x;
    g.y = y;
    g.vx = Math.cos(a) * sp;
    g.vy = Math.sin(a) * sp;
    g.value = value;
  }

  private updateGems(dt: number) {
    const magnet = 96 + this.picks * 6;
    for (const g of this.gems) {
      if (!g.alive) continue;
      g.vx *= Math.exp(-2.2 * dt);
      g.vy *= Math.exp(-2.2 * dt);
      const dx = this.player.x - g.x;
      const dy = this.player.y - g.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < magnet) {
        const pull = 90 + (1 - d / magnet) * 380;
        g.vx += (dx / d) * pull * dt * 6;
        g.vy += (dy / d) * pull * dt * 6;
      }
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      if (d < this.player.r + 14) {
        g.alive = false;
        this.xp += g.value;
        this.sfx.gem();
        this.tryLevel();
      }
    }
  }

  private tryLevel() {
    if (this.mode !== "play" || this.victoryLock) return;
    if (this.picks >= MAX_PICKS) return;
    if (this.xp < xpToNext(this.picks + 1)) return;
    this.xp -= xpToNext(this.picks + 1);
    this.openChoices();
  }

  private openChoices() {
    const pool = BUFFS.filter((b) => this.ranks[b.id] < b.max);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      const tmp = pool[i];
      const swap = pool[j];
      if (!tmp || !swap) continue;
      pool[i] = swap;
      pool[j] = tmp;
    }
    this.choices = pool.slice(0, 3).map((b) => ({
      id: b.id,
      name: b.name,
      detail: b.detail(this.ranks[b.id] + 1),
      rank: this.ranks[b.id],
      max: b.max,
    }));
    if (this.choices.length === 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
      this.mode = "play";
    } else {
      this.mode = "levelup";
    }
    this.touch();
  }

  private particle(
    x: number, y: number, vx: number, vy: number, life: number, size: number,
    kind: Particle["kind"], text: string, color: string,
  ) {
    let p: Particle | null = null;
    for (const item of this.particles) {
      if (!item.alive) {
        p = item;
        break;
      }
    }
    if (!p) {
      if (this.particles.length > 320) return;
      p = { alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, kind: "dust", text: "", color: "#fff" };
      this.particles.push(p);
    }
    p.alive = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.max = life;
    p.size = size;
    p.kind = kind;
    p.text = text;
    p.color = color;
  }

  private floatText(x: number, y: number, text: string, color: string) {
    let texts = 0;
    for (const p of this.particles) if (p.alive && p.kind === "text") texts += 1;
    if (texts > 28) return;
    this.particle(x, y, (this.rand() - 0.5) * 16, -40, 0.7, 13, "text", text, color);
  }

  private burst(x: number, y: number, radius: number) {
    this.particle(x, y, 0, 0, 0.38, radius * 1.3, "boom", "", "#fff");
    const n = radius > 48 ? 14 : 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const sp = 40 + this.rand() * 90;
      this.particle(x, y, Math.cos(a) * sp, Math.sin(a) * sp, 0.35, 2 + this.rand() * 3, "spark", "", i % 2 ? "#e6b325" : "#e23d3d");
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy *= p.kind === "text" ? 1 : Math.exp(-1.2 * dt);
    }
    for (const d of this.decals) d.life -= dt;
    if (this.decals.length && (this.decals[0]?.life ?? 0) <= 0) this.decals.shift();
  }

  private updateCamera(dt: number) {
    const sp = Math.hypot(this.player.vx, this.player.vy);
    const look = sp > 8 ? 26 : 0;
    const tx = this.player.x + (sp > 8 ? (this.player.vx / sp) * look : 0);
    const ty = this.player.y + (sp > 8 ? (this.player.vy / sp) * look : 0);
    const k = 1 - Math.exp(-5.5 * dt);
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
    const hw = this.viewW / 2;
    const hh = this.viewH / 2;
    if (WORLD > this.viewW) this.camX = clamp(this.camX, hw, WORLD - hw);
    else this.camX = WORLD / 2;
    if (WORLD > this.viewH) this.camY = clamp(this.camY, hh, WORLD - hh);
    else this.camY = WORLD / 2;
  }

  private commit(win: boolean) {
    if (this.saved) return;
    this.saved = true;
    const prev = loadSave();
    const next: SaveData = {
      bestTime: Math.max(prev.bestTime, this.time),
      bestKills: Math.max(prev.bestKills, this.kills),
      bestLevel: Math.max(prev.bestLevel, this.picks),
      wins: prev.wins + (win ? 1 : 0),
    };
    writeSave(next);
    this.best = next;
  }

  snapshot(): HudSnap {
    let boss: Enemy | null = null;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.kind === "tank") {
        boss = e;
        break;
      }
      if (e.kind === "apc") boss = e;
    }
    let objective = "Цель: дожить до танка";
    if (this.tankSpawned && boss?.kind === "tank") objective = "Цель: уничтожить танк";
    else if (this.mode === "win") objective = "Джунгли замолчали";
    const buffs = BUFFS.filter((b) => this.ranks[b.id] > 0).map((b) => ({
      id: b.id,
      name: b.name,
      rank: this.ranks[b.id],
    }));
    return {
      mode: this.mode,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      xp: this.xp,
      xpNeed: xpToNext(Math.min(MAX_PICKS, this.picks + 1)),
      level: this.picks,
      time: this.time,
      kills: this.kills,
      banner: this.bannerT > 0 ? this.banner : "",
      bossName: boss ? ENEMIES[boss.kind].name : "",
      bossHp: boss ? boss.hp : 0,
      bossMax: boss ? boss.maxHp : 1,
      objective,
      buffs,
      choices: this.choices,
      best: this.best,
    };
  }
}
