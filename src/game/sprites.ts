// Pixel art, drawn in code at 1:1 on small offscreen canvases. The game scales the whole
// low-resolution frame up with nearest-neighbour filtering, so every rect here is one "pixel".

export const C = {
  outline: "#1a1030",
  night: "#0b0620",
  deep: "#241449",
  violet: "#3d1f6b",
  plum: "#5b2a86",
  metalHi: "#e6e2f7",
  metal: "#a79fd0",
  metalLo: "#6a619c",
  metalDark: "#433a73",
  pink: "#ef8b99",
  pinkLo: "#b0587a",
  cyan: "#7ee8fa",
  cyanLo: "#2fa7c4",
  glass: "#2c3a8f",
  glassHi: "#5d7ae0",
  glow: "#ffd479",
  glowLo: "#e0913a",
  red: "#ff5d6c",
  white: "#ffffff",
  crystal: "#c98cff",
  crystalLo: "#7b48c9",
};

export type Sprite = { canvas: HTMLCanvasElement; w: number; h: number };
type G = CanvasRenderingContext2D;

export function makeSprite(w: number, h: number, draw: (g: G) => void): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!;
  draw(g);
  return { canvas, w, h };
}

export function rect(g: G, color: string, x: number, y: number, w = 1, h = 1) {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), w, h);
}

export function disc(g: G, color: string, cx: number, cy: number, r: number) {
  g.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8));
    g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
  }
}

// Upper half of a disc, including the centre row.
function dome(g: G, color: string, cx: number, cy: number, r: number) {
  g.fillStyle = color;
  for (let dy = -r; dy <= 0; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8));
    g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
  }
}

export function line(g: G, color: string, x0: number, y0: number, x1: number, y1: number) {
  g.fillStyle = color;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// A 1px ring around every opaque pixel, used to highlight whatever the mouse is on.
export function outlineOf(sprite: Sprite, color: string): Sprite {
  const { w, h } = sprite;
  const src = sprite.canvas.getContext("2d")!.getImageData(0, 0, w, h).data;
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
  return makeSprite(w + 2, h + 2, (g) => {
    g.fillStyle = color;
    for (let y = -1; y <= h; y++) {
      for (let x = -1; x <= w; x++) {
        if (solid(x, y)) continue;
        if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) g.fillRect(x + 1, y + 1, 1, 1);
      }
    }
  });
}

function fromRows(rows: string[], palette: Record<string, string>): Sprite {
  return makeSprite(rows[0].length, rows.length, (g) => {
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (palette[ch]) rect(g, palette[ch], x, y);
      });
    });
  });
}

function mirror(sprite: Sprite): Sprite {
  return makeSprite(sprite.w, sprite.h, (g) => {
    g.translate(sprite.w, 0);
    g.scale(-1, 1);
    g.drawImage(sprite.canvas, 0, 0);
  });
}

// ---------------------------------------------------------------- astronaut

const astroPalette = {
  o: C.outline,
  w: C.metalHi,
  g: C.metal,
  v: C.glass,
  c: C.cyan,
  p: C.pink,
  b: C.metalLo,
};

const astroBody = [
  "....oooo....",
  "..oowwwwoo..",
  ".owwwwwwwwo.",
  "obowwwvvvvwo",
  "obowwvcvvvvo",
  "obowwvvvvvvo",
  "obowwwvvvvwo",
  "obbowwwwwwo.",
  "obboowwwwoo.",
  "obowwwppwwwo",
  "obowwwwwgwwo",
  ".oowwwwwgwo.",
];

const legs = {
  stand: ["...owwwwwo..", "...owwowwo..", "...oggoggo..", "...ooo.ooo.."],
  stride: ["..owwwwwwo..", ".owwo..owwo.", ".ogoo..oggo.", ".ooo...ooo.."],
  pass: ["...owwwwo...", "...owwwo....", "...oggoo....", "...oooo....."],
  jump: ["..owwwwwwo..", "..owwoowwo..", "..oggooggo..", "..ooo..ooo.."],
};

export type AstroFrame = keyof typeof legs;

