import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as Play, d as Gauge, f as Footprints, h as Axe, i as Undo2, l as Pause, m as Bomb, n as VolumeX, o as Shield, p as Crosshair, r as Volume2, s as Rocket, t as Zap, u as Heart } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-7J_9aoiA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => reject(/* @__PURE__ */ new Error(`Не удалось загрузить спрайт ${src}`));
		img.src = src;
	});
}
async function loadArt() {
	const [alice, infantry, heavies, rocket, boom, fx, ground, palm, bush] = await Promise.all([
		loadImage("/sprites/alice.png"),
		loadImage("/sprites/infantry.png"),
		loadImage("/sprites/heavies.png"),
		loadImage("/sprites/rocket.png"),
		loadImage("/sprites/boom.png"),
		loadImage("/sprites/fx.png"),
		loadImage("/sprites/ground.png"),
		loadImage("/sprites/palm.png"),
		loadImage("/sprites/bush.png")
	]);
	return {
		alice,
		infantry,
		heavies,
		rocket,
		boom,
		fx,
		ground,
		palm,
		bush
	};
}
var Sfx = class {
	ctx = null;
	master = null;
	musicBus = null;
	sfxBus = null;
	muted = false;
	musicOn = false;
	voices = 0;
	step = 0;
	acc = 0;
	unlock() {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return;
		if (!this.ctx) {
			this.ctx = new AC();
			this.master = this.ctx.createGain();
			this.musicBus = this.ctx.createGain();
			this.sfxBus = this.ctx.createGain();
			this.musicBus.gain.value = .22;
			this.sfxBus.gain.value = .85;
			this.musicBus.connect(this.master);
			this.sfxBus.connect(this.master);
			this.master.connect(this.ctx.destination);
			this.master.gain.value = this.muted ? 0 : .9;
		}
		if (this.ctx.state === "suspended") this.ctx.resume();
	}
	resume() {
		if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
	}
	setMuted(muted) {
		this.muted = muted;
		if (!this.ctx || !this.master) return;
		this.master.gain.setTargetAtTime(muted ? 0 : .9, this.ctx.currentTime, .03);
	}
	tick(dt) {
		if (!this.musicOn || !this.ctx || this.muted || !this.musicBus) return;
		this.acc += dt;
		const stepDur = .32;
		while (this.acc >= stepDur) {
			this.acc -= stepDur;
			this.note(this.step);
			this.step += 1;
		}
	}
	note(step) {
		const scale = [
			146.83,
			174.61,
			196,
			220,
			261.63,
			293.66
		];
		const pattern = [
			0,
			2,
			4,
			3,
			2,
			4,
			5,
			3,
			1,
			2,
			3,
			2
		];
		const freq = scale[pattern[step % pattern.length] ?? 0] ?? 196;
		if (!this.ctx || !this.musicBus) return;
		const t = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = "triangle";
		osc.frequency.value = freq / (step % 8 === 0 ? 2 : 1);
		gain.gain.setValueAtTime(1e-4, t);
		gain.gain.exponentialRampToValueAtTime(step % 8 === 0 ? .09 : .045, t + .02);
		gain.gain.exponentialRampToValueAtTime(1e-4, t + .28);
		osc.connect(gain);
		gain.connect(this.musicBus);
		osc.start(t);
		osc.stop(t + .3);
	}
	rocket() {
		this.noise(.18, 180, 90, .2, "sawtooth");
	}
	boom() {
		this.noise(.32, 140, 40, .35, "square");
	}
	hit() {
		this.blip(520, .06, .08, "square");
	}
	hurt() {
		this.blip(90, .18, .2, "sawtooth");
	}
	gem() {
		this.blip(880, .07, .06, "triangle");
	}
	level() {
		this.blip(523, .1, .08, "triangle");
		window.setTimeout(() => this.blip(659, .12, .08, "triangle"), 90);
		window.setTimeout(() => this.blip(784, .16, .09, "triangle"), 180);
	}
	swing() {
		this.noise(.08, 400, 180, .12, "square");
	}
	die() {
		this.blip(70, .4, .25, "sawtooth");
	}
	win() {
		this.blip(392, .16, .1, "triangle");
		window.setTimeout(() => this.blip(523, .2, .1, "triangle"), 140);
		window.setTimeout(() => this.blip(659, .28, .12, "triangle"), 280);
	}
	blip(freq, dur, vol, type) {
		if (!this.ctx || !this.sfxBus || this.voices > 16) return;
		const t = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(freq * (.94 + Math.random() * .12), t);
		gain.gain.setValueAtTime(vol, t);
		gain.gain.exponentialRampToValueAtTime(1e-4, t + dur);
		osc.connect(gain);
		gain.connect(this.sfxBus);
		this.voices += 1;
		osc.onended = () => {
			this.voices = Math.max(0, this.voices - 1);
			osc.disconnect();
			gain.disconnect();
		};
		osc.start(t);
		osc.stop(t + dur + .02);
	}
	noise(dur, from, to, vol, type) {
		if (!this.ctx || !this.sfxBus || this.voices > 16) return;
		const t = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(from, t);
		osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
		gain.gain.setValueAtTime(vol, t);
		gain.gain.exponentialRampToValueAtTime(1e-4, t + dur);
		osc.connect(gain);
		gain.connect(this.sfxBus);
		this.voices += 1;
		osc.onended = () => {
			this.voices = Math.max(0, this.voices - 1);
			osc.disconnect();
			gain.disconnect();
		};
		osc.start(t);
		osc.stop(t + dur + .02);
	}
};
var DIFFICULTIES = [
	{
		id: "easy",
		label: "Легко",
		hint: "Враги почти не бьют",
		dmg: .1
	},
	{
		id: "normal",
		label: "Средне",
		hint: "Урон вдвое меньше",
		dmg: .5
	},
	{
		id: "hard",
		label: "Тяжело",
		hint: "Полный урон",
		dmg: 1
	}
];
function difficultyDamage(id) {
	return DIFFICULTIES.find((d) => d.id === id)?.dmg ?? 1;
}
var WORLD = 3800;
var ENEMIES = {
	machete: {
		name: "Мачете",
		hp: 22,
		speed: 124,
		radius: 16,
		touch: 12,
		xp: 3,
		score: 10,
		boss: false
	},
	pistol: {
		name: "Пистолет",
		hp: 18,
		speed: 76,
		radius: 15,
		touch: 8,
		xp: 3,
		score: 12,
		boss: false
	},
	shotgun: {
		name: "Дробовик",
		hp: 90,
		speed: 54,
		radius: 18,
		touch: 14,
		xp: 6,
		score: 22,
		boss: false
	},
	rifle: {
		name: "Автомат",
		hp: 34,
		speed: 88,
		radius: 16,
		touch: 10,
		xp: 4,
		score: 14,
		boss: false
	},
	sniper: {
		name: "Снайпер",
		hp: 20,
		speed: 62,
		radius: 15,
		touch: 6,
		xp: 6,
		score: 20,
		boss: false
	},
	jeep: {
		name: "Джип",
		hp: 160,
		speed: 150,
		radius: 28,
		touch: 18,
		xp: 14,
		score: 45,
		boss: false
	},
	apc: {
		name: "БТР",
		hp: 1700,
		speed: 66,
		radius: 42,
		touch: 26,
		xp: 70,
		score: 280,
		boss: true
	},
	tank: {
		name: "Танк",
		hp: 4800,
		speed: 44,
		radius: 52,
		touch: 34,
		xp: 140,
		score: 1200,
		boss: true
	}
};
/** Projectile count by salvo rank. Rank 5 fires six rockets. */
var SALVO = [
	1,
	2,
	3,
	4,
	5,
	6
];
function dropsEvery(rank) {
	return Math.max(.28, .84 - rank * .1);
}
var BUFFS = [
	{
		id: "salvo",
		name: "Залп",
		max: 5,
		detail: (next) => `Ракет в залпе: ${SALVO[next] ?? 6}`
	},
	{
		id: "firerate",
		name: "Скорострельность",
		max: 5,
		detail: (next) => `Темп стрельбы +${next * 20}%`
	},
	{
		id: "leech",
		name: "Вампиризм",
		max: 5,
		detail: (next) => `+${next} HP за убийство`
	},
	{
		id: "split",
		name: "Осколки",
		max: 3,
		detail: (next) => next <= 1 ? "Взрыв рассыпается на 3 гранаты" : `Гранаты осколков сильнее (${next})`
	},
	{
		id: "speed",
		name: "Скорость",
		max: 5,
		detail: (next) => `Бег +${next * 13}%`
	},
	{
		id: "drops",
		name: "Мины",
		max: 4,
		detail: (next) => `Граната под ноги каждые ${dropsEvery(next).toFixed(1)} с`
	},
	{
		id: "rico",
		name: "Рикошет",
		max: 3,
		detail: (next) => next === 1 ? "Ракета отскакивает 1 раз" : `Ракета отскакивает ${next} раза`
	},
	{
		id: "damage",
		name: "Боезаряд",
		max: 5,
		detail: (next) => `Урон ракет +${next * 25}%`
	},
	{
		id: "hp",
		name: "Живучесть",
		max: 5,
		detail: (next) => `Максимум здоровья +${next * 28}`
	},
	{
		id: "macheteBuff",
		name: "Мачете",
		max: 5,
		detail: (next) => `Удары вокруг: урон ${8 + next * 6}`
	}
];
function xpToNext(step) {
	return Math.round(12 * Math.pow(1.2, step - 1) + 8 * step);
}
function formatTime(sec) {
	const s = Math.max(0, Math.floor(sec));
	return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
var SAVE_KEY = "alice-jungle-v1";
function emptySave() {
	return {
		bestTime: 0,
		bestKills: 0,
		bestLevel: 0,
		wins: 0
	};
}
function loadSave() {
	if (typeof localStorage === "undefined") return emptySave();
	try {
		const raw = localStorage.getItem(SAVE_KEY);
		if (!raw) return emptySave();
		const p = JSON.parse(raw);
		return {
			bestTime: Number(p.bestTime) || 0,
			bestKills: Number(p.bestKills) || 0,
			bestLevel: Number(p.bestLevel) || 0,
			wins: Number(p.wins) || 0
		};
	} catch {
		return emptySave();
	}
}
function writeSave(data) {
	localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}
var KIND_DRAW = {
	machete: {
		sheet: "infantry",
		cell: 0,
		size: 64,
		spin: false
	},
	pistol: {
		sheet: "infantry",
		cell: 1,
		size: 62,
		spin: false
	},
	rifle: {
		sheet: "infantry",
		cell: 2,
		size: 66,
		spin: false
	},
	sniper: {
		sheet: "infantry",
		cell: 3,
		size: 66,
		spin: false
	},
	shotgun: {
		sheet: "heavies",
		cell: 0,
		size: 76,
		spin: false
	},
	jeep: {
		sheet: "heavies",
		cell: 1,
		size: 116,
		spin: true
	},
	apc: {
		sheet: "heavies",
		cell: 2,
		size: 150,
		spin: true
	},
	tank: {
		sheet: "heavies",
		cell: 3,
		size: 186,
		spin: true
	}
};
/** Sheet rows: 0 front, 1 back, 2 right profile, 3 left profile. */
function aliceRow(aim) {
	const a = Math.atan2(Math.sin(aim), Math.cos(aim));
	if (a >= -Math.PI / 4 && a < Math.PI / 4) return 2;
	if (a >= Math.PI / 4 && a < 3 * Math.PI / 4) return 0;
	if (a >= -3 * Math.PI / 4 && a < -Math.PI / 4) return 1;
	return 3;
}
function blit(ctx, img, cols, rows, index, x, y, size, rot = 0, flip = false) {
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
function drawWorld(ctx, game, w, h) {
	const art = game.art;
	ctx.imageSmoothingEnabled = false;
	ctx.fillStyle = "#07140d";
	ctx.fillRect(0, 0, w, h);
	const camX = Math.round(game.camX + game.shakeX);
	const camY = Math.round(game.camY + game.shakeY);
	const toX = (x) => Math.round(x - camX + w / 2);
	const toY = (y) => Math.round(y - camY + h / 2);
	const tile = 320;
	const x0 = Math.floor((camX - w / 2) / tile) * tile - tile;
	const y0 = Math.floor((camY - h / 2) / tile) * tile - tile;
	const x1 = camX + w / 2 + tile;
	const y1 = camY + h / 2 + tile;
	for (let y = y0; y < y1; y += tile) for (let x = x0; x < x1; x += tile) {
		if (x > 3800 || y > 3800 || x + tile < 0 || y + tile < 0) continue;
		ctx.drawImage(art.ground, toX(x), toY(y), 321, 321);
	}
	ctx.fillStyle = "rgba(7, 20, 13, 0.18)";
	ctx.fillRect(0, 0, w, h);
	for (const d of game.decals) {
		if (d.life <= 0) continue;
		ctx.fillStyle = `rgba(40, 24, 12, ${Math.max(0, d.life / d.max) * .45})`;
		ctx.beginPath();
		ctx.ellipse(toX(d.x), toY(d.y), d.r * .7, d.r * .4, 0, 0, Math.PI * 2);
		ctx.fill();
	}
	const items = [];
	for (const t of game.trees) {
		const sx = toX(t.x);
		const sy = toY(t.y);
		if (sx < -180 || sy < -220 || sx > w + 180 || sy > h + 80) continue;
		const img = t.kind === "palm" ? art.palm : art.bush;
		const dw = (t.kind === "palm" ? 150 : 54) * t.s;
		const dh = (t.kind === "palm" ? 210 : 48) * t.s;
		items.push({
			y: t.y,
			draw: () => {
				ctx.drawImage(img, Math.round(sx - dw / 2), Math.round(sy - dh * .82), dw, dh);
			}
		});
	}
	for (const g of game.gems) {
		if (!g.alive) continue;
		const sx = toX(g.x);
		const sy = toY(g.y + Math.sin(game.anim * 6 + g.x) * 2);
		if (sx < -20 || sy < -20 || sx > w + 20 || sy > h + 20) continue;
		items.push({
			y: g.y - 8,
			draw: () => blit(ctx, art.fx, 2, 2, 0, sx, sy, 22)
		});
	}
	for (const e of game.enemies) {
		if (!e.alive) continue;
		items.push({
			y: e.y,
			draw: () => drawEnemy(ctx, art, e, toX(e.x), toY(e.y))
		});
	}
	const frame = Math.hypot(game.player.vx, game.player.vy) > 12 ? Math.floor(game.anim * 8) % 4 : 0;
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
			if (game.player.iframes > 0) ctx.globalAlpha = .55 + Math.sin(game.anim * 28) * .25;
			blit(ctx, art.alice, 4, 4, row * 4 + frame, px, py - 8, 84);
			ctx.restore();
		}
	});
	items.sort((a, b) => a.y - b.y);
	for (const item of items) item.draw();
	if (game.player.swingFlash > 0 && game.ranks.macheteBuff > 0) {
		const n = 2 + Math.min(2, game.ranks.macheteBuff);
		const radius = 46 + game.ranks.macheteBuff * 6;
		for (let i = 0; i < n; i++) {
			const a = game.player.swingAng + i * Math.PI * 2 / n;
			blit(ctx, art.fx, 2, 2, 2, px + Math.cos(a) * radius, py + Math.sin(a) * radius, 54, a);
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
			if (!(b.kind === "mine" && b.fuse < .18 && Math.floor(game.anim * 16) % 2 === 0)) blit(ctx, art.fx, 2, 2, 1, sx, sy, b.kind === "mine" ? 28 : 22, ang);
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
			ctx.lineTo(sx - b.vx / sp * 12, sy - b.vy / sp * 12);
			ctx.stroke();
		}
	}
	for (const e of game.enemies) {
		if (!e.alive || e.windMax < .3 || e.tele <= 0) continue;
		ctx.strokeStyle = `rgba(226, 61, 61, ${.25 + (1 - e.tele / e.windMax) * .65})`;
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
		const s = 10 + game.aimTarget.r * .15;
		ctx.strokeRect(tx - s, ty - s, s * 2, s * 2);
	}
	const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .28, w / 2, h / 2, Math.max(w, h) * .72);
	vignette.addColorStop(0, "rgba(0,0,0,0)");
	vignette.addColorStop(1, "rgba(0,0,0,0.48)");
	ctx.fillStyle = vignette;
	ctx.fillRect(0, 0, w, h);
	if (game.player.hp > 0 && game.player.hp / game.player.maxHp < .3 && game.mode === "play") {
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
function drawEnemy(ctx, art, e, sx, sy) {
	const spec = KIND_DRAW[e.kind];
	const img = spec.sheet === "infantry" ? art.infantry : art.heavies;
	const size = spec.size * (e.elite ? 1.16 : 1);
	ctx.save();
	ctx.fillStyle = "rgba(0,0,0,0.32)";
	ctx.beginPath();
	ctx.ellipse(sx, sy + size * .28, size * .28, size * .1, 0, 0, Math.PI * 2);
	ctx.fill();
	if (e.flash > 0) ctx.filter = "brightness(2.6)";
	if (e.elite) {
		ctx.strokeStyle = "#e6b325";
		ctx.lineWidth = 2;
		ctx.strokeRect(sx - size * .42, sy - size * .48, size * .84, size * .9);
	}
	blit(ctx, img, 2, 2, spec.cell, sx, sy, size, spec.spin ? e.angle : 0, !spec.spin && e.faceLeft);
	ctx.restore();
	if (e.hp < e.maxHp || ENEMIES[e.kind].boss) {
		const bw = Math.max(28, size * .7);
		const bh = 5;
		const bx = sx - bw / 2;
		const by = sy - size * .55;
		ctx.fillStyle = "rgba(0,0,0,0.55)";
		ctx.fillRect(bx, by, bw, bh);
		ctx.fillStyle = ENEMIES[e.kind].boss ? "#e23d3d" : "#7dcea0";
		ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), bh);
	}
}
function drawParticle(ctx, art, p, toX, toY) {
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
var SHOTS = {
	pistol: {
		range: 340,
		cool: 1.35,
		wind: .1,
		burst: 1,
		gap: .1,
		speed: 250,
		dmg: 9,
		spread: .06,
		pellets: 1,
		ttl: 1.5,
		explode: 0,
		radius: 4,
		kind: "bolt"
	},
	rifle: {
		range: 400,
		cool: 1.5,
		wind: .06,
		burst: 3,
		gap: .1,
		speed: 340,
		dmg: 6,
		spread: .1,
		pellets: 1,
		ttl: 1.2,
		explode: 0,
		radius: 4,
		kind: "bolt"
	},
	shotgun: {
		range: 172,
		cool: 1.35,
		wind: .16,
		burst: 1,
		gap: .1,
		speed: 300,
		dmg: 5,
		spread: .5,
		pellets: 5,
		ttl: .4,
		explode: 0,
		radius: 4,
		kind: "pellet"
	},
	sniper: {
		range: 580,
		cool: 2.45,
		wind: .82,
		burst: 1,
		gap: .1,
		speed: 820,
		dmg: 22,
		spread: .01,
		pellets: 1,
		ttl: 1.05,
		explode: 0,
		radius: 3,
		kind: "bolt"
	},
	jeep: {
		range: 430,
		cool: 1.65,
		wind: .04,
		burst: 7,
		gap: .07,
		speed: 390,
		dmg: 4,
		spread: .16,
		pellets: 1,
		ttl: 1.05,
		explode: 0,
		radius: 4,
		kind: "bolt"
	},
	apc: {
		range: 540,
		cool: 1.9,
		wind: .48,
		burst: 1,
		gap: .1,
		speed: 200,
		dmg: 18,
		spread: .03,
		pellets: 1,
		ttl: 2.3,
		explode: 44,
		radius: 9,
		kind: "shell"
	},
	tank: {
		range: 680,
		cool: 1.4,
		wind: .55,
		burst: 1,
		gap: .1,
		speed: 160,
		dmg: 26,
		spread: .02,
		pellets: 1,
		ttl: 2.8,
		explode: 60,
		radius: 11,
		kind: "shell"
	}
};
var WAVES = [
	{
		kind: "machete",
		start: .4,
		every: 1.15,
		cap: 28
	},
	{
		kind: "pistol",
		start: 16,
		every: 2.05,
		cap: 16
	},
	{
		kind: "rifle",
		start: 36,
		every: 2.25,
		cap: 16
	},
	{
		kind: "shotgun",
		start: 62,
		every: 3.5,
		cap: 8
	},
	{
		kind: "sniper",
		start: 92,
		every: 4.3,
		cap: 5
	},
	{
		kind: "jeep",
		start: 125,
		every: 13,
		cap: 3
	}
];
function clamp(v, a, b) {
	return Math.max(a, Math.min(b, v));
}
function mulberry(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function makeBullet() {
	return {
		alive: false,
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		r: 6,
		dmg: 1,
		ttl: 1,
		friendly: true,
		kind: "rocket",
		bounces: 0,
		canSplit: false,
		explode: 40,
		fuse: -1,
		ignoreUid: 0
	};
}
var JungleGame = class {
	art;
	keys;
	sfx;
	mode = "menu";
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
	ranks = {
		salvo: 0,
		firerate: 0,
		leech: 0,
		split: 0,
		speed: 0,
		drops: 0,
		rico: 0,
		damage: 0,
		hp: 0,
		macheteBuff: 0
	};
	choices = [];
	best = emptySave();
	trees = [];
	enemies = [];
	bullets = [];
	gems = [];
	particles = [];
	decals = [];
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
		fireCd: .2,
		dropCd: .4,
		swingCd: .3,
		swingAng: 0,
		swingFlash: 0,
		flash: 0
	};
	joyX = 0;
	joyY = 0;
	difficulty = "normal";
	qaKeys = null;
	qaSteer = null;
	reduced = false;
	aimTarget = null;
	uid = 1;
	spawnAcc = {};
	spawnSerial = 0;
	apcSpawned = false;
	tankSpawned = false;
	victoryLock = false;
	winDelay = 0;
	saved = false;
	swingId = 1;
	seed = 1;
	rand = Math.random;
	dirty = true;
	probeToken = {};
	constructor(art, keys, sfx) {
		this.art = art;
		this.keys = keys;
		this.sfx = sfx;
		this.best = loadSave();
		this.reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
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
	touch() {
		this.dirty = true;
	}
	destroy() {
		if (window.__controlsTest?.token === this.probeToken) delete window.__controlsTest;
	}
	bindProbe() {
		const self = this;
		const probe = {
			token: this.probeToken,
			getYaw: () => self.player.aim,
			getSpeed: () => Math.hypot(self.player.vx, self.player.vy),
			getX: () => self.player.x,
			getY: () => self.player.y,
			setKeys: (codes) => {
				self.qaKeys = new Set(codes);
			},
			setSteer: (v) => {
				self.qaSteer = v;
			},
			grantXp: (n) => {
				if (self.mode !== "play") return;
				self.xp += n;
				self.tryLevel();
				self.touch();
			}
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
	pick(index) {
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
		this.banner = `УРОВЕНЬ ${Math.min(20, this.picks)}`;
		this.bannerT = 1.3;
		if (this.picks < 20 && this.xp >= xpToNext(this.picks + 1)) {
			this.xp -= xpToNext(this.picks + 1);
			this.openChoices();
		} else {
			this.mode = "play";
			this.choices = [];
		}
		this.touch();
	}
	update(dt) {
		this.trauma = Math.max(0, this.trauma - dt * 1.7);
		this.bannerT = Math.max(0, this.bannerT - dt);
		const mag = this.trauma * this.trauma * (this.reduced ? .15 : 1);
		this.shakeX = Math.sin(this.anim * 53) * 14 * mag;
		this.shakeY = Math.cos(this.anim * 41) * 11 * mag;
		if (this.mode === "menu") {
			this.player.x = WORLD / 2;
			this.player.y = WORLD / 2;
			this.player.vx = 0;
			this.player.vy = 0;
			this.player.aim = Math.PI / 2;
			this.updateCamera(dt);
			return;
		}
		if (this.mode === "play" || this.mode === "levelup" || this.mode === "pause") this.sfx.tick(dt);
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
		if (this.player.hp > 0 && this.player.hp < this.player.maxHp) this.player.hp = Math.min(this.player.maxHp, this.player.hp + dt);
		if (this.player.hp <= 0) {
			this.player.hp = 0;
			this.mode = "dead";
			this.sfx.musicOn = false;
			this.sfx.die();
			this.commit(false);
			this.touch();
		}
	}
	resetRun() {
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
			salvo: 0,
			firerate: 0,
			leech: 0,
			split: 0,
			speed: 0,
			drops: 0,
			rico: 0,
			damage: 0,
			hp: 0,
			macheteBuff: 0
		};
		this.choices = [];
		this.player.x = WORLD / 2;
		this.player.y = WORLD / 2;
		this.player.vx = 0;
		this.player.vy = 0;
		this.player.hp = 100;
		this.player.maxHp = 100;
		this.player.iframes = .4;
		this.player.fireCd = .35;
		this.player.aim = Math.PI / 2;
		this.camX = this.player.x;
		this.camY = this.player.y;
	}
	reseed() {
		this.seed = 1e3 + Math.floor(Math.random() * 9e4);
		this.rand = mulberry(this.seed);
	}
	clearActors() {
		for (const e of this.enemies) e.alive = false;
		for (const b of this.bullets) b.alive = false;
		for (const g of this.gems) g.alive = false;
		for (const p of this.particles) p.alive = false;
		this.decals.length = 0;
	}
	growForest() {
		const rng = mulberry(42);
		const tryPlace = (minDist) => {
			for (let n = 0; n < 12; n++) {
				const x = 80 + rng() * (WORLD - 160);
				const y = 80 + rng() * (WORLD - 160);
				if (Math.hypot(x - 1900, y - 1900) < 200) continue;
				let ok = true;
				for (const t of this.trees) if (Math.hypot(t.x - x, t.y - y) < minDist) {
					ok = false;
					break;
				}
				if (ok) return {
					x,
					y
				};
			}
			return null;
		};
		for (let i = 0; i < 70; i++) {
			const p = tryPlace(110);
			if (!p) continue;
			this.trees.push({
				...p,
				r: 18,
				kind: "palm",
				s: .82 + rng() * .45
			});
		}
		for (let i = 0; i < 100; i++) {
			const p = tryPlace(54);
			if (!p) continue;
			this.trees.push({
				...p,
				r: 0,
				kind: "bush",
				s: .65 + rng() * .7
			});
		}
	}
	axis() {
		if (this.qaKeys) {
			let x = 0;
			let y = 0;
			if (this.qaKeys.has("KeyA") || this.qaKeys.has("ArrowLeft")) x -= 1;
			if (this.qaKeys.has("KeyD") || this.qaKeys.has("ArrowRight")) x += 1;
			if (this.qaKeys.has("KeyW") || this.qaKeys.has("ArrowUp")) y -= 1;
			if (this.qaKeys.has("KeyS") || this.qaKeys.has("ArrowDown")) y += 1;
			const l = Math.hypot(x, y);
			if (l > 1) return {
				x: x / l,
				y: y / l
			};
			return {
				x,
				y
			};
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
		if (l > 1) return {
			x: x / l,
			y: y / l
		};
		return {
			x,
			y
		};
	}
	gamepad() {
		const pads = navigator.getGamepads?.();
		if (!pads) return {
			x: 0,
			y: 0
		};
		for (const gp of pads) {
			if (!gp) continue;
			const ax = gp.axes[0] ?? 0;
			const ay = gp.axes[1] ?? 0;
			const len = Math.hypot(ax, ay);
			if (len < .22) continue;
			const s = Math.min(1, (len - .22) / .78);
			return {
				x: ax / len * s,
				y: ay / len * s
			};
		}
		return {
			x: 0,
			y: 0
		};
	}
	movePlayer(dt) {
		const a = this.axis();
		const speed = 172 * (1 + this.ranks.speed * .13);
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
		else if (Math.hypot(this.player.vx, this.player.vy) > 8) this.player.aim = Math.atan2(this.player.vy, this.player.vx);
	}
	resolveTrees(body) {
		for (const t of this.trees) {
			if (t.r <= 0) continue;
			const dx = body.x - t.x;
			const dy = body.y - t.y;
			const min = body.r + t.r;
			const d2 = dx * dx + dy * dy;
			if (d2 >= min * min || d2 < .01) continue;
			const d = Math.sqrt(d2);
			const push = (min - d) / d;
			body.x += dx * push;
			body.y += dy * push;
		}
	}
	dmgMult() {
		return 1 + this.ranks.damage * .25;
	}
	firePlayer() {
		if (this.player.fireCd > 0) return;
		const target = this.aimTarget ?? this.nearest(this.player.x, this.player.y, 920, 0);
		if (!target) return;
		const n = SALVO[this.ranks.salvo] ?? 1;
		const base = Math.atan2(target.y - this.player.y, target.x - this.player.x);
		const spread = n <= 1 ? 0 : .14;
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
		this.player.fireCd = .88 / (1 + this.ranks.firerate * .2);
		this.sfx.rocket();
		this.trauma = Math.min(1, this.trauma + .08);
	}
	swingMachete(dt) {
		const rank = this.ranks.macheteBuff;
		if (rank <= 0) return;
		this.player.swingCd -= dt;
		if (this.player.swingCd > 0) return;
		this.player.swingCd = Math.max(.42, .74 - rank * .04);
		this.swingId += 1;
		this.player.swingAng = this.anim * 2.4;
		this.player.swingFlash = .16;
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
	dropMines(dt) {
		const rank = this.ranks.drops;
		if (rank <= 0) return;
		if (Math.hypot(this.player.vx, this.player.vy) < 20) return;
		this.player.dropCd -= dt;
		if (this.player.dropCd > 0) return;
		this.player.dropCd = Math.max(.28, .84 - rank * .1);
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
		b.fuse = .55;
		b.ignoreUid = 0;
	}
	acquireBullet(skip) {
		for (const b of this.bullets) if (!b.alive && b !== skip) {
			b.alive = true;
			return b;
		}
		if (this.bullets.length >= 420) return null;
		const b = makeBullet();
		b.alive = true;
		this.bullets.push(b);
		return b;
	}
	updateBullets(dt) {
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
			if (b.ttl <= 0 || b.x < -40 || b.y < -40 || b.x > 3840 || b.y > 3840) {
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
						this.damageEnemy(hit, b.dmg * .65, b.x, b.y);
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
	explode(b) {
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
				const falloff = 1 - d / (radius + e.r) * .4;
				this.damageEnemy(e, dmg * falloff, x, y);
			}
			if (canSplit) this.spawnFrags(x, y, dmg);
		} else if (Math.hypot(this.player.x - x, this.player.y - y) < radius + this.player.r) this.hurtPlayer(dmg, x, y);
		this.burst(x, y, radius);
		this.sfx.boom();
		this.trauma = Math.min(1, this.trauma + (radius > 50 ? .34 : .16));
		if (!this.reduced) this.hitstop = Math.max(this.hitstop, radius > 50 ? .045 : .02);
		if (this.decals.length > 36) this.decals.shift();
		this.decals.push({
			x,
			y,
			r: radius * .7,
			life: 6,
			max: 6
		});
	}
	spawnFrags(x, y, dmg) {
		const rank = this.ranks.split;
		const base = this.rand() * Math.PI * 2;
		for (let i = 0; i < 3; i++) {
			const b = this.acquireBullet();
			if (!b) return;
			const a = base + i * Math.PI * 2 / 3;
			const sp = 150;
			b.x = x;
			b.y = y;
			b.vx = Math.cos(a) * sp;
			b.vy = Math.sin(a) * sp;
			b.r = 6;
			b.dmg = dmg * (.42 + rank * .1);
			b.ttl = .7;
			b.friendly = true;
			b.kind = "frag";
			b.bounces = 0;
			b.canSplit = false;
			b.explode = 34 + rank * 3;
			b.fuse = .42;
			b.ignoreUid = 0;
		}
	}
	damageEnemy(e, dmg, sx, sy) {
		if (!e.alive) return;
		e.hp -= dmg;
		e.flash = .08;
		const d = Math.hypot(e.x - sx, e.y - sy) || 1;
		const knock = e.kind === "tank" || e.kind === "apc" ? 8 : 26;
		e.x += (e.x - sx) / d * knock;
		e.y += (e.y - sy) / d * knock;
		this.floatText(e.x, e.y - e.r, Math.round(dmg).toString(), "#e6b325");
		if (e.hp <= 0) this.killEnemy(e);
		else this.sfx.hit();
	}
	killEnemy(e) {
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
			this.particle(e.x, e.y, Math.cos(a) * sp, Math.sin(a) * sp, .45, 3 + this.rand() * 4, "dust", "", i % 2 ? "#6b4a2a" : "#c45a12");
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
			if (!this.reduced) this.hitstop = .1;
			this.touch();
		}
	}
	hurtPlayer(dmg, sx, sy) {
		if (this.player.iframes > 0 || this.mode !== "play" || this.victoryLock) return;
		const scaled = dmg * (1 + this.time / 500) * difficultyDamage(this.difficulty);
		this.player.hp -= scaled;
		this.player.iframes = .7;
		this.player.flash = .18;
		const d = Math.hypot(this.player.x - sx, this.player.y - sy) || 1;
		this.player.x += (this.player.x - sx) / d * 14;
		this.player.y += (this.player.y - sy) / d * 14;
		this.floatText(this.player.x, this.player.y - 30, `-${Math.round(scaled)}`, "#e23d3d");
		this.sfx.hurt();
		this.trauma = Math.min(1, this.trauma + .42);
		if (!this.reduced) this.hitstop = Math.max(this.hitstop, .04);
	}
	updateEnemies(dt) {
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
					speed *= .55;
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
					sepX += sdx / sd * (min - sd);
					sepY += sdy / sd * (min - sd);
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
				e.faceLeft = e.vx < 0;
			}
			this.enemyShoot(e, dist);
		}
	}
	enemyShoot(e, dist) {
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
	releaseShot(e, spec) {
		const base = Math.atan2(this.player.y - e.y, this.player.x - e.x);
		const pellets = spec.pellets;
		for (let i = 0; i < pellets; i++) {
			const span = pellets > 1 ? spec.spread : 0;
			const a = base + (i - (pellets - 1) / 2) * (span / Math.max(1, pellets - 1)) + (this.rand() - .5) * spec.spread * .2;
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
	touchDamage() {
		for (const e of this.enemies) {
			if (!e.alive || e.touchCd > 0) continue;
			if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.r + this.player.r) {
				e.touchCd = .55;
				this.hurtPlayer(ENEMIES[e.kind].touch * (e.elite ? 1.4 : 1), e.x, e.y);
			}
		}
	}
	nearest(x, y, maxDist, ignoreUid) {
		let best = null;
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
	director(dt) {
		const alive = this.enemies.reduce((n, e) => n + (e.alive && !ENEMIES[e.kind].boss ? 1 : 0), 0);
		const scale = 1 + this.time / 110;
		if (alive < 74) for (const w of WAVES) {
			if (this.time < w.start) continue;
			this.spawnAcc[w.kind] = (this.spawnAcc[w.kind] ?? 0) + dt;
			const every = Math.max(.36, w.every / scale);
			if ((this.spawnAcc[w.kind] ?? 0) < every) continue;
			this.spawnAcc[w.kind] = 0;
			if (this.countKind(w.kind) >= w.cap) continue;
			const elite = this.spawnSerial % 18 === 17;
			this.spawnSerial += 1;
			this.spawnEnemy(w.kind, elite);
		}
		if (!this.apcSpawned && this.time >= 200) {
			this.apcSpawned = true;
			this.spawnEnemy("apc", false);
			this.banner = "МИНИ-БОСС — БТР";
			this.bannerT = 2.6;
			this.touch();
		}
		const apcAlive = this.countKind("apc") > 0;
		if (!this.tankSpawned && (this.time >= 400 || this.time >= 320 && this.apcSpawned && !apcAlive)) {
			this.tankSpawned = true;
			this.spawnEnemy("tank", false);
			this.banner = "БОСС — ТАНК";
			this.bannerT = 2.8;
			this.touch();
		}
	}
	countKind(kind) {
		let n = 0;
		for (const e of this.enemies) if (e.alive && e.kind === kind) n += 1;
		return n;
	}
	spawnEnemy(kind, elite) {
		let slot = null;
		for (const e of this.enemies) if (!e.alive) {
			slot = e;
			break;
		}
		if (!slot) {
			if (this.enemies.length > 96 && !ENEMIES[kind].boss) return;
			slot = {
				alive: false,
				uid: 0,
				kind,
				x: 0,
				y: 0,
				vx: 0,
				vy: 0,
				r: 16,
				hp: 1,
				maxHp: 1,
				cool: 0,
				tele: 0,
				windMax: 0,
				burstLeft: 0,
				touchCd: 0,
				flash: 0,
				elite: false,
				angle: 0,
				faceLeft: false,
				lastSwing: 0
			};
			this.enemies.push(slot);
		}
		const ang = this.rand() * Math.PI * 2;
		const dist = Math.hypot(this.viewW, this.viewH) * .55 + 50;
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
		slot.cool = .4 + this.rand() * .6;
		slot.tele = 0;
		slot.windMax = 0;
		slot.burstLeft = 0;
		slot.touchCd = .3;
		slot.flash = 0;
		slot.elite = elite;
		slot.angle = ang + Math.PI;
		slot.faceLeft = false;
		slot.lastSwing = 0;
	}
	spawnGem(x, y, value) {
		let g = null;
		for (const gem of this.gems) if (!gem.alive) {
			g = gem;
			break;
		}
		if (!g) {
			if (this.gems.length > 180) {
				this.xp += value;
				this.tryLevel();
				return;
			}
			g = {
				alive: false,
				x: 0,
				y: 0,
				vx: 0,
				vy: 0,
				value: 0
			};
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
	updateGems(dt) {
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
				g.vx += dx / d * pull * dt * 6;
				g.vy += dy / d * pull * dt * 6;
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
	tryLevel() {
		if (this.mode !== "play" || this.victoryLock) return;
		if (this.picks >= 20) return;
		if (this.xp < xpToNext(this.picks + 1)) return;
		this.xp -= xpToNext(this.picks + 1);
		this.openChoices();
	}
	openChoices() {
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
			max: b.max
		}));
		if (this.choices.length === 0) {
			this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
			this.mode = "play";
		} else this.mode = "levelup";
		this.touch();
	}
	particle(x, y, vx, vy, life, size, kind, text, color) {
		let p = null;
		for (const item of this.particles) if (!item.alive) {
			p = item;
			break;
		}
		if (!p) {
			if (this.particles.length > 320) return;
			p = {
				alive: false,
				x: 0,
				y: 0,
				vx: 0,
				vy: 0,
				life: 0,
				max: 1,
				size: 2,
				kind: "dust",
				text: "",
				color: "#fff"
			};
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
	floatText(x, y, text, color) {
		let texts = 0;
		for (const p of this.particles) if (p.alive && p.kind === "text") texts += 1;
		if (texts > 28) return;
		this.particle(x, y, (this.rand() - .5) * 16, -40, .7, 13, "text", text, color);
	}
	burst(x, y, radius) {
		this.particle(x, y, 0, 0, .38, radius * 1.3, "boom", "", "#fff");
		const n = radius > 48 ? 14 : 8;
		for (let i = 0; i < n; i++) {
			const a = i / n * Math.PI * 2;
			const sp = 40 + this.rand() * 90;
			this.particle(x, y, Math.cos(a) * sp, Math.sin(a) * sp, .35, 2 + this.rand() * 3, "spark", "", i % 2 ? "#e6b325" : "#e23d3d");
		}
	}
	updateParticles(dt) {
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
	updateCamera(dt) {
		const sp = Math.hypot(this.player.vx, this.player.vy);
		const look = sp > 8 ? 26 : 0;
		const tx = this.player.x + (sp > 8 ? this.player.vx / sp * look : 0);
		const ty = this.player.y + (sp > 8 ? this.player.vy / sp * look : 0);
		const k = 1 - Math.exp(-5.5 * dt);
		this.camX += (tx - this.camX) * k;
		this.camY += (ty - this.camY) * k;
		const hw = this.viewW / 2;
		const hh = this.viewH / 2;
		if (3800 > this.viewW) this.camX = clamp(this.camX, hw, WORLD - hw);
		else this.camX = WORLD / 2;
		if (3800 > this.viewH) this.camY = clamp(this.camY, hh, WORLD - hh);
		else this.camY = WORLD / 2;
	}
	commit(win) {
		if (this.saved) return;
		this.saved = true;
		const prev = loadSave();
		const next = {
			bestTime: Math.max(prev.bestTime, this.time),
			bestKills: Math.max(prev.bestKills, this.kills),
			bestLevel: Math.max(prev.bestLevel, this.picks),
			wins: prev.wins + (win ? 1 : 0)
		};
		writeSave(next);
		this.best = next;
	}
	snapshot() {
		let boss = null;
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
			rank: this.ranks[b.id]
		}));
		return {
			mode: this.mode,
			hp: this.player.hp,
			maxHp: this.player.maxHp,
			xp: this.xp,
			xpNeed: xpToNext(Math.min(20, this.picks + 1)),
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
			best: this.best
		};
	}
};
var ICONS = {
	salvo: Rocket,
	firerate: Gauge,
	leech: Heart,
	split: Bomb,
	speed: Footprints,
	drops: Crosshair,
	rico: Undo2,
	damage: Zap,
	hp: Shield,
	macheteBuff: Axe
};
var ROSTER = [
	"machete",
	"pistol",
	"rifle",
	"shotgun",
	"sniper",
	"jeep",
	"apc",
	"tank"
];
function Survivor() {
	const canvasRef = (0, import_react.useRef)(null);
	const gameRef = (0, import_react.useRef)(null);
	const keysRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const joyRef = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	const sfxRef = (0, import_react.useRef)(null);
	if (!sfxRef.current) sfxRef.current = new Sfx();
	const [ready, setReady] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [snap, setSnap] = (0, import_react.useState)(null);
	const [best, setBest] = (0, import_react.useState)(null);
	const [muted, setMuted] = (0, import_react.useState)(false);
	const [difficulty, setDifficulty] = (0, import_react.useState)("normal");
	(0, import_react.useEffect)(() => {
		setBest(loadSave());
		try {
			const saved = localStorage.getItem("sunny-jungle-diff");
			if (saved === "easy" || saved === "normal" || saved === "hard") setDifficulty(saved);
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const sfx = sfxRef.current;
		if (!canvas || !sfx) return;
		const keys = keysRef.current;
		let stop = false;
		let raf = 0;
		let game = null;
		let acc = 0;
		let last = performance.now();
		let lastUi = 0;
		const onDown = (e) => {
			if ([
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight",
				"Space"
			].includes(e.code)) e.preventDefault();
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
		const onUp = (e) => keys.delete(e.code);
		const onBlur = () => keys.clear();
		const onVis = () => sfx.resume();
		window.addEventListener("keydown", onDown);
		window.addEventListener("keyup", onUp);
		window.addEventListener("blur", onBlur);
		document.addEventListener("visibilitychange", onVis);
		(async () => {
			try {
				const art = await loadArt();
				if (stop) return;
				game = new JungleGame(art, keys, sfx);
				gameRef.current = game;
				setReady(true);
				setSnap(game.snapshot());
				const loop = (now) => {
					if (stop || !game) return;
					const dt = Math.min(.05, (now - last) / 1e3);
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
						joyRef.current = {
							x: 0,
							y: 0
						};
						game.joyX = 0;
						game.joyY = 0;
					}
					if (game.hitstop > 0 && game.mode === "play") game.hitstop -= dt;
					else {
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
	const hpPct = snap ? Math.max(0, Math.min(100, snap.hp / snap.maxHp * 100)) : 100;
	const xpPct = snap && snap.level < 20 ? Math.max(0, Math.min(100, snap.xp / snap.xpNeed * 100)) : 100;
	(0, import_react.useEffect)(() => {
		if (gameRef.current) gameRef.current.difficulty = difficulty;
	}, [difficulty, ready]);
	function chooseDifficulty(next) {
		setDifficulty(next);
		if (gameRef.current) gameRef.current.difficulty = next;
		try {
			localStorage.setItem("sunny-jungle-diff", next);
		} catch {}
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "absolute inset-0 h-full w-full touch-none"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-0 z-20 flex flex-col p-3 sm:p-4",
				children: [
					snap && mode !== "menu" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "w-full max-w-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-1 flex items-center justify-between text-xs text-muted",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-display text-fg",
										children: [
											"Ур. ",
											Math.min(20, snap.level),
											"/",
											20
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										Math.ceil(snap.hp),
										" / ",
										Math.ceil(snap.maxHp)
									] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-3 overflow-hidden rounded-full bg-line",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `h-full bg-primary ${hpPct < 30 ? "animate-pulse" : ""}`,
										style: { width: `${hpPct}%` }
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 h-2 overflow-hidden rounded-full bg-line",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-full bg-accent",
										style: { width: `${xpPct}%` }
									})
								}),
								snap.buffs.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-2 flex flex-wrap gap-1",
									children: snap.buffs.map((b) => {
										const Icon = ICONS[b.id];
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-center gap-1 rounded-full border border-line bg-surface/80 px-2 py-1 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
													className: "size-3 text-accent",
													"aria-hidden": true
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: b.name }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-accent",
													children: b.rank
												})
											]
										}, b.id);
									})
								}) : null
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-end gap-2 text-right",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-display text-2xl tabular-nums",
									children: formatTime(snap.time)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted",
									children: snap.objective
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-sm",
									children: ["Убийства ", snap.kills]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pointer-events-auto flex gap-2",
									children: [mode === "play" || mode === "pause" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "flex size-11 items-center justify-center rounded-full border border-line bg-surface text-fg",
										onClick: () => gameRef.current?.togglePause(),
										"aria-label": mode === "pause" ? "Продолжить" : "Пауза",
										children: mode === "pause" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" })
									}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "flex size-11 items-center justify-center rounded-full border border-line bg-surface text-fg",
										onClick: toggleMute,
										"aria-label": muted ? "Включить звук" : "Выключить звук",
										children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" })
									})]
								})
							]
						})]
					}) : null,
					snap && snap.bossName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto mt-3 w-full max-w-sm text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-1 font-display text-sm text-primary",
							children: snap.bossName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-2 overflow-hidden rounded-full bg-line",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full bg-primary",
								style: { width: `${Math.max(0, snap.bossHp / snap.bossMax * 100)}%` }
							})
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "sr-only",
						"aria-live": "polite",
						children: snap?.banner ?? ""
					})
				]
			}),
			mode === "play" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stick, { onChange: (x, y) => {
				joyRef.current = {
					x,
					y
				};
			} }) : null,
			!ready && !error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-40 flex items-center justify-center bg-bg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xl",
					children: "Собираем джунгли…"
				})
			}) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-40 flex items-center justify-center bg-bg p-6 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: error })
			}) : null,
			ready && mode === "menu" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 z-30 overflow-y-auto bg-bg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/sprites/splash.jpg",
					alt: "Алиса в ночных джунглях с ракетницей на плече",
					className: "mx-auto block max-h-[62vh] w-full object-contain object-top"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative z-10 mx-auto -mt-8 w-full max-w-3xl px-3 pb-6 sm:px-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-lg border border-line bg-surface/95 p-4 shadow-2xl md:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs tracking-widest text-accent",
								children: "КАМБОДЖА · НОЧЬ · РПГ"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-1 font-display text-4xl leading-none sm:text-5xl",
								children: "Sunny, Jungle Angel"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 max-w-xl text-muted",
								children: "Солнышко, сделал тебе симулятор Камбоджи с РПГ и врагами. Тебя ждет один уровень в джунглях, много видов врагов и три уровня сложности."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4 grid grid-cols-3 gap-2",
								children: DIFFICULTIES.map((d) => {
									const on = difficulty === d.id;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: `min-h-16 rounded-lg border px-2 py-2 text-left sm:px-3 ${on ? "border-accent bg-accent/15" : "border-line bg-bg/40"}`,
										onClick: () => chooseDifficulty(d.id),
										"aria-pressed": on,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-display text-base sm:text-lg",
											children: d.label
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] leading-tight text-muted sm:text-xs",
											children: d.hint
										})]
									}, d.id);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm",
								children: "Управление на WASD."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "РПГ стреляет сама. На каждом уровне — один баф, до 20."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 flex flex-wrap gap-2 text-xs text-muted",
								children: ROSTER.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "rounded-full border border-line px-2 py-1",
									children: [ENEMIES[id].boss ? "Босс · " : "", ENEMIES[id].name]
								}, id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-sm text-muted",
								children: [
									"Рекорд ",
									best ? formatTime(best.bestTime) : "—",
									" · убийства ",
									best?.bestKills ?? 0,
									" · уровень",
									" ",
									best?.bestLevel ?? 0,
									" · победы ",
									best?.wins ?? 0
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "mt-4 min-h-12 w-full rounded-lg bg-primary px-6 font-display text-lg text-bg",
								onClick: begin,
								children: "В бой"
							})
						]
					})
				})]
			}) : null,
			mode === "levelup" && snap ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-30 flex items-end justify-center bg-bg/50 p-4 sm:items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-4xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-3 text-center font-display text-2xl",
						children: "Выбери баф"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-3 sm:grid-cols-3",
						children: snap.choices.map((choice, index) => {
							const Icon = ICONS[choice.id];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "min-h-28 rounded-lg border border-line bg-surface p-4 text-left",
								onClick: () => gameRef.current?.pick(index),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-2 font-display text-lg",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
												className: "size-5 text-accent",
												"aria-hidden": true
											}),
											choice.name,
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm text-muted",
												children: index + 1
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm text-muted",
										children: choice.detail
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-3 text-xs text-accent",
										children: [
											choice.rank,
											" / ",
											choice.max
										]
									})
								]
							}, choice.id);
						})
					})]
				})
			}) : null,
			mode === "pause" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-30 flex items-center justify-center bg-bg/60 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm rounded-lg border border-line bg-surface p-6 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-3xl",
						children: "Пауза"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-4 min-h-12 w-full rounded-lg bg-primary font-display text-bg",
						onClick: () => gameRef.current?.togglePause(),
						children: "Дальше"
					})]
				})
			}) : null,
			mode === "dead" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EndCard, {
				snap,
				onAgain: () => {
					sfxRef.current?.unlock();
					if (gameRef.current) gameRef.current.difficulty = difficulty;
					gameRef.current?.start();
					setBest(loadSave());
				},
				onMenu: () => {
					gameRef.current?.toMenu();
					setBest(loadSave());
				}
			}) : null,
			mode === "win" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WinCard, { onAgain: () => {
				sfxRef.current?.unlock();
				if (gameRef.current) gameRef.current.difficulty = difficulty;
				gameRef.current?.start();
				setBest(loadSave());
			} }) : null
		]
	});
}
function WinCard({ onAgain }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-bg/80 p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "flex w-full max-w-md flex-col items-center py-6 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/sprites/portrait.jpg",
					alt: "Алиса: каштановые волосы, красная помада, чёрное худи",
					className: "pixel-art max-h-[42vh] w-auto max-w-[min(100%,20rem)] rounded-lg border border-line object-cover shadow-[0_0_40px_rgba(226,61,61,0.35)]"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-5 font-display text-3xl leading-tight sm:text-4xl",
					children: "Алиса – ты Солнышко!"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-6 min-h-14 w-full rounded-lg bg-primary px-4 font-display text-lg leading-snug text-bg",
					onClick: onAgain,
					children: "Еще раз постреляем из РПГ в джунглях?"
				})
			]
		})
	});
}
function EndCard({ snap, onAgain, onMenu }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-30 flex items-center justify-center bg-bg/70 p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "w-full max-w-md rounded-lg border border-line bg-surface p-6 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-widest text-primary",
					children: "КОНЕЦ СМЕНЫ"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 font-display text-4xl",
					children: "Алиса пала"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-muted",
					children: "Джунгли забрали своё. РПГ можно поднять снова."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "mt-4 grid grid-cols-3 gap-2 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-line p-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted",
								children: "Время"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-display",
								children: formatTime(snap?.time ?? 0)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-line p-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted",
								children: "Убийства"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-display",
								children: snap?.kills ?? 0
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-line p-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted",
								children: "Уровень"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-display",
								children: snap?.level ?? 0
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-4 min-h-12 w-full rounded-lg bg-primary font-display text-bg",
					onClick: onAgain,
					children: "Ещё раз"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-2 min-h-12 w-full rounded-lg border border-line font-display",
					onClick: onMenu,
					children: "В меню"
				})
			]
		})
	});
}
function Stick({ onChange }) {
	const base = (0, import_react.useRef)(null);
	const knob = (0, import_react.useRef)(null);
	function point(e) {
		const el = base.current;
		if (!el) return;
		const r = el.getBoundingClientRect();
		const dx = e.clientX - (r.left + r.width / 2);
		const dy = e.clientY - (r.top + r.height / 2);
		const max = r.width * .36;
		const len = Math.hypot(dx, dy) || 1;
		const cl = Math.min(len, max);
		const nx = dx / max;
		const ny = dy / max;
		const m = Math.hypot(nx, ny);
		const s = m > 1 ? 1 / m : 1;
		onChange(nx * s, ny * s);
		if (knob.current) knob.current.style.transform = `translate(${dx / len * cl}px, ${dy / len * cl}px)`;
	}
	function up() {
		onChange(0, 0);
		if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: base,
		className: "absolute bottom-4 left-4 z-20 size-32 touch-none rounded-full border border-line bg-surface/70 md:hidden",
		onPointerDown: (e) => {
			e.currentTarget.setPointerCapture(e.pointerId);
			point(e);
		},
		onPointerMove: (e) => {
			if (e.currentTarget.hasPointerCapture(e.pointerId)) point(e);
		},
		onPointerUp: up,
		onPointerCancel: up,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: knob,
			className: "absolute top-1/2 left-1/2 size-14 rounded-full bg-primary",
			style: {
				marginLeft: -28,
				marginTop: -28
			}
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Survivor, {});
}
//#endregion
export { Home as component };
