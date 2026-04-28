import { useEffect } from "react";

const STORAGE_KEY = "lead_attribution";
const LEGACY_KEY = "utm_source";

export type LeadAttribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landing_page?: string;
  captured_at: string;
};

const TRACKED_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
] as const;

function readStored(): LeadAttribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LeadAttribution;
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    // corrupt JSON — ignore
  }
  // Legacy fallback: migrate single utm_source key if present
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    return { utm_source: legacy, captured_at: new Date().toISOString() };
  }
  return null;
}

function writeStored(data: LeadAttribution) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (data.utm_source) {
      localStorage.setItem(LEGACY_KEY, data.utm_source);
    }
  } catch {
    // storage quota / disabled — ignore
  }
}

/**
 * Normaliza valor de UTM:
 *  - trim
 *  - lowercase
 *  - colapsa espaços/underscores múltiplos em "_"
 *  - remove caracteres invisíveis (zero-width, etc.)
 * Retorna `undefined` se sobrar string vazia.
 */
function normalizeUtm(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Aliases comuns vindos de campanhas legadas / mal formatadas.
 * Mantém o domínio canônico de origens (bio | grupo | meta | whatsapp | instagram).
 */
const SOURCE_ALIASES: Record<string, string> = {
  ig: "instagram",
  insta: "instagram",
  fb: "meta",
  facebook: "meta",
  meta_ads: "meta",
  wpp: "whatsapp",
  wa: "whatsapp",
  zap: "whatsapp",
  link_bio: "bio",
  linkbio: "bio",
  biolink: "bio",
  group: "grupo",
  grupos: "grupo",
};

function canonicalizeSource(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return SOURCE_ALIASES[value] ?? value;
}

/**
 * Inferência de origem a partir do referrer quando faltar utm_source.
 */
function inferSourceFromReferrer(referrer: string): string | undefined {
  if (!referrer) return undefined;
  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return undefined;
  }
  if (/instagram\.com$/.test(host) || host === "instagram.com") return "instagram";
  if (/(facebook\.com|fb\.com|fb\.me|m\.facebook\.com)$/.test(host)) return "meta";
  if (/(whatsapp\.com|wa\.me|api\.whatsapp\.com)$/.test(host)) return "whatsapp";
  if (/(t\.co|twitter\.com|x\.com)$/.test(host)) return "twitter";
  if (/(google\.|bing\.|duckduckgo\.)/.test(host)) return "organic";
  if (/(youtube\.com|youtu\.be)$/.test(host)) return "youtube";
  if (/(tiktok\.com)$/.test(host)) return "tiktok";
  return undefined;
}

/**
 * Captures full marketing attribution (UTMs + click IDs + referrer) on first visit.
 * First-touch model: never overwrites an existing attribution snapshot.
 */
export function useUTM() {
  useEffect(() => {
    try {
      // Already captured — skip (first-touch attribution)
      const existing = readStored();
      if (existing) return;

      const params = new URLSearchParams(window.location.search);
      const captured: Partial<LeadAttribution> = {};

      // Standard UTM + click IDs (normalizados)
      for (const key of TRACKED_PARAMS) {
        const value = normalizeUtm(params.get(key));
        if (value) captured[key] = value;
      }

      // Legacy ?utm=xxx → utm_source
      if (!captured.utm_source) {
        const legacyUtm = normalizeUtm(params.get("utm"));
        if (legacyUtm) captured.utm_source = legacyUtm;
      }

      // Parâmetro `n` (smart-links internos): trata como source quando faltar.
      if (!captured.utm_source) {
        const nParam = normalizeUtm(params.get("n"));
        if (nParam) captured.utm_source = nParam;
      }

      // Click IDs implicam medium=cpc/source quando faltar.
      if (captured.gclid && !captured.utm_source) captured.utm_source = "google";
      if (captured.gclid && !captured.utm_medium) captured.utm_medium = "cpc";
      if (captured.fbclid && !captured.utm_source) captured.utm_source = "meta";
      if (captured.fbclid && !captured.utm_medium) captured.utm_medium = "cpc";

      // Canonicaliza aliases (ig→instagram, fb→meta, group→grupo, etc.)
      captured.utm_source = canonicalizeSource(captured.utm_source);

      // Origem "grupo": qualquer link disparado no grupo de WhatsApp usa
      // utm_medium=group ou utm_campaign=blast_*. Sobrescrevemos o utm_source
      // para "grupo" (em vez de "whatsapp") para que a atribuição final reflita
      // a origem real — o grupo, não o canal.
      const isGroupLink =
        captured.utm_medium === "group" ||
        (captured.utm_campaign?.startsWith("blast_") ?? false);
      if (isGroupLink) {
        captured.utm_source = "grupo";
        if (!captured.utm_medium) captured.utm_medium = "group";
      }

      // Referrer + landing page
      const referrer = document.referrer || "";
      const sameOrigin = referrer.startsWith(window.location.origin);
      if (referrer && !sameOrigin) {
        captured.referrer = referrer;

        // Fallback final: inferir source pelo referrer se ainda estiver faltando.
        if (!captured.utm_source) {
          const inferred = inferSourceFromReferrer(referrer);
          if (inferred) {
            captured.utm_source = inferred;
            if (!captured.utm_medium) captured.utm_medium = "referral";
          }
        }
      }

      const hasAnyAttribution = Object.keys(captured).length > 0;
      if (!hasAnyAttribution) return;

      captured.landing_page = window.location.href;
      captured.captured_at = new Date().toISOString();

      writeStored(captured as LeadAttribution);
    } catch (err) {
      console.warn("[useUTM] capture failed:", err);
    }
  }, []);
}

export function getStoredAttribution(): LeadAttribution | null {
  return readStored();
}

/** Backward-compatible shim — returns only utm_source string for legacy callers. */
export function getStoredUTM(): string | null {
  const data = readStored();
  return data?.utm_source ?? null;
}

export function clearAttribution() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
}

/** Backward-compatible alias. */
export function clearUTM() {
  clearAttribution();
}