function astronaut(frame: AstroFrame): Sprite {
  return fromRows([...astroBody, ...legs[frame]], astroPalette);
}

export type AstroSprites = Record<AstroFrame, { right: Sprite; left: Sprite }>;

export function buildAstronaut(): AstroSprites {
  const out = {} as AstroSprites;
  (Object.keys(legs) as AstroFrame[]).forEach((f) => {
    const right = astronaut(f);
    out[f] = { right, left: mirror(right) };
  });
  return out;
}

// ---------------------------------------------------------------- stations

function homeBase(): Sprite {
  return makeSprite(66, 46, (g) => {
    // side module
    rect(g, C.outline, 47, 25, 18, 16);
    rect(g, C.metal, 48, 26, 16, 14);
    rect(g, C.metalHi, 48, 26, 16, 2);
    rect(g, C.metalLo, 48, 36, 16, 4);
    disc(g, C.outline, 56, 31, 4);
    disc(g, C.glow, 56, 31, 3);
    rect(g, C.white, 55, 29, 2, 1);
    // glass dome
    dome(g, C.outline, 30, 38, 27);
    dome(g, C.glass, 30, 38, 26);
    for (let i = 0; i < 5; i++) line(g, C.glassHi, 30, 12, 6 + i * 12, 38);
    for (let y = 18; y < 38; y += 7) {
      const dx = Math.floor(Math.sqrt(26 * 26 - (38 - y) ** 2));
      rect(g, C.glassHi, 30 - dx, y, dx * 2 + 1, 1);
    }
    line(g, C.cyan, 12, 24, 20, 16);
    line(g, C.cyan, 13, 25, 21, 17);
    // interior silhouettes: a plant and a desk lamp glow
    rect(g, C.deep, 42, 30, 2, 8);
    disc(g, C.plum, 43, 28, 3);
    rect(g, C.pink, 42, 27, 1, 1);
    rect(g, C.glowLo, 14, 34, 6, 1);
    // airlock door
    rect(g, C.outline, 22, 22, 17, 17);
    rect(g, C.metal, 23, 23, 15, 16);
    rect(g, C.metalHi, 23, 23, 15, 2);
    rect(g, C.pink, 23, 30, 15, 2);
    rect(g, C.outline, 27, 25, 7, 5);
    rect(g, C.glow, 28, 26, 5, 3);
    rect(g, C.metalLo, 30, 32, 1, 7);
    // antenna
    rect(g, C.outline, 29, 2, 3, 10);
    rect(g, C.metalHi, 30, 3, 1, 9);
    // foundation
    rect(g, C.outline, 0, 38, 66, 8);
    rect(g, C.metalLo, 1, 39, 64, 6);
    rect(g, C.metal, 1, 39, 64, 1);
    for (let x = 4; x < 64; x += 8) rect(g, C.metalDark, x, 41, 4, 2);
  });
}

function skillLab(): Sprite {
  return makeSprite(50, 76, (g) => {
    // base block
    rect(g, C.outline, 2, 50, 46, 26);
    rect(g, C.metal, 3, 51, 44, 24);
    rect(g, C.metalHi, 3, 51, 44, 2);
    rect(g, C.metalLo, 3, 70, 44, 5);
    for (let x = 6; x < 44; x += 10) {
      rect(g, C.outline, x, 56, 7, 7);
      rect(g, C.cyanLo, x + 1, 57, 5, 5);
      rect(g, C.cyan, x + 1, 57, 2, 2);
    }
    // tube column
    rect(g, C.outline, 11, 20, 28, 31);
    rect(g, C.metalLo, 12, 21, 26, 30);
    rect(g, C.metal, 12, 21, 4, 30);
    rect(g, C.outline, 19, 22, 12, 28);
    rect(g, C.cyanLo, 20, 23, 10, 26);
    rect(g, C.cyan, 20, 23, 2, 26);
    for (let y = 26; y < 48; y += 6) rect(g, C.metalDark, 32, y, 4, 2);
    // crystal on top
    const cx = 25;
    for (let i = 0; i < 12; i++) {
      const half = i < 6 ? i : 11 - i;
      rect(g, C.outline, cx - half - 1, 6 + i, half * 2 + 3, 1);
    }
    for (let i = 1; i < 11; i++) {
      const half = i < 6 ? i : 11 - i;
      rect(g, C.crystalLo, cx - half, 6 + i, half * 2 + 1, 1);
      rect(g, C.crystal, cx - half, 6 + i, half + 1, 1);
    }
    rect(g, C.white, cx - 2, 9, 1, 2);
    // collar
    rect(g, C.outline, 9, 17, 32, 4);
    rect(g, C.metalHi, 10, 18, 30, 2);
  });
}

