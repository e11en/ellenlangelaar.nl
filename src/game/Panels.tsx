import { useEffect, useRef, type ReactNode } from "react";
import { career, certificates, links, skillGroups, type StationId } from "./content";
import { PixelIcon } from "./PixelIcon";

type PanelProps = { go: (id: StationId) => void };

function About({ go }: PanelProps) {
  return (
    <>
      <div className="about">
        <img className="about-logo" src="/img/ellenlangelaar.png" alt="" />
        <div>
          <p>
            Welcome to my little corner of the galaxy! I'm <strong>Ellen Langelaar</strong> and I build{" "}
            <strong>high performance development teams</strong>: teams that deliver fast, learn continuously and keep
            getting better. I measure what matters with DORA and SPACE, and I lead with Radical Candor.
          </p>
        </div>
      </div>
      <p className="muted">Where to next, space cadet?</p>
      <div className="panel-actions">
        <button className="px-button" onClick={() => go("skills")}>Skill lab &gt;</button>
        <button className="px-button" onClick={() => go("career")}>Flight path &gt;</button>
        <button className="px-button" onClick={() => go("contact")}>Say hi &gt;</button>
      </div>
    </>
  );
}

function Skills() {
  return (
    <>
      <p className="muted">Cargo manifest – the tools I carry on every mission.</p>
      {skillGroups.map((group) => (
        <section key={group.name} className="skill-group">
          <h3>{group.name}</h3>
          <ul className="skills">
            {group.skills.map((s) => (
              <li key={s.name}>
                <img src={`/img/skills/${s.img}`} alt="" />
                <span>{s.name}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="skill-group">
        <h3>Badges earned</h3>
        <ul className="badges">
          {certificates.map((c) => (
            <li key={c.title}>
              <span className="badge-icon" aria-hidden="true" />
              <div>
                <strong>{c.title}</strong>
                <span className="muted">
                  {c.issuer} · {c.issued}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Career() {
  return (
    <>
      <p className="muted">Every stop on the way here.</p>
      <ol className="timeline">
        {career.map((r) => (
          <li key={`${r.title}-${r.from}`} className={r.current ? "current" : ""}>
            <div className="when">
              {r.from} – {r.to}
              {r.current && <span className="now">Now</span>}
            </div>
            <h3>{r.title}</h3>
            <div className="muted">
              {r.org}
              {r.place && ` · ${r.place}`}
            </div>
            {r.description && <p className="role-text">{r.description}</p>}
          </li>
        ))}
      </ol>
    </>
  );
}

function Blog() {
  return (
    <>
      <p className="transmission">
        <span className="blink">●</span> Incoming transmission…
      </p>
      <p>My personal blog.</p>
      <div className="panel-actions">
        <a className="px-button primary" href={links.blog} target="_blank" rel="noreferrer">
          <PixelIcon name="blog" size={16} /> Tune in
        </a>
      </div>
    </>
  );
}

function Contact() {
  return (
    <>
      <p>Open a channel – I'd love to hear from you.</p>
      <div className="panel-actions column">
        <a className="px-button primary" href={links.mail}>
          <PixelIcon name="mail" size={18} /> Send me a mail
        </a>
        <a className="px-button" href={links.linkedin} target="_blank" rel="noreferrer">
          <PixelIcon name="linkedin" size={18} /> LinkedIn
        </a>
        <a className="px-button" href={links.github} target="_blank" rel="noreferrer">
          <PixelIcon name="github" size={18} /> GitHub
        </a>
      </div>
    </>
  );
}

const panels: Record<Exclude<StationId, "rocket">, { title: string; body: (p: PanelProps) => ReactNode }> = {
  about: { title: "Captain's log", body: About },
  skills: { title: "Skill lab", body: Skills },
  career: { title: "Flight path", body: Career },
  blog: { title: "Transmissions", body: Blog },
  contact: { title: "Comms tower", body: Contact },
};

export function Panel({ id, onClose, go }: { id: Exclude<StationId, "rocket">; onClose: () => void; go: (id: StationId) => void }) {
  const close = useRef<HTMLButtonElement>(null);
  const { title, body: Body } = panels[id];

  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="panel" role="dialog" aria-modal="true" aria-labelledby="panel-title">
        <header>
          <h2 id="panel-title">{title}</h2>
          <button ref={close} className="close" onClick={onClose} aria-label="Close">
            X
          </button>
        </header>
        <div className="panel-body">
          <Body go={go} />
        </div>
      </section>
    </div>
  );
}
