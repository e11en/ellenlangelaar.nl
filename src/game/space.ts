import { asteroid, bigPlanet, C, gem, rect, ship, ufo, type Sprite } from "./sprites";

// The mini game behind the launch pad: fly up through an asteroid field, dodge rocks, grab crystals.
// It draws into the same low-resolution canvas as the planet, in screen coordinates.

const BEST_KEY = "ellenlangelaar.space.best";
const INTRO = 1.6;
// Every SECTOR_KM of flight the next sector starts and the field gets busier.
export const SECTOR_KM = 200;

export function sectorName(n: number) {
  if (n === 1) return "Asteroid belt";
  if (n === 2) return "Asteroid storm";
  if (n === 3) return "UFOs incoming!";
  if (n === 4) return "Planets ahead";
  return "Deep space";
}

type Rock = { x: number; y: number; vx: number; vy: number; sprite: Sprite; r: number };
export type GemKind = "diamond" | "ruby" | "emerald" | "star";
export const gemKinds: { kind: GemKind; value: number; weight: number; color: string }[] = [
  { kind: "diamond", value: 10, weight: 6, color: C.cyan },
  { kind: "ruby", value: 25, weight: 3, color: C.pink },
  { kind: "emerald", value: 50, weight: 1.4, color: "#7df0a0" },
  { kind: "star", value: 100, weight: 0.5, color: C.glow },
];
type Gem = { x: number; y: number; t: number; kind: GemKind };
type Ufo = { x: number; y: number; vx: number; t: number; fire: number };
type Bolt = { x: number; y: number; vx: number; vy: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string };
type Star = { x: number; y: number; layer: number };

let art: { ship: Sprite; rocks: Sprite[]; gems: Record<GemKind, Sprite>; ufo: Sprite; planets: { sprite: Sprite; size: number }[] } | null = null;
function getArt() {
  if (!art) {
    const sizes = [8, 10, 12, 14, 16, 20, 24];
    art = {
      ship: ship(),
      rocks: sizes.flatMap((s, i) => [asteroid(s, i + 1), asteroid(s, i + 11)]),
      gems: { diamond: gem("diamond"), ruby: gem("ruby"), emerald: gem("emerald"), star: gem("star") },
      ufo: ufo(),
      planets: [40, 52, 46, 60, 36, 56, 44, 64].map((size, i) => ({ size, sprite: bigPlanet(size, i) })),
    };
  }
  return art;
}

// Data URLs of the gem sprites, for the HUD counters.
export function gemIcons() {
  const a = getArt();
  return Object.fromEntries(gemKinds.map((g) => [g.kind, a.gems[g.kind].canvas.toDataURL()])) as Record<GemKind, string>;
}

function pickKind(): GemKind {
  const total = gemKinds.reduce((n, g) => n + g.weight, 0);
  let r = Math.random() * total;
  for (const g of gemKinds) {
    r -= g.weight;
    if (r <= 0) return g.kind;
  }
  return "diamond";
}

export function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeBest(v: number) {
  try {
    localStorage.setItem(BEST_KEY, String(v));
  } catch {
    // storage blocked: the best score just won't survive a reload
  }
}

export class SpaceRun {
  x: number;
  private y: number;
  private target: number | null = null;
  private t = 0;
  private distance = 0;
  private bonus = 0;
  private rocks: Rock[] = [];
  private gems: Gem[] = [];
  private sparks: Spark[] = [];
  private stars: Star[] = [];
  private ufos: Ufo[] = [];
  private bolts: Bolt[] = [];
  private ufoTimer = 1;
  private planetTimer = 1;
  private spawn = INTRO;
  private gemTimer = 1.2;
  collected: Record<GemKind, number> = { diamond: 0, ruby: 0, emerald: 0, star: 0 };
  private flash = 0;
  crashed = false;
  private crashT = 0;
  private reported = false;
  best = readBest();