function archive(): Sprite {
  return makeSprite(92, 54, (g) => {
    // arched hangar roof
    for (let y = 0; y < 22; y++) {
      const t = 1 - (22 - y) / 22;
      const half = Math.floor(44 * Math.sqrt(t * (2 - t)));
      rect(g, C.outline, 46 - half - 1, y, half * 2 + 2, 1);
      if (y > 0) {
        rect(g, C.metal, 46 - half, y, half * 2, 1);
        rect(g, C.metalHi, 46 - half, y, Math.max(1, Math.floor(half * 0.6)), 1);
      }
    }
    for (let x = 10; x < 84; x += 9) line(g, C.metalLo, x, 20, 46 + Math.round((x - 46) * 0.4), 3);
    // walls
    rect(g, C.outline, 1, 20, 90, 34);
    rect(g, C.metalLo, 2, 21, 88, 32);
    rect(g, C.metal, 2, 21, 88, 2);
    rect(g, C.pink, 2, 25, 88, 2);
    // hangar door, half open with warm light inside
    rect(g, C.outline, 28, 28, 36, 26);
    rect(g, C.metalDark, 29, 29, 34, 16);
    for (let y = 31; y < 45; y += 3) rect(g, C.metalLo, 29, y, 34, 1);
    rect(g, C.glowLo, 29, 45, 34, 8);
    rect(g, C.glow, 29, 47, 34, 6);
    rect(g, C.deep, 38, 48, 6, 5);
    rect(g, C.deep, 50, 46, 8, 7);
    // side windows
    for (const x of [8, 72]) {
      rect(g, C.outline, x, 32, 12, 8);
      rect(g, C.glass, x + 1, 33, 10, 6);
      rect(g, C.glassHi, x + 1, 33, 4, 2);
    }
    rect(g, C.outline, 0, 52, 92, 2);
  });
}

function crate(g: G, x: number, y: number, color: string, dark: string) {
  rect(g, C.outline, x, y, 12, 10);
  rect(g, color, x + 1, y + 1, 10, 8);
  rect(g, dark, x + 1, y + 7, 10, 2);
  line(g, dark, x + 1, y + 1, x + 10, y + 8);
}

function archiveCrates(): Sprite {
  return makeSprite(26, 20, (g) => {
    crate(g, 0, 10, C.pink, C.pinkLo);
    crate(g, 13, 10, C.metal, C.metalLo);
    crate(g, 6, 1, C.glowLo, "#9c5a24");
  });
}

