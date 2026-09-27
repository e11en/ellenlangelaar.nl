// Everything a visitor can read lives here, so the game code never has to change for a text update.

export const links = {
  mail: "mailto:ellenlangelaar@gmail.com",
  linkedin: "https://www.linkedin.com/in/ellenlangelaar",
  github: "https://github.com/e11en",
  blog: "https://blog.ellenlangelaar.nl",
};

export const skillGroups = [
  {
    name: "Leadership & ways of working",
    skills: [
      { name: "Agile", img: "agile.png" },
      { name: "DORA Metrics", img: "dora.svg" },
      { name: "SPACE Framework", img: "space.svg" },
      { name: "Radical Candor", img: "radical-candor.svg" },
    ],
  },
  {
    name: "AI & automation",
    skills: [
      { name: "Claude", img: "claude.svg" },
      { name: "Codex", img: "codex.svg" },
      { name: "n8n", img: "n8n.svg" },
    ],
  },
  {
    name: "Frontend",
    skills: [
      { name: "React", img: "react.png" },
      { name: "TypeScript", img: "typescript.png" },
      { name: "CSS", img: "css.png" },
    ],
  },
  {
    name: "Backend & data",
    skills: [
      { name: ".NET", img: "dot-net.png" },
      { name: "PHP", img: "php.png" },
      { name: "SQL", img: "sql.png" },
    ],
  },
  {
    name: "Cloud & DevOps",
    skills: [
      { name: "Azure", img: "azure.png" },
      { name: "Google Cloud", img: "google-cloud.svg" },
      { name: "Docker", img: "docker.png" },
      { name: "Linux", img: "linux.png" },
      { name: "Git", img: "git.png" },
    ],
  },
];

export const certificates = [
  { title: "High Performance Leadership", issuer: "YEARTH Academy", issued: "Nov 2025" },
  { title: "Certified AI Agent Builder", issuer: "Hugging Face", issued: "Apr 2025" },
  { title: "Certified SAFe® Agilist", issuer: "SAFe by Scaled Agile, Inc.", issued: "Sep 2024" },
];

export type Role = {
  title: string;
  org: string;
  from: string;
  to: string;
  current?: boolean;
  place?: string;
  description?: string;
};

// Newest first, as on LinkedIn.
export const career: Role[] = [
  { title: "Founder", org: "Innovature · Self-employed", from: "Jan 2025", to: "Present", current: true },
  { title: "Manager Software Engineering", org: "BTC Direct", from: "Jun 2024", to: "Present", current: true, place: "Nijmegen" },
  { title: "Manager Software Engineering", org: "Kruitbosch", from: "Jan 2023", to: "May 2024", place: "Zwolle" },
  { title: "Team Lead Software Engineer", org: "Kruitbosch", from: "Dec 2021", to: "Jan 2023", place: "Zwolle" },
  {
    title: "Software Engineer",
    org: "Various companies",
    from: "Jan 2012",
    to: "Dec 2021",
    description:
      "As a full stack developer I gained experience at various companies with a wide range of languages and frameworks, on both the front end and the back end. Working with different technologies and teams taught me to adapt quickly and solve complex problems. My hands-on experience ranges from building responsive interfaces to designing robust APIs and database structures, always with a focus on quality and impact.",
  },
  { title: "KPL1 Admeur", org: "Koninklijke Landmacht (Royal Netherlands Army)", from: "Oct 2007", to: "Sep 2011" },
];

export type StationId = "about" | "skills" | "career" | "blog" | "contact" | "rocket";

export type Station = {
  id: StationId;
  label: string;
  // World x of the station's centre, in virtual pixels.
  x: number;
};

export const stations: Station[] = [
  { id: "about", label: "Home base", x: 330 },
  { id: "skills", label: "Skill lab", x: 620 },
  { id: "career", label: "Flight path", x: 930 },
  { id: "blog", label: "Transmissions", x: 1240 },
  { id: "contact", label: "Comms tower", x: 1510 },
  { id: "rocket", label: "Launch pad", x: 1780 },
];

export const WORLD_WIDTH = 1960;
export const START_X = 120;
