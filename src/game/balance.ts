export type Difficulty = "easy" | "normal" | "hard";

export const DIFFICULTIES: { id: Difficulty; label: string; hint: string; dmg: number }[] = [
  { id: "easy", label: "Легко", hint: "Враги почти не бьют", dmg: 0.1 },
  { id: "normal", label: "Средне", hint: "Урон вдвое меньше", dmg: 0.5 },
  { id: "hard", label: "Тяжело", hint: "Полный урон", dmg: 1 },
];

export function difficultyDamage(id: Difficulty) {
  return DIFFICULTIES.find((d) => d.id === id)?.dmg ?? 1;
}

export const WORLD = 3800;
export const MAX_PICKS = 20;

export type EnemyKind =
  | "machete"
  | "pistol"
  | "shotgun"
  | "rifle"
  | "sniper"
  | "jeep"
  | "apc"
  | "tank";

export type BuffId =
  | "salvo"
  | "firerate"
  | "leech"
  | "split"
  | "speed"
  | "drops"
  | "rico"
  | "damage"
  | "hp"
  | "macheteBuff";

export type EnemyDef = {
  name: string;
  hp: number;
  speed: number;
  radius: number;
  touch: number;
  xp: number;
  score: number;
  boss: boolean;
};

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  machete: { name: "Мачете", hp: 22, speed: 124, radius: 16, touch: 12, xp: 3, score: 10, boss: false },
  pistol: { name: "Пистолет", hp: 18, speed: 76, radius: 15, touch: 8, xp: 3, score: 12, boss: false },
  shotgun: { name: "Дробовик", hp: 90, speed: 54, radius: 18, touch: 14, xp: 6, score: 22, boss: false },
  rifle: { name: "Автомат", hp: 34, speed: 88, radius: 16, touch: 10, xp: 4, score: 14, boss: false },
  sniper: { name: "Снайпер", hp: 20, speed: 62, radius: 15, touch: 6, xp: 6, score: 20, boss: false },
  jeep: { name: "Джип", hp: 160, speed: 150, radius: 28, touch: 18, xp: 14, score: 45, boss: false },
  apc: { name: "БТР", hp: 1700, speed: 66, radius: 42, touch: 26, xp: 70, score: 280, boss: true },
  tank: { name: "Танк", hp: 4800, speed: 44, radius: 52, touch: 34, xp: 140, score: 1200, boss: true },
};

/** Projectile count by salvo rank. Rank 5 fires six rockets. */
export const SALVO = [1, 2, 3, 4, 5, 6] as const;

export type BuffDef = {
  id: BuffId;
  name: string;
  max: number;
  detail: (next: number) => string;
};

function dropsEvery(rank: number) {
  return Math.max(0.28, 0.84 - rank * 0.1);
}

export const BUFFS: BuffDef[] = [
  {
    id: "salvo",
    name: "Залп",
    max: 5,
    detail: (next) => `Ракет в залпе: ${SALVO[next] ?? 6}`,
  },
  {
    id: "firerate",
    name: "Скорострельность",
    max: 5,
    detail: (next) => `Темп стрельбы +${next * 20}%`,
  },
  {
    id: "leech",
    name: "Вампиризм",
    max: 5,
    detail: (next) => `+${next} HP за убийство`,
  },
  {
    id: "split",
    name: "Осколки",
    max: 3,
    detail: (next) =>
      next <= 1 ? "Взрыв рассыпается на 3 гранаты" : `Гранаты осколков сильнее (${next})`,
  },
  {
    id: "speed",
    name: "Скорость",
    max: 5,
    detail: (next) => `Бег +${next * 13}%`,
  },
  {
    id: "drops",
    name: "Мины",
    max: 4,
    detail: (next) => `Граната под ноги каждые ${dropsEvery(next).toFixed(1)} с`,
  },
  {
    id: "rico",
    name: "Рикошет",
    max: 3,
    detail: (next) => (next === 1 ? "Ракета отскакивает 1 раз" : `Ракета отскакивает ${next} раза`),
  },
  {
    id: "damage",
    name: "Боезаряд",
    max: 5,
    detail: (next) => `Урон ракет +${next * 25}%`,
  },
  {
    id: "hp",
    name: "Живучесть",
    max: 5,
    detail: (next) => `Максимум здоровья +${next * 28}`,
  },
  {
    id: "macheteBuff",
    name: "Мачете",
    max: 5,
    detail: (next) => `Удары вокруг: урон ${8 + next * 6}`,
  },
];

export function xpToNext(step: number) {
  return Math.round(12 * Math.pow(1.2, step - 1) + 8 * step);
}

export function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

export const SAVE_KEY = "alice-jungle-v1";

export type SaveData = {
  bestTime: number;
  bestKills: number;
  bestLevel: number;
  wins: number;
};

export function emptySave(): SaveData {
  return { bestTime: 0, bestKills: 0, bestLevel: 0, wins: 0 };
}

export function loadSave(): SaveData {
  if (typeof localStorage === "undefined") return emptySave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return emptySave();
    const p = JSON.parse(raw) as Partial<SaveData>;
    return {
      bestTime: Number(p.bestTime) || 0,
      bestKills: Number(p.bestKills) || 0,
      bestLevel: Number(p.bestLevel) || 0,
      wins: Number(p.wins) || 0,
    };
  } catch {
    return emptySave();
  }
}

export function writeSave(data: SaveData) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}