function dish(): Sprite {
  return makeSprite(56, 66, (g) => {
    // pedestal
    rect(g, C.outline, 21, 34, 12, 26);
    rect(g, C.metal, 22, 35, 10, 25);
    rect(g, C.metalHi, 22, 35, 3, 25);
    rect(g, C.outline, 10, 58, 34, 8);
    rect(g, C.metalLo, 11, 59, 32, 6);
    rect(g, C.metal, 11, 59, 32, 1);
    rect(g, C.pink, 22, 46, 10, 2);
    // bowl: a tilted ellipse (the mouth) on top of a slightly offset darker one (the back shell)
    const inside = (x: number, y: number, ox: number, oy: number) => {
      const a = -0.75;
      const dx = x - 24 - ox;
      const dy = y - 26 - oy;
      const u = dx * Math.cos(a) - dy * Math.sin(a);
      const v = dx * Math.sin(a) + dy * Math.cos(a);
      return (u * u) / (19 * 19) + (v * v) / (8 * 8) <= 1;
    };
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        const back = inside(x, y, -3, 3);
        const mouth = inside(x, y, 0, 0);
        if (!back && !mouth) continue;
        const edge = !(inside(x - 1, y, -3, 3) || inside(x - 1, y, 0, 0)) || !(inside(x + 1, y, -3, 3) || inside(x + 1, y, 0, 0))
          || !(inside(x, y - 1, -3, 3) || inside(x, y - 1, 0, 0)) || !(inside(x, y + 1, -3, 3) || inside(x, y + 1, 0, 0));
        let col = C.metalLo;
        if (mouth) {
          const rim = !inside(x - 1, y, 0, 0) || !inside(x + 1, y, 0, 0) || !inside(x, y - 1, 0, 0) || !inside(x, y + 1, 0, 0);
          col = rim ? C.metalHi : (x + y) % 9 === 0 ? C.metalLo : C.metal;
        }
        rect(g, edge ? C.outline : col, x, y);
      }
    }
    // feed arm
    line(g, C.outline, 24, 26, 36, 12);
    line(g, C.metalHi, 25, 26, 37, 13);
    disc(g, C.outline, 38, 11, 3);
    disc(g, C.pink, 38, 11, 2);
    rect(g, C.white, 37, 10, 1, 1);
  });
}

function commsTower(): Sprite {
  return makeSprite(34, 104, (g) => {
    const top = 14;
    const bottom = 100;
    const at = (y: number, left: boolean) => {
      const t = (y - top) / (bottom - top);
      return Math.round(left ? 13 - 11 * t : 20 + 11 * t);
    };
    for (let y = top; y < bottom - 10; y += 12) {
      line(g, C.metalLo, at(y, true), y, at(y + 12, false), y + 12);
      line(g, C.metalLo, at(y, false), y, at(y + 12, true), y + 12);
      line(g, C.metal, at(y, true), y, at(y, false), y);
    }
    line(g, C.outline, 13, top, 2, bottom);
    line(g, C.outline, 20, top, 31, bottom);
    line(g, C.metalHi, 14, top, 3, bottom);
    line(g, C.metalHi, 21, top, 32, bottom);
    // platform and mast
    rect(g, C.outline, 6, top - 3, 22, 4);
    rect(g, C.metal, 7, top - 2, 20, 2);
    rect(g, C.outline, 16, 0, 2, top - 2);
    rect(g, C.outline, 11, 5, 4, 5);
    rect(g, C.cyan, 12, 6, 2, 3);
    // base
    rect(g, C.outline, 0, bottom, 34, 4);
    rect(g, C.metalLo, 1, bottom + 1, 32, 2);
  });
}

function gantry(): Sprite {
  return makeSprite(60, 92, (g) => {
    // service tower
    rect(g, C.outline, 2, 16, 10, 70);
    rect(g, C.metalDark, 3, 17, 8, 68);
    for (let y = 17; y < 84; y += 8) {
      line(g, C.metalLo, 3, y, 10, y + 7);
      line(g, C.metalLo, 10, y, 3, y + 7);
    }
    rect(g, C.outline, 12, 30, 12, 3);
    rect(g, C.metal, 12, 31, 11, 1);
    rect(g, C.outline, 12, 56, 12, 3);
    rect(g, C.metal, 12, 57, 11, 1);
    rect(g, C.red, 6, 14, 2, 2);
    // pad
    rect(g, C.outline, 0, 84, 60, 8);
    rect(g, C.metalLo, 1, 85, 58, 6);
    rect(g, C.metal, 1, 85, 58, 1);
    for (let x = 2; x < 58; x += 8) {
      rect(g, C.glow, x, 88, 4, 2);
      rect(g, C.outline, x + 4, 88, 4, 2);
    }
  });
}

