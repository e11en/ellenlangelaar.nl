import { stations, START_X, WORLD_WIDTH, type StationId } from "./content";
import { SpaceRun, type GemKind } from "./space";
import { buildArt, C, disc, makeSprite, rect, type Art, type Sprite } from "./sprites";

// The world is drawn at a low "virtual" resolution and scaled up by an integer factor,
// so every virtual pixel becomes a crisp block on screen.

const WALK_SPEED = 80;
const RUN_SPEED = 170;
const GRAVITY = 520;
const JUMP_VELOCITY = 175;
const INTERACT_RANGE = 40;
const STATION_SINK = 3;

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number };
type Placed = { x: number; sprite: Sprite; sink: number };
type Star = { x: number; y: number; phase: number; color: string; big: boolean };

export type EngineEvents = {
  onOpen: (id: StationId) => void;
  onCrash: (score: number, best: number, isNewBest: boolean, gems: Record<GemKind, number>) => void;
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)] / 16;

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export class Engine {
  private ctx: CanvasRenderingContext2D;
  private art: Art;
  private raf = 0;
  private last = 0;
  private time = 0;

  scale = 4;
  W = 320;
  H = 180;
  baseY = 130;
  private radius = 600;

  private player = { x: START_X, vx: 0, h: 0, vh: 0, facing: 1 as 1 | -1, anim: 0, dust: 0 };
  private target: number | null = null;
  private pending: StationId | null = null;
  camX = 0;
  private keys = new Set<string>();
  paused = false;
  hovered: StationId | null = null;
  near: StationId | null = null;

  private rocket = { phase: "idle" as "idle" | "board" | "ignite" | "ascend" | "land", t: 0, y: 0 };
  // Planet walking, or the asteroid mini game after a launch.
  mode: "planet" | "space" = "planet";
  space: SpaceRun | null = null;
  // The astronaut is inside the rocket.
  aboard = false;
  private particles: Particle[] = [];
  // Time since the last teleport; drives the beam effect.
  private beam = Infinity;
  private shooting: { x: number; y: number; t: number } | null = null;

  private sky!: HTMLCanvasElement;
  private nebula!: HTMLCanvasElement;
  private stars: Star[][] = [];
  private planets!: { big: Sprite; moon: Sprite };
  private surface: Placed[] = [];
  private mid: Placed[] = [];
  private far: Placed[] = [];
  private craters: { x: number; w: number; d: number }[] = [];

  // DOM elements that live "in" the world (labels, title) and are moved every frame.
  private anchors = new Map<string, { el: HTMLElement; x: () => number; lift: () => number }>();

  constructor(private canvas: HTMLCanvasElement, private events: EngineEvents) {
    this.ctx = canvas.getContext("2d")!;
    this.art = buildArt();
    this.placeDecor();
    this.resize();
    this.camX = this.cameraGoal();
  }

  // ------------------------------------------------------------ lifecycle

  start() {
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
      this.last = now;
      this.step(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  step(dt: number) {
    this.update(dt);
    this.render();
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    this.scale = Math.max(2, Math.min(8, Math.round(Math.min(vw / 320, vh / 180))));
    this.W = Math.ceil(vw / this.scale);
    this.H = Math.ceil(vh / this.scale);
    this.baseY = Math.round(this.H * 0.74);
    this.radius = Math.max(260, this.W * 1.6);
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.canvas.style.width = `${this.W * this.scale}px`;
    this.canvas.style.height = `${this.H * this.scale}px`;
    this.ctx.imageSmoothingEnabled = false;
    this.buildSky();
  }

  // Keeps a DOM element glued to a world position; x and lift are in virtual pixels.
  anchor(key: string, el: HTMLElement | null, x: number | (() => number), lift: number | (() => number)) {
    const fn = (v: number | (() => number)) => (typeof v === "number" ? () => v : v);
    if (el) this.anchors.set(key, { el, x: fn(x), lift: fn(lift) });
    else this.anchors.delete(key);
  }

  // ------------------------------------------------------------ input

  // Walking input is ignored while the astronaut is in the rocket or in space.
  private get locked() {
    return this.paused || this.aboard;
  }

  keyDown(code: string) {
    if (this.paused) return;
    this.keys.add(code);
    if (this.locked) return;
    if (code === "Space" || code === "ArrowUp" || code === "KeyW") this.jump();
    if ((code === "KeyE" || code === "Enter") && this.near) this.open(this.near);
  }

  keyUp(code: string) {
    this.keys.delete(code);
  }

  wheel(delta: number) {
    if (this.locked) return;
    const from = this.target ?? this.player.x;
    this.target = this.clampX(from + delta * 0.45);
    this.pending = null;
  }

  // Drag on touch screens works like scrolling a page: pull the world towards you.
  drag(fromTarget: number, dxPixels: number) {
    if (this.locked) return;
    this.target = this.clampX(fromTarget - (dxPixels / this.scale) * 1.6);
    this.pending = null;
  }

  currentTarget() {
    return this.target ?? this.player.x;
  }

  pointerMove(px: number, py: number) {
    if (this.mode === "space") {
      this.space?.steerTo(px / this.scale);
      return;
    }
    this.hovered = this.locked ? null : this.hitTest(px / this.scale, py / this.scale);
    this.canvas.style.cursor = this.hovered ? "pointer" : "default";
  }

  click(px: number, py: number) {
    if (this.mode === "space") {
      this.space?.steerTo(px / this.scale);
      return;
    }
    if (this.locked) return;
    const vx = px / this.scale;
    const hit = this.hitTest(vx, py / this.scale);
    if (hit) this.goTo(hit);
    else {
      this.target = this.clampX(vx + this.camX);
      this.pending = null;
    }
  }

  goTo(id: StationId) {
    const s = stations.find((st) => st.id === id)!;
    if (Math.abs(this.player.x - s.x) < INTERACT_RANGE) {
      this.target = null;
      this.player.facing = s.x >= this.player.x ? 1 : -1;
      this.open(id);
      return;
    }
    this.target = s.x;
    this.pending = id;
  }

  // Instantly moves the astronaut to a station, with a transporter beam.
  teleport(id: StationId) {
    if (this.locked) return;
    const s = stations.find((st) => st.id === id)!;
    this.player.x = s.x;
    this.player.h = 0;
    this.player.vh = 0;
    this.target = null;
    this.pending = null;
    this.camX = this.cameraGoal();
    this.beam = 0;
  }

  jump() {
    if (!this.locked && this.player.h === 0) this.player.vh = JUMP_VELOCITY;
  }

  private open(id: StationId) {
    this.pending = null;
    if (id === "rocket") {
      if (this.rocket.phase === "idle") {
        this.rocket = { phase: "board", t: 0, y: 0 };
        this.target = this.rocketX();
      }
      return;
    }
    this.keys.clear();
    this.events.onOpen(id);
  }

  // ------------------------------------------------------------ space

  restartSpace() {
    this.space = new SpaceRun(this.W, this.H, this.nebula, this.events.onCrash);
  }

  returnToPlanet() {
    if (this.mode !== "space") return;
    this.mode = "planet";
    this.space = null;
    this.keys.clear();
    this.player.x = this.rocketX() - 18;
    this.player.facing = 1;
    this.camX = this.cameraGoal();
    this.rocket = { phase: "land", t: 0, y: -(this.H + 120) };
  }

  // ------------------------------------------------------------ world helpers

  // The rocket sits right of the gantry; this is its centre line in world x.
  private rocketX() {
    return stations.find((s) => s.id === "rocket")!.x + 10;
  }

  private clampX(x: number) {
    return Math.max(24, Math.min(WORLD_WIDTH - 24, x));
  }

  private surfaceY(sx: number) {
    const d = sx - this.W / 2;
    return this.baseY + (d * d) / (2 * this.radius);
  }

  private cameraGoal() {
    if (this.W >= WORLD_WIDTH) return (WORLD_WIDTH - this.W) / 2;
    return Math.max(0, Math.min(WORLD_WIDTH - this.W, this.player.x - this.W / 2));
  }

  private stationRect(id: StationId) {
    const s = stations.find((st) => st.id === id)!;
    const body = this.art.stations[id].body;
    const sx = s.x - this.camX;
    const bottom = Math.round(this.surfaceY(sx)) + STATION_SINK;
    const left = Math.round(sx - body.w / 2);
    return { left, top: bottom - body.h, w: body.w, h: body.h, bottom };
  }

  private hitTest(vx: number, vy: number): StationId | null {
    for (const s of stations) {
      const r = this.stationRect(s.id);
      if (vx >= r.left - 2 && vx <= r.left + r.w + 2 && vy >= r.top - 2 && vy <= r.bottom) return s.id;
    }
    return null;
  }

  // ------------------------------------------------------------ generation

  private placeDecor() {
    const rnd = mulberry32(7);
    const { crystals, rocks, plants, mushrooms, spires } = this.art.decor;
    const blocked = (x: number) =>
      stations.some((s) => Math.abs(s.x - x) < this.art.stations[s.id].body.w / 2 + 14) || Math.abs(x - (START_X - 46)) < 30;

    for (let x = 10; x < WORLD_WIDTH; x += 14 + rnd() * 40) {
      if (blocked(x)) continue;
      const r = rnd();
      const pool = r < 0.35 ? rocks : r < 0.65 ? plants : crystals;
      this.surface.push({ x, sprite: pool[Math.floor(rnd() * pool.length)], sink: 1 + Math.floor(rnd() * 2) });
    }
    for (let x = 0; x < WORLD_WIDTH * 0.6 + 900; x += 50 + rnd() * 110) {
      this.mid.push({ x, sprite: mushrooms[Math.floor(rnd() * mushrooms.length)], sink: 6 + Math.floor(rnd() * 6) });
    }
    for (let x = 0; x < WORLD_WIDTH * 0.3 + 900; x += 12 + rnd() * 34) {
      this.far.push({ x, sprite: spires[Math.floor(rnd() * spires.length)], sink: 14 + Math.floor(rnd() * 8) });
    }
    for (let x = 30; x < WORLD_WIDTH; x += 60 + rnd() * 120) {
      this.craters.push({ x, w: 8 + Math.floor(rnd() * 14), d: 6 + Math.floor(rnd() * 18) });
    }
    this.planets = { big: this.ringedPlanet(), moon: this.moon() };
  }

  private buildSky() {
    const { W, H } = this;
    const bands = ["#06031a", "#0b0624", "#12092f", "#1a0c3c", "#241049", "#301456", "#3e1a62", "#52216c"].map(hexToRgb);
    this.sky = makeSprite(W, H, (g) => {
      const img = g.createImageData(W, H);
      for (let y = 0; y < H; y++) {
        const t = Math.min(0.999, (y / (this.baseY + 10)) * (bands.length - 1));
        const i = Math.floor(t);
        for (let x = 0; x < W; x++) {
          const c = bands[Math.min(bands.length - 1, t - i > bayer(x, y) ? i + 1 : i)];
          const o = (y * W + x) * 4;
          img.data[o] = c[0];
          img.data[o + 1] = c[1];
          img.data[o + 2] = c[2];
          img.data[o + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
    }).canvas;

    const nw = W + Math.ceil(WORLD_WIDTH * 0.08) + 40;
    const rnd = mulberry32(3);
    const colors = ["#3a1a6e", "#5a2382", "#23307a", "#6b2a7c"].map(hexToRgb);
    this.nebula = makeSprite(nw, H, (g) => {
      const img = g.createImageData(nw, H);
      for (let b = 0; b < Math.ceil(nw / 45); b++) {
        const cx = rnd() * nw;
        const cy = rnd() * this.baseY * 0.85;
        const r = 20 + rnd() * 45;
        const c = colors[Math.floor(rnd() * colors.length)];
        for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(H, cy + r); y++) {
          for (let x = Math.max(0, Math.floor(cx - r * 1.8)); x < Math.min(nw, cx + r * 1.8); x++) {
            const d = Math.hypot((x - cx) / 1.8, y - cy) / r;
            if (d < 1 && (1 - d) * 0.9 > bayer(x, y)) {
              const o = (y * nw + x) * 4;
              img.data[o] = c[0];
              img.data[o + 1] = c[1];
              img.data[o + 2] = c[2];
              img.data[o + 3] = 110;
            }
          }
        }
      }
      g.putImageData(img, 0, 0);
    }).canvas;

    const starColors = [C.white, C.cyan, "#ffd6e0", "#cfc4ff"];
    this.stars = [0.02, 0.06, 0.12].map((p, layer) => {
      const lw = W + WORLD_WIDTH * p + 20;
      const count = Math.floor((lw * this.baseY) / (layer === 0 ? 180 : 420));
      return Array.from({ length: count }, () => ({
        x: rnd() * lw,
        y: rnd() * (this.baseY - 4),
        phase: rnd() * Math.PI * 2,
        color: starColors[Math.floor(rnd() * starColors.length)],
        big: layer === 2 && rnd() < 0.25,
      }));
    });
  }

  private ringedPlanet(): Sprite {
    return makeSprite(60, 34, (g) => {
      const cx = 30, cy = 17, r = 13;
      for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
          if (x * x + y * y > r * r + r * 0.8) continue;
          const light = (-x - y) / (r * 1.6) + 0.35;
          const band = Math.sin((y + x * 0.2) * 0.7) > 0.4;
          const col = light > bayer(x + 50, y + 50) ? (band ? "#6fd6ef" : "#4aa3d8") : band ? "#2f62a8" : "#27418a";
          rect(g, col, cx + x, cy + y);
        }
      }
      for (let a = 0; a < Math.PI * 2; a += 0.01) {
        const x = Math.round(cx + Math.cos(a) * 27);
        const y = Math.round(cy + Math.sin(a) * 6 - Math.cos(a) * 3);
        if (Math.sin(a) < 0 && Math.hypot(x - cx, y - cy) < r) continue;
        rect(g, Math.sin(a) > 0 ? C.pink : C.pinkLo, x, y);
      }
    });
  }

  private moon(): Sprite {
    return makeSprite(14, 14, (g) => {
      disc(g, "#8d86b8", 7, 7, 6);
      disc(g, "#c9c3ea", 6, 6, 5);
      rect(g, "#8d86b8", 4, 5, 2, 2);
      rect(g, "#8d86b8", 8, 8, 2, 1);
    });
  }

  // ------------------------------------------------------------ update

  private update(dt: number) {
    this.time += dt;
    const p = this.player;
    const left = this.keys.has("ArrowLeft") || this.keys.has("KeyA");
    const right = this.keys.has("ArrowRight") || this.keys.has("KeyD");

    if (this.mode === "space") {
      this.space!.update(dt, left, right);
      return;
    }

    if (!this.locked && (left || right) && left !== right) {
      this.target = null;
      this.pending = null;
      p.vx = (right ? 1 : -1) * (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") ? RUN_SPEED : WALK_SPEED * 1.3);
    } else if (this.target !== null) {
      const d = this.target - p.x;
      const speed = Math.abs(d) > 140 ? RUN_SPEED : WALK_SPEED;
      const step = Math.sign(d) * Math.min(Math.abs(d), speed * dt);
      p.vx = step / Math.max(dt, 1e-4);
      if (Math.abs(d) < 0.5) {
        p.x = this.target;
        p.vx = 0;
        this.target = null;
        if (this.pending) {
          const s = stations.find((st) => st.id === this.pending)!;
          p.facing = s.x >= p.x ? 1 : -1;
          this.open(this.pending);
        }
      }
    } else {
      p.vx = 0;
    }

    p.x = this.clampX(p.x + p.vx * dt);
    if (Math.abs(p.vx) > 1) p.facing = p.vx > 0 ? 1 : -1;
    p.anim += dt * (Math.abs(p.vx) / 9);

    if (p.h > 0 || p.vh > 0) {
      p.vh -= GRAVITY * dt;
      p.h += p.vh * dt;
      if (p.h <= 0) {
        p.h = 0;
        p.vh = 0;
        this.puff(p.x, 4);
      }
    }

    p.dust -= dt;
    if (Math.abs(p.vx) > 100 && p.h === 0 && p.dust <= 0) {
      p.dust = 0.12;
      this.puff(p.x - p.facing * 4, 1);
    }

    const k = 1 - Math.exp(-dt * 5);
    this.camX += (this.cameraGoal() - this.camX) * k;

    let best: StationId | null = null;
    let bestD = INTERACT_RANGE;
    for (const s of stations) {
      const d = Math.abs(s.x - p.x);
      if (d < bestD) { best = s.id; bestD = d; }
    }
    this.near = best;

    this.beam += dt;
    this.updateRocket(dt);
    this.updateParticles(dt);

    if (!this.shooting && Math.random() < dt * 0.12) {
      this.shooting = { x: Math.random() * this.W, y: Math.random() * this.baseY * 0.4, t: 0 };
    }
    if (this.shooting) {
      this.shooting.t += dt;
      if (this.shooting.t > 0.9) this.shooting = null;
    }
  }

  private updateRocket(dt: number) {
    const r = this.rocket;
    if (r.phase === "idle") return;
    r.t += dt;
    const rx = this.rocketX();
    const exhaust = () => {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: rx + (Math.random() - 0.5) * 6,
          y: -r.y,
          vx: (Math.random() - 0.5) * 30,
          vy: -(20 + Math.random() * 30),
          life: 0,
          max: 0.5 + Math.random() * 0.5,
          color: Math.random() < 0.5 ? C.glow : Math.random() < 0.5 ? C.glowLo : C.red,
          size: 1 + Math.floor(Math.random() * 2),
        });
      }
    };
    if (r.phase === "board") {
      // walking over; pressing left/right or scrolling away cancels the boarding
      if (this.target !== rx && Math.abs(this.player.x - rx) > 1) {
        r.phase = "idle";
        return;
      }
      if (Math.abs(this.player.x - rx) <= 1 && this.target === null) {
        this.aboard = true;
        this.keys.clear();
        for (let i = 0; i < 8; i++) this.particles.push({ x: rx + (Math.random() - 0.5) * 10, y: 6 + Math.random() * 14, vx: (Math.random() - 0.5) * 20, vy: 10 + Math.random() * 20, life: 0, max: 0.5, color: C.cyan, size: 1 });
        r.phase = "ignite";
        r.t = 0;
      }
    } else if (r.phase === "ignite") {
      exhaust();
      if (r.t > 1.4) { r.phase = "ascend"; r.t = 0; }
    } else if (r.phase === "ascend") {
      r.y = -(r.t * r.t) * 70;
      exhaust();
      if (r.y < -this.H - 120) {
        this.mode = "space";
        this.restartSpace();
      }
    } else if (r.phase === "land") {
      const dur = 3;
      const k = Math.min(1, r.t / dur);
      r.y = -(1 - k) * (1 - k) * (this.H + 120);
      exhaust();
      if (k >= 1) {
        r.phase = "idle";
        r.y = 0;
        this.aboard = false;
        this.beam = 0.3;
        for (let i = 0; i < 6; i++) this.puff(rx + (i - 3) * 4, 2);
      }
    }
  }

  private puff(x: number, n: number) {
    for (let i = 0; i < n; i++) {
      this.particles.push({ x, y: 0, vx: (Math.random() - 0.5) * 24, vy: 10 + Math.random() * 14, life: 0, max: 0.45, color: "#8f82c9", size: 1 });
    }
  }

  private updateParticles(dt: number) {
    for (const q of this.particles) {
      q.life += dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy -= 40 * dt;
      if (q.y < 0) {
        // exhaust hitting the pad spreads out sideways
        q.y = 0;
        q.vy = 0;
        q.vx *= 1.04;
      }
    }
    this.particles = this.particles.filter((q) => q.life < q.max);
  }

  // ------------------------------------------------------------ render

  private render() {
    if (this.mode === "space") {
      this.space!.render(this.ctx);
      return;
    }
    const g = this.ctx;
    const { W, camX } = this;
    const t = this.time;

    g.drawImage(this.sky, 0, 0);
    g.drawImage(this.nebula, -Math.round(camX * 0.08), 0);

    // stars
    [0.02, 0.06, 0.12].forEach((p, layer) => {
      const off = camX * p;
      for (const s of this.stars[layer] ?? []) {
        const x = Math.round(s.x - off);
        if (x < -2 || x > W + 2) continue;
        const tw = Math.sin(t * (1.5 + layer) + s.phase);
        if (tw < -0.6 && layer > 0) continue;
        g.fillStyle = s.color;
        g.globalAlpha = layer === 0 ? 0.55 : 1;
        g.fillRect(x, Math.round(s.y), 1, 1);
        if (s.big && tw > 0.3) {
          g.fillRect(x - 1, Math.round(s.y), 3, 1);
          g.fillRect(x, Math.round(s.y) - 1, 1, 3);
        }
      }
    });
    g.globalAlpha = 1;

    // distant planets
    g.drawImage(this.planets.big.canvas, Math.round(W * 0.72 - camX * 0.03), Math.round(this.baseY * 0.12));
    g.drawImage(this.planets.moon.canvas, Math.round(W * 0.18 - camX * 0.05 + 40), Math.round(this.baseY * 0.34));

    if (this.shooting) {
      const s = this.shooting;
      for (let i = 0; i < 10; i++) {
        g.globalAlpha = (1 - i / 10) * (1 - s.t / 0.9);
        rect(g, C.white, s.x + s.t * 160 - i * 2, s.y + s.t * 60 - i * 0.75);
      }
      g.globalAlpha = 1;
    }

    this.drawLayer(this.far, 0.3);
    this.drawLayer(this.mid, 0.6);
    this.drawPlanet();

    for (const d of this.surface) this.drawOnSurface(d.sprite, d.x, d.sink);
    this.drawOnSurface(this.art.lander, START_X - 46, 1);

    for (const s of stations) this.drawStation(s.id, s.x);

    this.drawParticles(true);
    this.drawPlayer();
    this.drawParticles(false);

    this.placeAnchors();
  }

  private drawLayer(items: Placed[], p: number) {
    const off = this.camX * p;
    for (const it of items) {
      const sx = it.x - off;
      if (sx + it.sprite.w < -10 || sx - it.sprite.w > this.W + 10) continue;
      const base = this.surfaceY(sx) + it.sink;
      this.ctx.drawImage(it.sprite.canvas, Math.round(sx - it.sprite.w / 2), Math.round(base - it.sprite.h));
    }
  }

  private drawOnSurface(sprite: Sprite, x: number, sink: number) {
    const sx = x - this.camX;
    if (sx + sprite.w < -10 || sx - sprite.w > this.W + 10) return;
    const base = Math.round(this.surfaceY(sx)) + sink;
    this.ctx.drawImage(sprite.canvas, Math.round(sx - sprite.w / 2), base - sprite.h);
  }

  private drawPlanet() {
    const g = this.ctx;
    const { W, H, camX } = this;
    for (let sx = 0; sx < W; sx++) {
      const y0 = Math.round(this.surfaceY(sx));
      const wx = Math.floor(sx + camX);
      // haze just above the horizon
      g.globalAlpha = 0.18;
      rect(g, C.cyan, sx, y0 - 2, 1, 2);
      g.globalAlpha = 1;
      rect(g, "#9ef0ff", sx, y0, 1, 1);
      rect(g, "#8f7bea", sx, y0 + 1, 1, 2);
      rect(g, "#6a55c9", sx, y0 + 3, 1, 7);
      rect(g, "#4e3aa6", sx, y0 + 10, 1, 12);
      rect(g, "#372683", sx, y0 + 22, 1, H - y0 - 22);
      // dithered seams between the bands
      if ((wx & 1) === 0) {
        rect(g, "#6a55c9", sx, y0 + 2);
        rect(g, "#4e3aa6", sx, y0 + 9);
        rect(g, "#372683", sx, y0 + 21);
      } else {
        rect(g, "#6a55c9", sx, y0 + 11);
        rect(g, "#4e3aa6", sx, y0 + 23);
      }
      // speckles
      const hsh = hash(wx);
      if (hsh < 0.18) rect(g, hsh < 0.06 ? "#8f7bea" : "#2c1f6e", sx, y0 + 4 + Math.floor(hash(wx + 99) * (H - y0 - 4)));
    }
    for (const c of this.craters) {
      const sx = c.x - camX;
      if (sx + c.w < 0 || sx - c.w > W) continue;
      const cy = Math.round(this.surfaceY(sx)) + c.d;
      const rx = c.w / 2;
      const ry = Math.max(2, Math.round(c.w / 5));
      for (let dy = -ry; dy <= ry; dy++) {
        const dx = Math.round(rx * Math.sqrt(1 - (dy * dy) / (ry * ry)));
        rect(g, dy < 0 ? "#2c1f6e" : "#3c2c8e", Math.round(sx - dx), cy + dy, dx * 2 + 1, 1);
      }
      rect(g, "#8f7bea", Math.round(sx - rx / 2), cy + ry + 1, Math.round(rx), 1);
    }
  }

  private drawStation(id: StationId, x: number) {
    const g = this.ctx;
    const art = this.art.stations[id];
    const r = this.stationRect(id);
    if (r.left + r.w + 60 < 0 || r.left - 60 > this.W) return;
    const t = this.time;
    const hover = this.hovered === id || (this.near === id && id !== "rocket");

    for (const e of art.extras ?? []) this.drawOnSurface(e.sprite, x + e.dx, 2);
    if (hover) g.drawImage(art.hover.canvas, r.left - 1, r.top - 1);
    g.drawImage(art.body.canvas, r.left, r.top);

    const blink = Math.sin(t * 4) > 0;
    if (id === "about") {
      rect(g, blink ? C.pink : C.pinkLo, r.left + 29, r.top, 3, 2);
    } else if (id === "skills") {
      for (let i = 0; i < 4; i++) {
        const y = r.top + 48 - ((t * 14 + i * 7) % 26);
        rect(g, C.white, r.left + 22 + ((i * 3) % 7), Math.round(y), 1, 1);
      }
      if (Math.sin(t * 2) > 0.6) rect(g, C.white, r.left + 27, r.top + 8, 1, 1);
    } else if (id === "blog") {
      const fx = r.left + 38;
      const fy = r.top + 11;
      for (let k = 0; k < 3; k++) {
        const rr = ((t * 14 + k * 8) % 24) + 4;
        g.globalAlpha = 1 - rr / 28;
        for (let a = -1.45; a <= 0.1; a += 0.9 / rr) {
          rect(g, C.cyan, Math.round(fx + Math.cos(a) * rr), Math.round(fy + Math.sin(a) * rr));
        }
      }
      g.globalAlpha = 1;
    } else if (id === "contact") {
      rect(g, blink ? C.red : "#7a2330", r.left + 15, r.top - 1, 4, 2);
      const rr = (t * 12) % 18;
      g.globalAlpha = 1 - rr / 18;
      for (let a = 0; a < Math.PI * 2; a += 1 / Math.max(rr, 1)) {
        rect(g, C.red, Math.round(r.left + 16 + Math.cos(a) * rr), Math.round(r.top + Math.sin(a) * rr * 0.6));
      }
      g.globalAlpha = 1;
    } else if (id === "rocket") {
      const rk = this.art.rocket;
      const shake = this.rocket.phase === "ignite" ? Math.round(Math.sin(t * 60)) : 0;
      const rx = r.left + 26 + shake;
      const ry = Math.round(r.top + 84 - 66 + this.rocket.y);
      const rocketHover = this.hovered === "rocket" || this.near === "rocket";
      if (rocketHover && this.rocket.phase === "idle") g.drawImage(this.art.rocketHover.canvas, rx - 1, ry - 1);
      g.drawImage(rk.canvas, rx, ry);
      if (this.rocket.phase !== "idle" && this.rocket.phase !== "board") {
        const len = 6 + Math.round(Math.random() * 6);
        rect(g, C.glowLo, rx + 10, ry + 66, 9, len);
        rect(g, C.glow, rx + 12, ry + 66, 5, len - 2);
        rect(g, C.white, rx + 13, ry + 66, 3, 3);
      }
    }
  }

  private drawParticles(behind: boolean) {
    const g = this.ctx;
    for (const q of this.particles) {
      const isRocket = q.color !== "#8f82c9";
      if (isRocket !== behind) continue;
      const sx = q.x - this.camX;
      const ground = isRocket ? this.stationRect("rocket").top + 84 : this.surfaceY(sx);
      g.globalAlpha = 1 - q.life / q.max;
      rect(g, q.color, Math.round(sx), Math.round(ground - q.y), q.size, q.size);
    }
    g.globalAlpha = 1;
  }

  private drawPlayer() {
    if (this.aboard) return;
    const p = this.player;
    const sx = p.x - this.camX;
    let frame: "stand" | "stride" | "pass" | "jump" = "stand";
    let bob = 0;
    if (p.h > 0) frame = "jump";
    else if (Math.abs(p.vx) > 1) {
      const f = Math.floor(p.anim) % 4;
      frame = f % 2 === 0 ? "stride" : "pass";
      bob = f % 2 === 0 ? 0 : -1;
    } else {
      bob = Math.sin(this.time * 2) > 0.7 ? -1 : 0;
    }
    const sprite = this.art.astro[frame][p.facing > 0 ? "right" : "left"];
    const feet = Math.round(this.surfaceY(sx)) + 1;
    // shadow
    this.ctx.globalAlpha = 0.35;
    rect(this.ctx, C.outline, Math.round(sx - 4 + p.h / 8), feet - 1, Math.max(2, 8 - Math.round(p.h / 6)), 1);
    this.ctx.globalAlpha = 1;
    const materializing = this.beam < 0.6 && this.rocket.phase === "idle";
    if (materializing) {
      const k = this.beam / 0.6;
      const g = this.ctx;
      g.globalAlpha = 0.5 * (1 - k);
      rect(g, C.cyan, Math.round(sx - 7), 0, 14, feet);
      g.globalAlpha = 0.9 * (1 - k);
      rect(g, C.white, Math.round(sx - 2), 0, 4, feet);
      g.globalAlpha = 1;
      for (let i = 0; i < 6; i++) {
        rect(g, C.cyan, Math.round(sx - 8 + hash(i + Math.floor(this.time * 20)) * 16), Math.round(feet - hash(i * 7 + Math.floor(this.time * 20)) * 24));
      }
    }
    // flicker in while the beam is fading
    if (!materializing || Math.floor(this.beam * 30) % 2 === 0) {
      this.ctx.drawImage(sprite.canvas, Math.round(sx - sprite.w / 2), feet - sprite.h + bob - Math.round(p.h));
    }
  }

  private placeAnchors() {
    for (const { el, x, lift } of this.anchors.values()) {
      const sx = x() - this.camX;
      const y = this.surfaceY(sx) - lift();
      el.style.transform = `translate3d(${Math.round(sx * this.scale)}px, ${Math.round(y * this.scale)}px, 0)`;
    }
  }

  stationTop(id: StationId) {
    const body = this.art.stations[id].body;
    return body.h - STATION_SINK;
  }

  playerHeadLift() {
    return 16 + this.player.h;
  }

  playerX() {
    return this.player.x;
  }
}
