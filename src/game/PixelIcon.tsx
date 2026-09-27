const icons = {
  mail: [
    "XXXXXXXXXX",
    "XX......XX",
    "X.X....X.X",
    "X..X..X..X",
    "X...XX...X",
    "X........X",
    "X........X",
    "XXXXXXXXXX",
  ],
  linkedin: [
    "XXXXXXXXXX",
    "X..XXXXXXX",
    "X..XXXXXXX",
    "XXXXXXXXXX",
    "X..X...XXX",
    "X..X....XX",
    "X..X..X..X",
    "X..X..X..X",
    "X..X..X..X",
    "XXXXXXXXXX",
  ],
  github: [
    ".X......X.",
    ".XX....XX.",
    ".XXXXXXXX.",
    "XXXXXXXXXX",
    "XX..XX..XX",
    "XX..XX..XX",
    "XXXXXXXXXX",
    ".XXXXXXXX.",
    "..XX..XX..",
    "..XX..XX..",
  ],
  blog: [
    "..XXXXXX..",
    ".X......X.",
    "X..XXXX..X",
    "X.X....X.X",
    "X...XX...X",
    "X..X..X..X",
    "X....X...X",
    ".X......X.",
    "..XXXXXX..",
  ],
};

export type IconName = keyof typeof icons;

export function PixelIcon({ name, size = 20 }: { name: IconName; size?: number }) {
  const rows = icons[name];
  const w = rows[0].length;
  const h = rows.length;
  return (
    <svg width={size} height={(size * h) / w} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) => (ch === "X" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" /> : null)),
      )}
    </svg>
  );
}