export function rocket(): Sprite {
  return makeSprite(28, 72, (g) => {
    const cx = 14;
    // nose cone
    for (let y = 0; y < 16; y++) {
      const half = Math.min(7, Math.floor(Math.sqrt(y * 3.2)));
      rect(g, C.outline, cx - half - 1, y, half * 2 + 3, 1);
      if (y > 0) {
        rect(g, y < 6 ? C.pink : C.metalHi, cx - half, y, half * 2 + 1, 1);
        rect(g, y < 6 ? C.pinkLo : C.metal, cx + Math.ceil(half / 2), y, Math.floor(half / 2) + 1, 1);
      }
    }
    // body
    rect(g, C.outline, cx - 8, 16, 17, 44);
    rect(g, C.metalHi, cx - 7, 16, 15, 44);
    rect(g, C.metal, cx + 3, 16, 5, 44);
    rect(g, C.pink, cx - 7, 44, 15, 3);
    rect(g, C.pink, cx - 7, 50, 15, 1);
    disc(g, C.outline, cx, 28, 5);
    disc(g, C.metalLo, cx, 28, 4);
    disc(g, C.glass, cx, 28, 3);
    rect(g, C.cyan, cx - 2, 26, 2, 2);
    // fins
    for (const s of [-1, 1]) {
      for (let i = 0; i < 14; i++) {
        const w = Math.min(6, Math.floor(i / 2) + 1);
        const x = s < 0 ? cx - 8 - w : cx + 9;
        rect(g, C.outline, x - (s < 0 ? 1 : 0), 50 + i, w + 1, 1);
        rect(g, C.pinkLo, s < 0 ? x : x, 50 + i, w, 1);
      }
    }
    // nozzle
    rect(g, C.outline, cx - 5, 60, 11, 6);
    rect(g, C.metalDark, cx - 4, 60, 9, 5);
    rect(g, C.metalLo, cx - 4, 60, 9, 1);
  });
}

function lander(): Sprite {
  return makeSprite(40, 36, (g) => {
    // legs
    line(g, C.outline, 8, 20, 1, 34);
    line(g, C.metal, 9, 20, 2, 34);
    line(g, C.outline, 31, 20, 38, 34);
    line(g, C.metal, 30, 20, 37, 34);
    rect(g, C.outline, 0, 34, 5, 2);
    rect(g, C.outline, 35, 34, 5, 2);
    // capsule
    for (let y = 2; y < 26; y++) {
      const half = Math.floor(8 + (y - 2) * 0.3);
      rect(g, C.outline, 20 - half - 1, y, half * 2 + 2, 1);
      rect(g, C.metalHi, 20 - half, y, half * 2, 1);
      rect(g, C.metal, 20 + half - 4, y, 4, 1);
    }
    rect(g, C.outline, 11, 1, 18, 1);
    rect(g, C.pink, 10, 18, 20, 3);
    disc(g, C.outline, 20, 10, 4);
    disc(g, C.glass, 20, 10, 3);
    rect(g, C.cyan, 18, 8, 2, 2);
    rect(g, C.outline, 13, 26, 14, 4);
    rect(g, C.metalDark, 14, 26, 12, 3);
  });
}

export type StationArt = {
  body: Sprite;
  hover: Sprite;
  // Extra decoration drawn next to the body, not clickable.
  extras?: { sprite: Sprite; dx: number }[];
};

export type Art = {
  astro: AstroSprites;
  stations: Record<string, StationArt>;
  lander: Sprite;
  rocket: Sprite;
  rocketHover: Sprite;
  decor: DecorSprites;
};

function station(body: Sprite, extras?: StationArt["extras"]): StationArt {
  return { body, hover: outlineOf(body, C.cyan), extras };
}

// ---------------------------------------------------------------- decor

function crystalCluster(seed: number): Sprite {
  const colors = seed % 2 ? [C.crystal, C.crystalLo] : [C.cyan, C.cyanLo];
  return makeSprite(14, 14, (g) => {
    const spikes = [[3, 8], [7, 13], [11, 6]];
    for (const [x, h] of spikes) {
      for (let i = 0; i < h; i++) {
        const half = i < 2 ? 0 : 1;
        rect(g, C.outline, x - half - 1, 14 - h + i, half * 2 + 3, 1);
      }
      for (let i = 1; i < h; i++) {
        const half = i < 2 ? 0 : 1;
        rect(g, colors[1], x - half, 14 - h + i, half * 2 + 1, 1);
        rect(g, colors[0], x - half, 14 - h + i, 1, 1);
      }
    }
  });
}

