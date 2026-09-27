import { stations, WORLD_WIDTH, type StationId } from "./content";

// A tiny pixel planet in the corner: the world wraps around it, so every station has a spot on
// the rim and the astronaut marker shows where you are. Clicking a station beams you there.

const GRID = 24;
const R = 9;
const SIZE = 120; // CSS px
const PX = SIZE / GRID;

const bands = ["#9ef0ff", "#8f7bea", "#6a55c9", "#4e3aa6", "#372683"];
// top-left corners of 2x2 craters
const craters = [
  [9, 10],
  [14, 13],
  [8, 15],
  [14, 7],
];

function planetPixels() {
  const out: { x: number; y: number; c: string }[] = [];
  const c = GRID / 2;
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const dx = x + 0.5 - c;
      const dy = y + 0.5 - c;
      const d = Math.hypot(dx, dy);
      if (d > R + 0.5) continue;
      // light from the upper left: shade by distance from that side
      const shade = Math.min(bands.length - 1, Math.max(1, Math.floor(((dx + dy) / R + 1.6) * 1.3)));
      let color = d > R - 0.5 ? bands[0] : bands[shade];
      if (d < R - 1 && craters.some(([cx, cy]) => x - cx >= 0 && x - cx < 2 && y - cy >= 0 && y - cy < 2)) {
        color = x - craters.find(([cx, cy]) => x - cx >= 0 && x - cx < 2 && y - cy >= 0 && y - cy < 2)![0] === 0 ? "#2c1f6e" : "#3c2c8e";
      }
      // a soft highlight in the upper left
      if (d < R - 1 && dx < -2 && dy < -2 && dx + dy > -9) color = bands[1];
      out.push({ x, y, c: color });
    }
  }
  return out;
}

const pixels = planetPixels();

function onRim(worldX: number, radius: number) {
  const a = (worldX / WORLD_WIDTH) * Math.PI * 2 - Math.PI / 2;
  return { left: SIZE / 2 + Math.cos(a) * radius, top: SIZE / 2 + Math.sin(a) * radius };
}

export function Globe({ playerX, near, onTeleport }: { playerX: number; near: StationId | null; onTeleport: (id: StationId) => void }) {
  const me = onRim(playerX, R * PX - PX * 1.5);
  return (
    <nav className="globe" aria-label="Teleport to a station" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${GRID} ${GRID}`} shapeRendering="crispEdges" aria-hidden="true">
        {pixels.map((p) => (
          <rect key={`${p.x}-${p.y}`} x={p.x} y={p.y} width={1} height={1} fill={p.c} />
        ))}
      </svg>
      {stations.map((s) => {
        const pos = onRim(s.x, R * PX + PX * 1.5);
        return (
          <button
            key={s.id}
            className={`globe-station ${near === s.id ? "here" : ""}`}
            style={pos}
            onClick={() => onTeleport(s.id)}
            aria-label={`Teleport to ${s.label}`}
          >
            <span className="globe-tip">{s.label}</span>
          </button>
        );
      })}
      <span className="globe-me" style={me} aria-hidden="true" />
    </nav>
  );
}
