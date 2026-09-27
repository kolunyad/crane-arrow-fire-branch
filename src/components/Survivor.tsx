import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  Axe,
  Bomb,
  Crosshair,
  Footprints,
  Gauge,
  Heart,
  Pause,
  Play,
  Rocket,
  Shield,
  Undo2,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { loadArt } from "@/game/assets";
import { Sfx } from "@/game/audio";
import {
  DIFFICULTIES,
  ENEMIES,
  MAX_PICKS,
  formatTime,
  loadSave,
  type BuffId,
  type Difficulty,
  type EnemyKind,
  type SaveData,
} from "@/game/balance";
import { drawWorld } from "@/game/draw";
import { JungleGame, type HudSnap } from "@/game/sim";

const ICONS: Record<BuffId, typeof Rocket> = {
  salvo: Rocket,
  firerate: Gauge,
  leech: Heart,
  split: Bomb,
  speed: Footprints,
  drops: Crosshair,
  rico: Undo2,
  damage: Zap,
  hp: Shield,
  macheteBuff: Axe,
};

const ROSTER: EnemyKind[] = ["machete", "pistol", "rifle", "shotgun", "sniper", "jeep", "apc", "tank"];

export function Survivor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<JungleGame | null>(null);
  const keysRef = useRef(new Set<string>());
  const joyRef = useRef({ x: 0, y: 0 });
  const sfxRef = useRef<Sfx | null>(null);
  if (!sfxRef.current) sfxRef.current = new Sfx();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [snap, setSnap] = useState<HudSnap | null>(null);
  const [best, setBest] = useState<SaveData | null>(null);
  const [muted, setMuted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");

  useEffect(() => {
    setBest(loadSave());
    try {
      const saved = localStorage.getItem("sunny-jungle-diff");
      if (saved === "easy" || saved === "normal" || saved === "hard") setDifficulty(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const sfx = sfxRef.current;
    if (!canvas || !sfx) return;
    const keys = keysRef.current;
    let stop = false;
    let raf = 0;
    let game: JungleGame | null = null;
    let acc = 0;
    let last = performance.now();
    let lastUi = 0;

    const onDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      if (e.repeat) return;
      keys.add(e.code);
      const g = gameRef.current;
      if (!g) return;
      if (e.code === "Digit1" || e.code === "Numpad1") g.pick(0);
      if (e.code === "Digit2" || e.code === "Numpad2") g.pick(1);
      if (e.code === "Digit3" || e.code === "Numpad3") g.pick(2);
      if (e.code === "Escape" || e.code === "KeyP") g.togglePause();
      if (e.code === "Enter" && g.mode === "menu") {
        sfx.unlock();
        g.start();
      }
    };
    const onUp = (e: KeyboardEvent) => keys.delete(e.code);
    const onBlur = () => keys.clear();
    const onVis = () => sfx.resume();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVis);

    void (async () => {
      try {
        const art = await loadArt();
        if (stop) return;
        game = new JungleGame(art, keys, sfx);
        gameRef.current = game;
        setReady(true);
        setSnap(game.snapshot());
        const loop = (now: number) => {
          if (stop || !game) return;
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          const rect = canvas.getBoundingClientRect();
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const w = Math.max(1, rect.width);
          const h = Math.max(1, rect.height);
          if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
          }
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          game.viewW = w;
          game.viewH = h;
          if (game.mode === "play") {
            game.joyX = joyRef.current.x;
            game.joyY = joyRef.current.y;
          } else {
            joyRef.current = { x: 0, y: 0 };
            game.joyX = 0;
            game.joyY = 0;
          }
          if (game.hitstop > 0 && game.mode === "play") {
            game.hitstop -= dt;
          } else {
            game.anim += dt;
            acc += dt;
            let steps = 0;
            while (acc >= 1 / 60 && steps < 5) {
              game.update(1 / 60);
              acc -= 1 / 60;
              steps += 1;
            }
          }
          drawWorld(ctx, game, w, h);
          if (game.consumeDirty() || now - lastUi > 120) {
            lastUi = now;
            setSnap(game.snapshot());
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : "Не удалось открыть джунгли");
      }
    })();

    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      game?.destroy();
      gameRef.current = null;
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const mode = snap?.mode ?? "menu";
  const hpPct = snap ? Math.max(0, Math.min(100, (snap.hp / snap.maxHp) * 100)) : 100;
  const xpPct = snap && snap.level < MAX_PICKS ? Math.max(0, Math.min(100, (snap.xp / snap.xpNeed) * 100)) : 100;

  useEffect(() => {
    if (gameRef.current) gameRef.current.difficulty = difficulty;
  }, [difficulty, ready]);

  function chooseDifficulty(next: Difficulty) {
    setDifficulty(next);
    if (gameRef.current) gameRef.current.difficulty = next;
    try {
      localStorage.setItem("sunny-jungle-diff", next);
    } catch {
      /* ignore */
    }
  }

  function begin() {
    sfxRef.current?.unlock();
    if (gameRef.current) gameRef.current.difficulty = difficulty;
    gameRef.current?.start();
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    sfxRef.current?.unlock();
    sfxRef.current?.setMuted(next);
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col p-3 sm:p-4">
        {snap && mode !== "menu" ? (
          <div className="flex items-start justify-between gap-3">
            <div className="w-full max-w-xs">
              <div className="mb-1 flex items-center justify-between text-xs text-muted">
                <span className="font-display text-fg">
                  Ур. {Math.min(MAX_PICKS, snap.level)}/{MAX_PICKS}
                </span>
                <span>{Math.ceil(snap.hp)} / {Math.ceil(snap.maxHp)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full bg-primary ${hpPct < 30 ? "animate-pulse" : ""}`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full bg-accent" style={{ width: `${xpPct}%` }} />
              </div>
              {snap.buffs.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1">
                  {snap.buffs.map((b) => {
                    const Icon = ICONS[b.id];
                    return (
                      <li
                        key={b.id}
                        className="flex items-center gap-1 rounded-full border border-line bg-surface/80 px-2 py-1 text-xs"
                      >
                        <Icon className="size-3 text-accent" aria-hidden />
                        <span>{b.name}</span>
                        <span className="text-accent">{b.rank}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <div className="font-display text-2xl tabular-nums">{formatTime(snap.time)}</div>
              <div className="text-xs text-muted">{snap.objective}</div>
              <div className="text-sm">Убийства {snap.kills}</div>
              <div className="pointer-events-auto flex gap-2">
                {mode === "play" || mode === "pause" ? (
                  <button
                    type="button"
                    className="flex size-11 items-center justify-center rounded-full border border-line bg-surface text-fg"
                    onClick={() => gameRef.current?.togglePause()}
                    aria-label={mode === "pause" ? "Продолжить" : "Пауза"}
                  >
                    {mode === "pause" ? <Play className="size-4" /> : <Pause className="size-4" />}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="flex size-11 items-center justify-center rounded-full border border-line bg-surface text-fg"
                  onClick={toggleMute}
                  aria-label={muted ? "Включить звук" : "Выключить звук"}
                >
                  {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {snap && snap.bossName ? (
          <div className="mx-auto mt-3 w-full max-w-sm text-center">
            <div className="mb-1 font-display text-sm text-primary">{snap.bossName}</div>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.max(0, (snap.bossHp / snap.bossMax) * 100)}%` }}
              />
            </div>
          </div>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {snap?.banner ?? ""}
        </p>
      </div>

      {mode === "play" ? (
        <Stick
          onChange={(x, y) => {
            joyRef.current = { x, y };
          }}
        />
      ) : null}

      {!ready && !error ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-bg">
          <p className="font-display text-xl">Собираем джунгли…</p>
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-bg p-6 text-center">
          <p>{error}</p>
        </div>
      ) : null}

      {ready && mode === "menu" ? (
        <div className="absolute inset-0 z-30 overflow-y-auto bg-bg">
          <img
            src="/sprites/splash.jpg"
            alt="Алиса в ночных джунглях с ракетницей на плече"
            className="mx-auto block max-h-[62vh] w-full object-contain object-top"
          />
          <div className="relative z-10 mx-auto -mt-8 w-full max-w-3xl px-3 pb-6 sm:px-6">
            <section className="rounded-lg border border-line bg-surface/95 p-4 shadow-2xl md:p-5">
              <p className="text-xs tracking-widest text-accent">КАМБОДЖА · НОЧЬ · РПГ</p>
              <h1 className="mt-1 font-display text-4xl leading-none sm:text-5xl">Sunny, Jungle Angel</h1>
              <p className="mt-3 max-w-xl text-muted">
                Солнышко, сделал тебе симулятор Камбоджи с РПГ и врагами. Тебя ждет один уровень в джунглях, много видов врагов и три уровня сложности.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => {
                  const on = difficulty === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className={`min-h-16 rounded-lg border px-2 py-2 text-left sm:px-3 ${on ? "border-accent bg-accent/15" : "border-line bg-bg/40"}`}
                      onClick={() => chooseDifficulty(d.id)}
                      aria-pressed={on}
                    >
                      <span className="font-display text-base sm:text-lg">{d.label}</span>
                      <p className="text-[11px] leading-tight text-muted sm:text-xs">{d.hint}</p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm">Управление на WASD.</p>
              <p className="text-sm text-muted">РПГ стреляет сама. На каждом уровне — один баф, до 20.</p>
              <ul className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                {ROSTER.map((id) => (
                  <li key={id} className="rounded-full border border-line px-2 py-1">
                    {ENEMIES[id].boss ? "Босс · " : ""}
                    {ENEMIES[id].name}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted">
                Рекорд {best ? formatTime(best.bestTime) : "—"} · убийства {best?.bestKills ?? 0} · уровень{" "}
                {best?.bestLevel ?? 0} · победы {best?.wins ?? 0}
              </p>
              <button
                type="button"
                className="mt-4 min-h-12 w-full rounded-lg bg-primary px-6 font-display text-lg text-bg"
                onClick={begin}
              >
                В бой
              </button>
            </section>
          </div>
        </div>
      ) : null}

      {mode === "levelup" && snap ? (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-bg/50 p-4 sm:items-center">
          <div className="w-full max-w-4xl">
            <h2 className="mb-3 text-center font-display text-2xl">Выбери баф</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {snap.choices.map((choice, index) => {
                const Icon = ICONS[choice.id];
                return (
                  <button
                    key={choice.id}
                    type="button"
                    className="min-h-28 rounded-lg border border-line bg-surface p-4 text-left"
                    onClick={() => gameRef.current?.pick(index)}
                  >
                    <span className="flex items-center gap-2 font-display text-lg">
                      <Icon className="size-5 text-accent" aria-hidden />
                      {choice.name}
                      <span className="text-sm text-muted">
                        {index + 1}
                      </span>
                    </span>
                    <p className="mt-2 text-sm text-muted">{choice.detail}</p>
                    <p className="mt-3 text-xs text-accent">
                      {choice.rank} / {choice.max}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {mode === "pause" ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/60 p-4">
          <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-6 text-center">
            <h2 className="font-display text-3xl">Пауза</h2>
            <button
              type="button"
              className="mt-4 min-h-12 w-full rounded-lg bg-primary font-display text-bg"
              onClick={() => gameRef.current?.togglePause()}
            >
              Дальше
            </button>
          </div>
        </div>
      ) : null}

      {mode === "dead" ? (
        <EndCard
          snap={snap}
          onAgain={() => {
            sfxRef.current?.unlock();
            if (gameRef.current) gameRef.current.difficulty = difficulty;
            gameRef.current?.start();
            setBest(loadSave());
          }}
          onMenu={() => {
            gameRef.current?.toMenu();
            setBest(loadSave());
          }}
        />
      ) : null}

      {mode === "win" ? (
        <WinCard
          onAgain={() => {
            sfxRef.current?.unlock();
            if (gameRef.current) gameRef.current.difficulty = difficulty;
            gameRef.current?.start();
            setBest(loadSave());
          }}
        />
      ) : null}
    </main>
  );
}

function WinCard({ onAgain }: { onAgain: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-bg/80 p-4">
      <section className="flex w-full max-w-md flex-col items-center py-6 text-center">
        <img
          src="/sprites/portrait.jpg"
          alt="Алиса: каштановые волосы, красная помада, чёрное худи"
          className="pixel-art max-h-[42vh] w-auto max-w-[min(100%,20rem)] rounded-lg border border-line object-cover shadow-[0_0_40px_rgba(226,61,61,0.35)]"
        />
        <h2 className="mt-5 font-display text-3xl leading-tight sm:text-4xl">Алиса – ты Солнышко!</h2>
        <button
          type="button"
          className="mt-6 min-h-14 w-full rounded-lg bg-primary px-4 font-display text-lg leading-snug text-bg"
          onClick={onAgain}
        >
          Еще раз постреляем из РПГ в джунглях?
        </button>
      </section>
    </div>
  );
}

function EndCard({
  snap,
  onAgain,
  onMenu,
}: {
  snap: HudSnap | null;
  onAgain: () => void;
  onMenu: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/70 p-4">
      <section className="w-full max-w-md rounded-lg border border-line bg-surface p-6 text-center">
        <p className="text-xs tracking-widest text-primary">КОНЕЦ СМЕНЫ</p>
        <h2 className="mt-2 font-display text-4xl">Алиса пала</h2>
        <p className="mt-2 text-muted">Джунгли забрали своё. РПГ можно поднять снова.</p>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-lg border border-line p-2">
            <dt className="text-muted">Время</dt>
            <dd className="font-display">{formatTime(snap?.time ?? 0)}</dd>
          </div>
          <div className="rounded-lg border border-line p-2">
            <dt className="text-muted">Убийства</dt>
            <dd className="font-display">{snap?.kills ?? 0}</dd>
          </div>
          <div className="rounded-lg border border-line p-2">
            <dt className="text-muted">Уровень</dt>
            <dd className="font-display">{snap?.level ?? 0}</dd>
          </div>
        </dl>
        <button type="button" className="mt-4 min-h-12 w-full rounded-lg bg-primary font-display text-bg" onClick={onAgain}>
          Ещё раз
        </button>
        <button type="button" className="mt-2 min-h-12 w-full rounded-lg border border-line font-display" onClick={onMenu}>
          В меню
        </button>
      </section>
    </div>
  );
}

function Stick({ onChange }: { onChange: (x: number, y: number) => void }) {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);

  function point(e: ReactPointerEvent<HTMLDivElement>) {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const max = r.width * 0.36;
    const len = Math.hypot(dx, dy) || 1;
    const cl = Math.min(len, max);
    const nx = dx / max;
    const ny = dy / max;
    const m = Math.hypot(nx, ny);
    const s = m > 1 ? 1 / m : 1;
    onChange(nx * s, ny * s);
    if (knob.current) {
      knob.current.style.transform = `translate(${(dx / len) * cl}px, ${(dy / len) * cl}px)`;
    }
  }

  function up() {
    onChange(0, 0);
    if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
  }

  return (
    <div
      ref={base}
      className="absolute bottom-4 left-4 z-20 size-32 touch-none rounded-full border border-line bg-surface/70 md:hidden"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        point(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) point(e);
      }}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <div
        ref={knob}
        className="absolute top-1/2 left-1/2 size-14 rounded-full bg-primary"
        style={{ marginLeft: -28, marginTop: -28 }}
      />
    </div>
  );
}