function rock(seed: number): Sprite {
  const w = 8 + (seed % 3) * 4;
  const h = 5 + (seed % 2) * 2;
  return makeSprite(w, h, (g) => {
    for (let y = 0; y < h; y++) {
      const inset = Math.max(0, 2 - y);
      rect(g, C.outline, inset, y, w - inset * 2, 1);
      if (y > 0) {
        rect(g, C.metalDark, inset + 1, y, w - inset * 2 - 2, 1);
        rect(g, C.plum, inset + 1, y, Math.floor((w - inset * 2) / 2), 1);
      }
    }
  });
}

function glowPlant(seed: number): Sprite {
  const h = 8 + (seed % 3) * 3;
  const bulb = seed % 2 ? C.pink : C.cyan;
  return makeSprite(11, h + 2, (g) => {
    // curly stalks with glowing pods, low to the ground so they read as plants
    line(g, C.outline, 5, h + 1, 5, 4);
    line(g, C.outline, 5, h + 1, 1, h - 3);
    line(g, C.outline, 5, h + 1, 9, h - 4);
    rect(g, C.cyanLo, 2, h - 1, 1, 1);
    rect(g, C.cyanLo, 8, h - 2, 1, 1);
    disc(g, C.outline, 5, 3, 2);
    rect(g, bulb, 4, 2, 3, 3);
    rect(g, C.white, 4, 2, 1, 1);
    rect(g, C.outline, 0, h - 5, 3, 3);
    rect(g, bulb, 1, h - 4, 1, 1);
    rect(g, C.outline, 8, h - 6, 3, 3);
    rect(g, bulb, 9, h - 5, 1, 1);
  });
}

function mushroom(seed: number): Sprite {
  const scale = 1 + (seed % 3) * 0.45;
  const capR = Math.round(12 * scale);
  const stemH = Math.round(34 * scale);
  const w = capR * 2 + 4;
  const h = stemH + capR;
  return makeSprite(w, h, (g) => {
    const cx = Math.floor(w / 2);
    const lean = seed % 2 ? 1 : -1;
    for (let y = capR; y < h; y++) {
      const t = (y - capR) / stemH;
      const x = cx + Math.round(lean * 4 * scale * Math.sin(t * Math.PI));
      const half = Math.round(2 * scale + t * 2);
      rect(g, C.violet, x - half, y, half * 2 + 1, 1);
    }
    for (let dy = -capR; dy <= 2; dy++) {
      const dx = Math.floor(Math.sqrt(Math.max(0, capR * capR - dy * dy)) * (dy > 0 ? 1 : 1));
      rect(g, C.violet, cx - dx, capR + dy - 2, dx * 2 + 1, 1);
    }
    rect(g, C.plum, cx - capR + 2, capR - 2, capR * 2 - 3, 1);
    // glowing spots
    const spots = 3 + (seed % 3);
    for (let i = 0; i < spots; i++) {
      const a = Math.PI * (0.15 + (0.7 * i) / spots);
      const sx = cx + Math.round(Math.cos(a) * capR * 0.65);
      const sy = capR - 2 - Math.round(Math.sin(a) * capR * 0.6);
      rect(g, i % 2 ? C.pink : C.cyan, sx, sy, 2, 2);
    }
  });
}

function spire(seed: number): Sprite {
  const h = 40 + (seed % 5) * 14;
  const w = 16 + (seed % 3) * 6;
  return makeSprite(w, h, (g) => {
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const half = Math.max(1, Math.round((w / 2) * Math.pow(t, 0.6)));
      const wobble = Math.round(Math.sin(y * 0.25 + seed) * 1.5);
      rect(g, C.deep, w / 2 - half + wobble, y, half * 2, 1);
    }
    if (seed % 2) rect(g, C.pinkLo, Math.floor(w / 2), Math.floor(h * 0.4), 1, 1);
  });
}

