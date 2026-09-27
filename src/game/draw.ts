import type { Art } from "@/game/assets";
import { ENEMIES, WORLD, type EnemyKind } from "@/game/balance";
import type { Enemy, JungleGame, Particle } from "@/game/sim";

const KIND_DRAW: Record<EnemyKind, { sheet: "infantry" | "heavies"; cell: number; size: number; spin: boolean }> = {
  machete: { sheet: "infantry", cell: 0, size: 64, spin: false },
  pistol: { sheet: "infantry", cell: 1, size: 62, spin: false },
  rifle: { sheet: "infantry", cell: 2, size: 66, spin: false },
  sniper: { sheet: "infantry", cell: 3, size: 66, spin: false },
  shotgun: { sheet: "heavies", cell: 0, size: 76, spin: false },
  jeep: { sheet: "heavies", cell: 1, size: 116, spin: false },
  apc: { sheet: "heavies", cell: 2, size: 150, spin: false },
  tank: { sheet: "heavies", cell: 3, size: 186, spin: false },
};

/** Sheet rows: 0 front, 1 back, 2 right profile, 3 left profile. */
function aliceRow(aim: number) {
  const a = Math.atan2(Math.sin(aim), Math.cos(aim));
  if (a >= -Math.PI / 4 && a < Math.PI / 4) return 2;
  if (a >= Math.PI / 4 && a < (3 * Math.PI) / 4) return 0;
  if (a >= (-3 * Math.PI) / 4 && a < -Math.PI / 4) return 1;
  return 3;
}

function blit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cols: number,
  rows: number,
  index: number,
  x: number,
  y: number,
  size: number,
  rot = 0,
  flip = false,
) {
  const col = index % cols;
  const row = Math.floor(index / cols);
  const sw = img.width / cols;
  const sh = img.height / rows;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (rot) ctx.rotate(rot);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, col * sw, row * sh, sw, sh, -size / 2, -size / 2, size, size);
  ctx.restore();
}