  constructor(
    private W: number,
    private H: number,
    private nebula: HTMLCanvasElement,
    private onCrash: (score: number, best: number, isNewBest: boolean, gems: Record<GemKind, number>) => void,
  ) {
    this.x = W / 2;
    this.y = H + 30;
    for (let i = 0; i < 90; i++) this.stars.push({ x: Math.random() * W, y: Math.random() * H, layer: i % 3 });
  }

  get km() {
    return Math.floor(this.distance / 8);
  }

  get score() {
    return this.km + this.bonus;
  }

  get sector() {
    return Math.floor(this.km / SECTOR_KM) + 1;
  }

  private get speed() {
    // a small ramp inside each sector, a real step at every new one
    const inSector = (this.km % SECTOR_KM) / SECTOR_KM;
    return Math.min(320, 80 + (this.sector - 1) * 24 + inSector * 10);
  }

  steerTo(vx: number) {
    this.target = vx;
  }

  update(dt: number, left: boolean, right: boolean) {
    this.t += dt;
    const a = getArt();
    const restY = this.H - a.ship.h - 14;

    if (!this.crashed) {
      this.distance += this.speed * dt;
      // fly in from below during the intro
      this.y += (restY - this.y) * (1 - Math.exp(-dt * 3));
      if (left !== right) {
        this.target = null;
        this.x += (right ? 1 : -1) * 130 * dt;
      } else if (this.target !== null) {
        this.x += (this.target - this.x) * (1 - Math.exp(-dt * 10));
      }
      this.x = Math.max(8, Math.min(this.W - 8, this.x));

      // exhaust
      for (let i = 0; i < 2; i++) {
        this.sparks.push({
          x: this.x + (Math.random() - 0.5) * 3,
          y: this.y + a.ship.h - 2,
          vx: (Math.random() - 0.5) * 20,
          vy: 40 + Math.random() * 40,
          life: 0,
          max: 0.25 + Math.random() * 0.2,
          color: Math.random() < 0.5 ? C.glow : C.glowLo,
        });
      }

      this.spawn -= dt;
      if (this.spawn <= 0) {
        const busier = 1 + (this.sector - 1) * 0.4;
        // tuned for a ~390 px wide field; a narrow phone gets fewer rocks so the density stays fair
        const narrow = Math.min(2, Math.max(0.8, 390 / this.W));
        this.spawn = Math.max(0.12, 0.8 / busier) * narrow * (0.6 + Math.random() * 0.8);
        const sprite = a.rocks[Math.floor(Math.random() * a.rocks.length)];
        this.rocks.push({
          x: Math.random() * this.W,
          y: -sprite.h,
          vx: (Math.random() - 0.5) * 20,
          vy: this.speed * (0.7 + Math.random() * 0.6),
          sprite,
          r: (sprite.w / 2) * 0.75,
        });
      }
      if (this.sector >= 3) {
        this.ufoTimer -= dt;
        if (this.ufoTimer <= 0) {
          this.ufoTimer = Math.max(2.2, 6 - (this.sector - 3) * 0.9) * (0.7 + Math.random() * 0.6);
          const fromLeft = Math.random() < 0.5;
          this.ufos.push({
            x: fromLeft ? -12 : this.W + 12,
            y: 14 + Math.random() * this.H * 0.3,
            vx: (fromLeft ? 1 : -1) * (40 + Math.random() * 30 + this.sector * 4),
            t: 0,
            fire: 0.6 + Math.random() * 0.6,
          });
        }
      }
      if (this.sector >= 4) {
        this.planetTimer -= dt;
        if (this.planetTimer <= 0) {
          this.planetTimer = Math.max(2.8, 7 - (this.sector - 4) * 0.9) * (0.7 + Math.random() * 0.6);
          const p = a.planets[Math.floor(Math.random() * a.planets.length)];
          this.rocks.push({
            x: p.size / 2 + Math.random() * (this.W - p.size),
            y: -p.sprite.h,
            vx: (Math.random() - 0.5) * 8,
            vy: this.speed * 0.45,
            sprite: p.sprite,
            r: p.size * 0.46,
          });
        }
      }

      this.gemTimer -= dt;
      if (this.gemTimer <= 0) {
        this.gemTimer = 0.7 + Math.random() * 1.1;
        if (Math.random() < 0.3) {
          // a wavy trail of diamonds, with a bigger prize at the end
          const n = 4 + Math.floor(Math.random() * 4);
          const x0 = 20 + Math.random() * (this.W - 40);
          const amp = 6 + Math.random() * 14;
          for (let i = 0; i < n; i++) {
            const x = Math.max(8, Math.min(this.W - 8, x0 + Math.sin(i * 0.9) * amp));
            this.gems.push({ x, y: -10 - i * 14, t: i * 0.3, kind: i === n - 1 && Math.random() < 0.5 ? pickKind() : "diamond" });
          }
          this.gemTimer += 1;
        } else {
          this.gems.push({ x: 10 + Math.random() * (this.W - 20), y: -10, t: 0, kind: pickKind() });
        }
      }
    } else {
      this.crashT += dt;
      if (this.crashT > 0.9 && !this.reported) {
        this.reported = true;
        const isNewBest = this.score > this.best;
        if (isNewBest) {
          this.best = this.score;
          writeBest(this.best);
        }
        this.onCrash(this.score, this.best, isNewBest, { ...this.collected });
      }
    }

    const speed = this.crashed ? 30 : this.speed;
    for (const s of this.stars) {
      s.y += speed * [0.15, 0.4, 0.9][s.layer] * dt;
      if (s.y > this.H) {
        s.y -= this.H;
        s.x = Math.random() * this.W;
      }
    }
    for (const r of this.rocks) {
      r.x += r.vx * dt;
      r.y += (this.crashed ? r.vy * 0.3 : r.vy) * dt;
    }
    this.rocks = this.rocks.filter((r) => r.y < this.H + 30);
    for (const u of this.ufos) {
      u.t += dt;
      u.x += u.vx * dt;
      u.fire -= dt;
      if (u.fire <= 0 && !this.crashed && u.x > 0 && u.x < this.W) {
        u.fire = Math.max(0.5, 1.4 - this.sector * 0.08) * (0.7 + Math.random() * 0.6);
        // aim roughly at the rocket
        const dx = this.x - u.x;
        const dy = this.y - u.y;
        const len = Math.hypot(dx, dy) || 1;
        const v = 110 + this.sector * 6;
        this.bolts.push({ x: u.x, y: u.y + 8, vx: (dx / len) * v, vy: (dy / len) * v });
      }
    }
    this.ufos = this.ufos.filter((u) => u.x > -30 && u.x < this.W + 30);
    for (const b of this.bolts) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    this.bolts = this.bolts.filter((b) => b.y < this.H + 5 && b.x > -5 && b.x < this.W + 5);
    for (const gm of this.gems) {
      gm.y += speed * 0.8 * dt;
      gm.t += dt;
    }
    for (const s of this.sparks) {
      s.life += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
    this.sparks = this.sparks.filter((s) => s.life < s.max);
    this.flash = Math.max(0, this.flash - dt);

    if (this.crashed) return;

    // collisions, with a forgiving hitbox around the rocket body
    const cx = this.x;
    const cy = this.y + 10;
    for (const r of this.rocks) {
      const rx = r.x;
      const ry = r.y + r.sprite.h / 2;
      if (Math.hypot(rx - cx, ry - cy) < r.r + 4) {
        this.crash();
        return;
      }
    }
    for (const u of this.ufos) {
      if (Math.hypot(u.x - cx, u.y + 4 - cy) < 11) {
        this.crash();
        return;
      }
    }
    for (const b of this.bolts) {
      if (Math.hypot(b.x - cx, b.y - cy) < 6) {
        this.crash();
        return;
      }
    }
    this.gems = this.gems.filter((gm) => {
      if (Math.hypot(gm.x - cx, gm.y + 4 - cy) < 10) {
        const info = gemKinds.find((k) => k.kind === gm.kind)!;
        this.bonus += info.value;
        this.collected[gm.kind]++;
        this.flash = gm.kind === "star" ? 0.1 : 0.04;
        for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * Math.PI * 2;
          this.sparks.push({ x: gm.x, y: gm.y + 4, vx: Math.cos(ang) * 50, vy: Math.sin(ang) * 50, life: 0, max: 0.4, color: info.color });
        }
        return false;
      }
      return gm.y < this.H + 10;
    });
  }