export type DecorSprites = {
  crystals: Sprite[];
  rocks: Sprite[];
  plants: Sprite[];
  mushrooms: Sprite[];
  spires: Sprite[];
};

export function buildArt(): Art {
  const rocketSprite = rocket();
  return {
    astro: buildAstronaut(),
    stations: {
      about: station(homeBase()),
      skills: station(skillLab()),
      career: station(archive(), [{ sprite: archiveCrates(), dx: 56 }]),
      blog: station(dish()),
      contact: station(commsTower()),
      rocket: station(gantry()),
    },
    lander: lander(),
    rocket: rocketSprite,
    rocketHover: outlineOf(rocketSprite, C.cyan),
    decor: {
      crystals: [0, 1, 2, 3].map(crystalCluster),
      rocks: [0, 1, 2, 3, 4, 5].map(rock),
      plants: [0, 1, 2, 3, 4, 5].map(glowPlant),
      mushrooms: [0, 1, 2, 3, 4, 5].map(mushroom),
      spires: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(spire),
    },
  };
}

// ---------------------------------------------------------------- space run

export function ship(): Sprite {
  return makeSprite(13, 24, (g) => {
    const cx = 6;
    for (let y = 0; y < 6; y++) {
      const half = Math.min(3, Math.floor((y + 1) / 2));
      rect(g, C.outline, cx - half - 1, y, half * 2 + 3, 1);
      if (y > 0) rect(g, y < 3 ? C.pink : C.metalHi, cx - half, y, half * 2 + 1, 1);
    }
    rect(g, C.outline, 2, 6, 9, 13);
    rect(g, C.metalHi, 3, 6, 7, 12);
    rect(g, C.metal, 8, 6, 2, 12);
    disc(g, C.outline, cx, 10, 2);
    rect(g, C.glass, cx - 1, 9, 3, 3);
    rect(g, C.cyan, cx - 1, 9, 1, 1);
    rect(g, C.pink, 3, 15, 7, 1);
    for (let i = 0; i < 6; i++) {
      const w = Math.min(2, Math.floor(i / 2) + 1);
      rect(g, C.outline, 2 - w - 1, 13 + i, w + 1, 1);
      rect(g, C.pinkLo, 2 - w, 13 + i, w, 1);
      rect(g, C.outline, 11, 13 + i, w + 1, 1);
      rect(g, C.pinkLo, 11, 13 + i, w, 1);
    }
    rect(g, C.outline, 4, 18, 5, 3);
    rect(g, C.metalDark, 5, 18, 3, 2);
  });
}

export function asteroid(size: number, seed: number): Sprite {
  const R = size / 2;
  const radius = (a: number) =>
    R * (0.82 + 0.1 * Math.sin(a * 3 + seed) + 0.08 * Math.sin(a * 5 + seed * 2.3));
  return makeSprite(size + 2, size + 2, (g) => {
    const c = size / 2 + 1;
    const inside = (x: number, y: number) => {
      const dx = x + 0.5 - c;
      const dy = y + 0.5 - c;
      return Math.hypot(dx, dy) <= radius(Math.atan2(dy, dx));
    };
    for (let y = 0; y < size + 2; y++) {
      for (let x = 0; x < size + 2; x++) {
        if (!inside(x, y)) continue;
        const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
        const light = (x - c + (y - c)) / size;
        rect(g, edge ? C.outline : light < -0.25 ? "#a594c9" : light > 0.25 ? "#4d3f6e" : "#7d6b9e", x, y);
      }
    }
    // a couple of craters
    const n = size > 12 ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const a = seed * 1.7 + i * 2.1;
      const d = R * 0.4;
      const x = Math.round(c + Math.cos(a) * d - 1);
      const y = Math.round(c + Math.sin(a) * d - 1);
      rect(g, "#4d3f6e", x, y, 2, 2);
      rect(g, "#a594c9", x + 1, y + 2, 2, 1);
    }
  });
}