export function drawWorld(ctx: CanvasRenderingContext2D, game: JungleGame, w: number, h: number) {
  const art = game.art;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#07140d";
  ctx.fillRect(0, 0, w, h);

  const camX = Math.round(game.camX);
  const camY = Math.round(game.camY);
  const toX = (x: number) => Math.round(x - camX + w / 2);
  const toY = (y: number) => Math.round(y - camY + h / 2);

  const tile = 320;
  const x0 = Math.floor((camX - w / 2) / tile) * tile - tile;
  const y0 = Math.floor((camY - h / 2) / tile) * tile - tile;
  const x1 = camX + w / 2 + tile;
  const y1 = camY + h / 2 + tile;
  for (let y = y0; y < y1; y += tile) {
    for (let x = x0; x < x1; x += tile) {
      if (x > WORLD || y > WORLD || x + tile < 0 || y + tile < 0) continue;
      ctx.drawImage(art.ground, toX(x), toY(y), tile + 1, tile + 1);
    }
  }

  ctx.fillStyle = "rgba(7, 20, 13, 0.18)";
  ctx.fillRect(0, 0, w, h);

  for (const d of game.decals) {
    if (d.life <= 0) continue;
    const alpha = Math.max(0, d.life / d.max) * 0.45;
    ctx.fillStyle = `rgba(40, 24, 12, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(toX(d.x), toY(d.y), d.r * 0.7, d.r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  type Item = { y: number; draw: () => void };
  const items: Item[] = [];

  for (const t of game.trees) {
    const sx = toX(t.x);
    const sy = toY(t.y);
    if (sx < -180 || sy < -220 || sx > w + 180 || sy > h + 80) continue;
    const img = t.kind === "palm" ? art.palm : art.bush;
    const base = t.kind === "palm" ? 150 : 54;
    const dw = base * t.s;
    const dh = (t.kind === "palm" ? 210 : 48) * t.s;
    items.push({
      y: t.y,
      draw: () => {
        ctx.drawImage(img, Math.round(sx - dw / 2), Math.round(sy - dh * 0.82), dw, dh);
      },
    });
  }

  for (const g of game.gems) {
    if (!g.alive) continue;
    const sx = toX(g.x);
    const sy = toY(g.y + Math.sin(game.anim * 6 + g.x) * 2);
    if (sx < -20 || sy < -20 || sx > w + 20 || sy > h + 20) continue;
    items.push({
      y: g.y - 8,
      draw: () => blit(ctx, art.fx, 2, 2, 0, sx, sy, 22),
    });
  }

  for (const e of game.enemies) {
    if (!e.alive) continue;
    items.push({ y: e.y, draw: () => drawEnemy(ctx, art, e, toX(e.x), toY(e.y)) });
  }

  const moving = Math.hypot(game.player.vx, game.player.vy) > 12;
  const frame = moving ? Math.floor(game.anim * 8) % 4 : 0;
  const row = aliceRow(game.player.aim);
  const px = toX(game.player.x);
  const py = toY(game.player.y);
  items.push({
    y: game.player.y,
    draw: () => {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(px, py + 8, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      if (game.player.flash > 0) ctx.filter = "brightness(2.4)";
      if (game.player.iframes > 0) ctx.globalAlpha = 0.55 + Math.sin(game.anim * 28) * 0.25;
      blit(ctx, art.alice, 4, 4, row * 4 + frame, px, py - 8, 84);
      ctx.restore();
    },
  });

  items.sort((a, b) => a.y - b.y);
  for (const item of items) item.draw();

  if (game.player.swingFlash > 0 && game.ranks.macheteBuff > 0) {
    const n = 2 + Math.min(2, game.ranks.macheteBuff);
    const radius = 46 + game.ranks.macheteBuff * 6;
    for (let i = 0; i < n; i++) {
      const a = game.player.swingAng + (i * Math.PI * 2) / n;
      blit(
        ctx,
        art.fx,
        2,
        2,
        2,
        px + Math.cos(a) * radius,
        py + Math.sin(a) * radius,
        54,
        a,
      );
    }
  }

  for (const b of game.bullets) {
    if (!b.alive) continue;
    const sx = toX(b.x);
    const sy = toY(b.y);
    if (sx < -40 || sy < -40 || sx > w + 40 || sy > h + 40) continue;
    if (b.kind === "rocket") {
      const frameR = Math.floor(game.anim * 12) % 4;
      const ang = Math.atan2(b.vy, b.vx);
      blit(ctx, art.rocket, 2, 2, frameR, sx, sy, 46, ang);
    } else if (b.kind === "frag" || b.kind === "mine") {
      const ang = b.kind === "mine" ? 0 : game.anim * 8;
      const blink = b.kind === "mine" && b.fuse < 0.18 && Math.floor(game.anim * 16) % 2 === 0;
      if (!blink) blit(ctx, art.fx, 2, 2, 1, sx, sy, b.kind === "mine" ? 28 : 22, ang);
    } else if (b.kind === "shell") {
      ctx.fillStyle = "#2a1a10";
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e6b325";
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = b.kind === "pellet" ? "#e6b325" : "#e23d3d";
      ctx.lineWidth = b.kind === "pellet" ? 3 : 2;
      ctx.beginPath();
      const sp = Math.hypot(b.vx, b.vy) || 1;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - (b.vx / sp) * 12, sy - (b.vy / sp) * 12);
      ctx.stroke();
    }
  }

  for (const e of game.enemies) {
    if (!e.alive || e.windMax < 0.3 || e.tele <= 0) continue;
    const alpha = 1 - e.tele / e.windMax;
    ctx.strokeStyle = `rgba(226, 61, 61, ${0.25 + alpha * 0.65})`;
    ctx.lineWidth = e.kind === "sniper" ? 2 : 3;
    ctx.beginPath();
    ctx.moveTo(toX(e.x), toY(e.y));
    ctx.lineTo(toX(game.player.x), toY(game.player.y));
    ctx.stroke();
  }

  for (const p of game.particles) drawParticle(ctx, art, p, toX, toY);

  if (game.aimTarget && game.mode === "play") {
    const tx = toX(game.aimTarget.x);
    const ty = toY(game.aimTarget.y);
    ctx.strokeStyle = "rgba(244, 234, 216, 0.8)";
    ctx.lineWidth = 2;
    const s = 10 + game.aimTarget.r * 0.15;
    ctx.strokeRect(tx - s, ty - s, s * 2, s * 2);
  }

  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.max(w, h) * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.48)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  if (game.player.hp > 0 && game.player.hp / game.player.maxHp < 0.3 && game.mode === "play") {
    ctx.fillStyle = "rgba(226, 61, 61, 0.16)";
    ctx.fillRect(0, 0, w, h);
  }

  if (game.bannerT > 0 && game.banner) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, game.bannerT);
    ctx.fillStyle = "rgba(7, 20, 13, 0.72)";
    ctx.fillRect(w / 2 - 220, 72, 440, 48);
    ctx.fillStyle = "#f4ead8";
    ctx.font = "20px Russo One, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(game.banner, w / 2, 104);
    ctx.restore();
  }
}

function drawEnemy(
  ctx: CanvasRenderingContext2D,
  art: Art,
  e: Enemy,
  sx: number,
  sy: number,
) {
  const spec = KIND_DRAW[e.kind];
  const img = spec.sheet === "infantry" ? art.infantry : art.heavies;
  const size = spec.size * (e.elite ? 1.16 : 1);
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.ellipse(sx, sy + size * 0.28, size * 0.28, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  if (e.flash > 0) ctx.filter = "brightness(2.6)";
  if (e.elite) {
    ctx.strokeStyle = "#e6b325";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - size * 0.42, sy - size * 0.48, size * 0.84, size * 0.9);
  }
  blit(ctx, img, 2, 2, spec.cell, sx, sy, size, spec.spin ? e.angle : 0, !spec.spin && e.faceLeft);
  ctx.restore();

  if (e.hp < e.maxHp || ENEMIES[e.kind].boss) {
    const bw = Math.max(28, size * 0.7);
    const bh = 5;
    const bx = sx - bw / 2;
    const by = sy - size * 0.55;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = ENEMIES[e.kind].boss ? "#e23d3d" : "#7dcea0";
    ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), bh);
  }
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  art: Art,
  p: Particle,
  toX: (x: number) => number,
  toY: (y: number) => number,
) {
  if (!p.alive) return;
  const sx = toX(p.x);
  const sy = toY(p.y);
  const alpha = Math.max(0, p.life / p.max);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (p.kind === "boom") {
    const frame = Math.min(3, Math.floor((1 - alpha) * 4));
    blit(ctx, art.boom, 2, 2, frame, sx, sy, p.size);
  } else if (p.kind === "text") {
    ctx.fillStyle = p.color;
    ctx.font = "700 13px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.text, sx, sy);
  } else {
    ctx.fillStyle = p.color;
    ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
  }
  ctx.restore();
}