  private crash() {
    this.crashed = true;
    this.crashT = 0;
    this.flash = 0.25;
    const colors = [C.glow, C.glowLo, C.red, C.white, C.pink, C.metal];
    for (let i = 0; i < 60; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 20 + Math.random() * 90;
      this.sparks.push({
        x: this.x,
        y: this.y + 10,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0,
        max: 0.5 + Math.random() * 0.9,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  render(g: CanvasRenderingContext2D) {
    const { W, H } = this;
    const a = getArt();
    rect(g, C.night, 0, 0, W, H);
    // nebula scrolls slowly past, wrapped vertically
    const ny = Math.floor((this.distance * 0.05) % H);
    g.globalAlpha = 0.7;
    g.drawImage(this.nebula, 0, ny);
    g.drawImage(this.nebula, 0, ny - H);
    g.globalAlpha = 1;

    const streak = Math.min(6, Math.floor(this.speed / 50));
    for (const s of this.stars) {
      g.fillStyle = s.layer === 2 ? C.white : s.layer === 1 ? "#cfc4ff" : "#6f64a8";
      const len = s.layer === 2 && !this.crashed ? streak : 1;
      g.fillRect(Math.round(s.x), Math.round(s.y), 1, len);
    }

    for (const gm of this.gems) {
      const bob = Math.round(Math.sin(gm.t * 6));
      g.drawImage(a.gems[gm.kind].canvas, Math.round(gm.x - 3), Math.round(gm.y) + bob);
    }
    for (const r of this.rocks) g.drawImage(r.sprite.canvas, Math.round(r.x - r.sprite.w / 2), Math.round(r.y));
    for (const u of this.ufos) {
      const bob = Math.round(Math.sin(u.t * 5));
      g.drawImage(a.ufo.canvas, Math.round(u.x - a.ufo.w / 2), Math.round(u.y) + bob);
      // warning light that blinks faster right before a shot
      if (u.fire < 0.3 ? Math.floor(u.t * 20) % 2 === 0 : Math.floor(u.t * 4) % 2 === 0) rect(g, C.red, Math.round(u.x), Math.round(u.y) + bob + 8, 1, 1);
    }
    for (const b of this.bolts) {
      rect(g, C.red, Math.round(b.x - 1), Math.round(b.y - 1), 3, 3);
      rect(g, C.white, Math.round(b.x), Math.round(b.y), 1, 1);
    }

    for (const s of this.sparks) {
      g.globalAlpha = 1 - s.life / s.max;
      rect(g, s.color, Math.round(s.x), Math.round(s.y), 1, 1);
    }
    g.globalAlpha = 1;

    if (!this.crashed) {
      g.drawImage(a.ship.canvas, Math.round(this.x - a.ship.w / 2), Math.round(this.y));
      const len = 3 + Math.round(Math.random() * 3);
      rect(g, C.glowLo, Math.round(this.x - 2), Math.round(this.y) + a.ship.h - 3, 5, len);
      rect(g, C.glow, Math.round(this.x - 1), Math.round(this.y) + a.ship.h - 3, 3, len - 1);
    }

    if (this.flash > 0) {
      g.globalAlpha = this.flash * 2;
      rect(g, C.white, 0, 0, W, H);
      g.globalAlpha = 1;
    }
  }
}