// Collectible gems for the space run; every kind has its own cut so they read apart at a glance.
export function gem(kind: "diamond" | "ruby" | "emerald" | "star"): Sprite {
  const colors = {
    diamond: [C.cyan, C.cyanLo],
    ruby: [C.pink, C.pinkLo],
    emerald: ["#7df0a0", "#2fa866"],
    star: [C.glow, C.glowLo],
  }[kind];
  const shapes = {
    // half-width per row
    diamond: [1, 2, 3, 3, 3, 2, 2, 1, 0],
    ruby: [1, 2, 3, 3, 3, 3, 2, 1],
    emerald: [2, 3, 3, 3, 3, 3, 3, 2],
    star: [],
  };
  if (kind === "star") {
    return fromRows(
      ["...o...", "..oyo..", "oooyooo", "oyYGyyo", ".oyGyo.", "oyyoyyo", "oo...oo"],
      { o: C.outline, y: colors[1], G: colors[0], Y: C.white },
    );
  }
  const rows = shapes[kind];
  return makeSprite(7, rows.length, (g) => {
    rows.forEach((half, y) => {
      rect(g, C.outline, 3 - half, y, half * 2 + 1, 1);
      if (half > 0 && y > 0 && y < rows.length - 1) {
        rect(g, colors[1], 3 - half + 1, y, half * 2 - 1, 1);
        rect(g, colors[0], 3 - half + 1, y, Math.max(1, half - 1), 1);
      }
    });
    rect(g, C.white, 2, 2, 1, 1);
  });
}

export function ufo(): Sprite {
  return fromRows(
    [
      "......ooooo......",
      ".....occcCco.....",
      "....occccccco....",
      "..ooooooooooooo..",
      ".ommmmmmmmmmmmmo.",
      "ommpmmmpmmmpmmmmo",
      ".oLLLLLLLLLLLLLo.",
      "..ooooooooooooo..",
    ],
    { o: C.outline, c: C.cyanLo, C: C.cyan, m: C.metal, p: C.pink, L: C.metalLo },
  );
}

// A big planet drifting through the flight path: shaded, banded and sometimes ringed.
export function bigPlanet(size: number, seed: number): Sprite {
  const palettes = [
    ["#6fd6ef", "#4aa3d8", "#2f62a8", "#27418a"],
    ["#ffb3c0", "#ef8b99", "#b0587a", "#6b2f55"],
    ["#ffe0a3", "#ffd479", "#e0913a", "#9c5a24"],
    ["#b9f5c8", "#7df0a0", "#2fa866", "#1d6b45"],
  ];
  const pal = palettes[seed % palettes.length];
  const ringed = seed % 2 === 0;
  const pad = ringed ? Math.round(size * 0.35) : 1;
  const w = size + pad * 2;
  const h = size + 2;
  return makeSprite(w, h, (g) => {
    const cx = w / 2;
    const cy = h / 2;
    const r = size / 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const d = Math.hypot(dx, dy);
        if (d > r) continue;
        if (d > r - 1) {
          rect(g, C.outline, x, y);
          continue;
        }
        const light = (-dx - dy) / (r * 1.5) + 0.3;
        const band = Math.sin(dy * (0.35 + (seed % 3) * 0.1) + seed) > 0.3 ? 1 : 0;
        const level = light > 0.45 ? 0 : light > 0.05 ? 1 : light > -0.35 ? 2 : 3;
        rect(g, pal[Math.min(3, level + band)], x, y);
      }
    }
    if (ringed) {
      for (let a = 0; a < Math.PI * 2; a += 0.004) {
        const x = Math.round(cx + Math.cos(a) * (r + pad * 0.85));
        const y = Math.round(cy + Math.sin(a) * r * 0.22 - Math.cos(a) * r * 0.1);
        if (Math.sin(a) < 0 && Math.hypot(x - cx, y - cy) < r) continue;
        rect(g, Math.sin(a) > 0 ? C.metalHi : C.metalLo, x, y);
      }
    }
  });
}
