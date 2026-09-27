import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/press-start-2p";
import "@fontsource/vt323";
import "./game/game.css";
import App from "./App";
import { initAnalytics } from "./analytics";

initAnalytics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
