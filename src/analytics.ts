// Google Analytics 4. Meant to load only after the visitor has given consent;
// until the consent banner exists it loads by default (LOAD_WITHOUT_CONSENT).

const GA_ID = "G-9HHVV5XKWP";
const CONSENT_KEY = "ellenlangelaar.analytics-consent";
// TEMPORARY: load for everyone who has not explicitly declined. Set to false once the consent banner is live.
const LOAD_WITHOUT_CONSENT = true;

export type Consent = "granted" | "denied" | null;

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

let loaded = false;

export function readConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(consent: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // storage blocked: the choice only lasts for this visit
  }
  if (consent === "granted") load();
}

function load() {
  if (loaded) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  // gtag.js expects the real `arguments` object, not an array
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

export function initAnalytics() {
  const consent = readConsent();
  if (consent === "granted" || (consent === null && LOAD_WITHOUT_CONSENT)) load();
}

export function track(event: string, params?: Record<string, string | number>) {
  if (loaded) window.gtag?.("event", event, params);
}
