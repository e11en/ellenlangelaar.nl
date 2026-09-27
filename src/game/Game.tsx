import { useCallback, useEffect, useRef, useState } from "react";
import { links, stations, START_X, type StationId } from "./content";
import { Engine } from "./engine";
import { Globe } from "./Globe";
import { gemIcons, gemKinds, sectorName, type GemKind } from "./space";
import { Panel } from "./Panels";
import { PixelIcon } from "./PixelIcon";

type Hint = { kind: "start" } | { kind: "near"; id: StationId } | null;

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [open, setOpen] = useState<Exclude<StationId, "rocket"> | null>(null);
  const [scale, setScale] = useState(4);
  const [hint, setHint] = useState<Hint>({ kind: "start" });
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<"planet" | "space">("planet");
  const [banner, setBanner] = useState<{ sector: number; key: number } | null>(null);
  const [score, setScore] = useState({ now: 0, best: 0, sector: 1, gems: { diamond: 0, ruby: 0, emerald: 0, star: 0 } as Record<GemKind, number> });
  const [crash, setCrash] = useState<{ score: number; best: number; isNewBest: boolean; sector: number; gems: Record<GemKind, number> } | null>(null);
  const [icons, setIcons] = useState<Record<GemKind, string> | null>(null);
  const [touch, setTouch] = useState(() => window.matchMedia("(pointer: coarse)").matches);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = new Engine(canvas, {
      onOpen: (id) => id !== "rocket" && setOpen(id),
      onCrash: (score, best, isNewBest, gems) => setCrash({ score, best, isNewBest, gems, sector: engine.space?.sector ?? 1 }),
    });
    engineRef.current = engine;
    // Lets you drive the game from devtools, even in a background tab where requestAnimationFrame is paused.
    if (import.meta.env.DEV) Object.assign(window, { engine });
    setScale(engine.scale);
    setReady(true);
    setIcons(gemIcons());
    engine.start();

    const onResize = () => {
      engine.resize();
      setScale(engine.scale);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (engine.paused || e.metaKey || e.ctrlKey) return;
      if (engine.mode === "space") {
        if (e.code === "Escape") {
          setCrash(null);
          engine.returnToPlanet();
          return;
        }
        if (e.code === "Enter" && engine.space?.crashed) {
          setCrash(null);
          engine.restartSpace();
          return;
        }
      }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) e.preventDefault();
      if (e.code === "ArrowDown") engine.wheel(60);
      engine.keyDown(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => engine.keyUp(e.code);
    const onWheel = (e: WheelEvent) => {
      if (engine.paused) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      engine.wheel((d * unit) / engine.scale);
    };
    const onBlur = () => ["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].forEach((k) => engine.keyUp(k));

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("blur", onBlur);

    // The hint bubble, progress bar and walking state only need a few updates per second.
    let moved = false;
    let lastSector = 1;
    const poll = window.setInterval(() => {
      const x = engine.playerX();
      if (Math.abs(x - START_X) > 30) moved = true;
      const next: Hint = engine.aboard ? null : engine.near ? { kind: "near", id: engine.near } : moved ? null : { kind: "start" };
      setMode(engine.mode);
      if (!engine.space) lastSector = 1;
      if (engine.space) {
        const next = { now: engine.space.score, best: engine.space.best, sector: engine.space.sector, gems: { ...engine.space.collected } };
        if (next.sector !== lastSector) {
          if (next.sector > lastSector) setBanner({ sector: next.sector, key: Date.now() });
          lastSector = next.sector;
        }
        setScore((sc) => (JSON.stringify(sc) === JSON.stringify(next) ? sc : next));
      }
      setHint((h) => (JSON.stringify(h) === JSON.stringify(next) ? h : next));
      setProgress(Math.round(x));
    }, 100);

    return () => {
      engine.stop();
      clearInterval(poll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) engineRef.current.paused = open !== null;
  }, [open]);

  // a timer rather than animationend, so the banner also goes away with reduced motion
  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), 2500);
    return () => clearTimeout(t);
  }, [banner]);

  const go = useCallback((id: StationId) => {
    setOpen(null);
    engineRef.current!.paused = false;
    engineRef.current!.goTo(id);
  }, []);
  const close = useCallback(() => setOpen(null), []);
  const teleport = useCallback((id: StationId, openAfter = false) => {
    setOpen(null);
    const engine = engineRef.current!;
    engine.paused = false;
    engine.teleport(id);
    setProgress(engine.playerX());
    // let the beam play before the panel covers it
    if (openAfter) window.setTimeout(() => engine.goTo(id), 450);
  }, []);

  // pointer handling: mouse clicks and hovers, touch drags scroll the world
  const drag = useRef<{ x: number; y: number; from: number; moved: boolean; id: number } | null>(null);
  const local = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") setTouch(true);
    if (engineRef.current!.mode === "space") {
      engineRef.current!.click(...local(e));
      return;
    }
    drag.current = { x: e.clientX, y: e.clientY, from: engineRef.current!.currentTarget(), moved: false, id: e.pointerId };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const engine = engineRef.current!;
    if (e.pointerType === "mouse" || engine.mode === "space") engine.pointerMove(...local(e));
    const d = drag.current;
    if (!d || d.id !== e.pointerId || e.pointerType === "mouse") return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 8) d.moved = true;
    if (d.moved) engine.drag(d.from, dx);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) engineRef.current!.click(...local(e));
  };

  const u = scale; // one virtual pixel in CSS pixels
  const anchor = (key: string, x: number | (() => number), lift: number | (() => number)) => (el: HTMLElement | null) =>
    engineRef.current?.anchor(key, el, x, lift);

  return (
    <div className={`game ${mode === "space" ? "in-space" : ""} ${touch ? "touch" : ""}`} style={{ ["--u" as string]: `${u}px` }}>
      <canvas
        ref={canvasRef}
        className="world"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          // only clears the hover highlight on the planet; in space the ship should stay where it is
          if (engineRef.current?.mode === "planet") engineRef.current.pointerMove(-1, -1);
        }}
        aria-label="A pixel art planet. Walk along it to visit Ellen's stations."
        role="img"
      />

      {/* world-anchored overlays, positioned by the engine every frame */}
      <div className="world-layer" aria-hidden="true">
        {ready && engineRef.current && (
          <>
            <div className="anchor" ref={anchor(
                "title",
                // on narrow screens the camera starts centred on the astronaut, so centre the title there too
                () => (engineRef.current!.W < 320 ? START_X : START_X + 70),
                () => (engineRef.current!.W < 320 ? engineRef.current!.baseY * 0.45 : 58),
              )}>
              <div className="title">
                <h1>Hi, I am Ellen</h1>
                <p className="subtitle">and I build high performance teams</p>
              </div>
            </div>
            {stations.map((s) => (
              <div key={s.id} className="anchor" ref={anchor(s.id, s.x, engineRef.current!.stationTop(s.id) + 4)}>
                <div className={`sign ${hint?.kind === "near" && hint.id === s.id ? "active" : ""}`}>{s.label}</div>
              </div>
            ))}
            <div className="anchor" ref={anchor("player", () => engineRef.current!.playerX(), () => engineRef.current!.playerHeadLift() + 6)}>
              {hint && (
                <div className="bubble">
                  {hint.kind === "start" ? (
                    touch ? "Swipe to explore" : "Scroll or use the arrow keys"
                  ) : hint.id === "rocket" ? (
                    touch ? "Tap to board" : "Press E to board"
                  ) : touch ? (
                    "Tap to enter"
                  ) : (
                    "Press E to enter"
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <header className="hud-top">
        <Globe playerX={progress} near={hint?.kind === "near" ? hint.id : null} onTeleport={teleport} />
        <button className="px-button primary contact-me" onClick={() => teleport("contact", true)}>
          Contact me
        </button>
      </header>

      <aside className="socials" aria-label="Elsewhere">
        <a href={links.github} target="_blank" rel="noreferrer" aria-label="GitHub">
          <PixelIcon name="github" />
        </a>
        <a href={links.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
          <PixelIcon name="linkedin" />
        </a>
        <a href={links.mail} aria-label="Mail">
          <PixelIcon name="mail" />
        </a>
      </aside>

      <footer className="hud-bottom">
        <div className="keys" aria-hidden="true">
          {mode === "space" ? (
            touch ? (
              <span>Drag to steer</span>
            ) : (
              <>
                <kbd className="arrow">←</kbd>
                <kbd className="arrow">→</kbd> or mouse to steer <kbd>Esc</kbd> land
              </>
            )
          ) : touch ? (
            <span>Swipe · Tap</span>
          ) : (
            <>
              <kbd className="arrow">←</kbd>
              <kbd className="arrow">→</kbd> walk <kbd>E</kbd> enter <kbd>Space</kbd> jump
            </>
          )}
        </div>
        <div className="scroll-hint" aria-hidden="true">
          <span className="mouse">
            <span className="wheel" />
          </span>
          Scroll
        </div>
      </footer>

      {mode === "space" && (
        <div className="space-hud" aria-live="off">
          <span className="sector">Sector {score.sector}</span>
          <span>{score.now.toLocaleString("en")} km</span>
          <span className="muted">Best {score.best.toLocaleString("en")} km</span>
          <GemCounter icons={icons} gems={score.gems} />
        </div>
      )}

      {mode === "space" && banner && !crash && (
        <div key={banner.key} className="sector-banner" role="status">
          <span>Sector {banner.sector}</span>
          {sectorName(banner.sector)}
        </div>
      )}

      {crash && (
        <div className="backdrop">
          <section className="panel crash" role="dialog" aria-modal="true" aria-labelledby="crash-title">
            <header>
              <h2 id="crash-title">{crash.isNewBest ? "New record!" : "Rocket down"}</h2>
            </header>
            <div className="panel-body">
              <p className="crash-score">{crash.score.toLocaleString("en")} km</p>
              <p className="muted">
                Reached sector {crash.sector} · Best flight: {crash.best.toLocaleString("en")} km
              </p>
              <GemCounter icons={icons} gems={crash.gems} />
              <div className="panel-actions">
                <button
                  className="px-button primary"
                  autoFocus
                  onClick={() => {
                    setCrash(null);
                    engineRef.current!.restartSpace();
                  }}
                >
                  Try again
                </button>
                <button
                  className="px-button"
                  onClick={() => {
                    setCrash(null);
                    engineRef.current!.returnToPlanet();
                  }}
                >
                  Return to planet
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {open && <Panel id={open} onClose={close} go={go} />}
    </div>
  );
}

function GemCounter({ icons, gems }: { icons: Record<GemKind, string> | null; gems: Record<GemKind, number> }) {
  if (!icons) return null;
  return (
    <ul className="gem-counter" aria-label="Gems collected">
      {gemKinds.map((g) => (
        <li key={g.kind} title={`${g.kind} · +${g.value} km`}>
          <img src={icons[g.kind]} alt={g.kind} />
          {gems[g.kind]}
        </li>
      ))}
    </ul>
  );
}
