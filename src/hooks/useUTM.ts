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
    // Keep legacy key in sync for any old reader still using it
    if (data.utm_source) {
      localStorage.setItem(LEGACY_KEY, data.utm_source);
    }
  } catch {
    // storage quota / disabled — ignore
  }
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

      // Standard UTM + click IDs
      for (const key of TRACKED_PARAMS) {
        const value = params.get(key);
        if (value) captured[key] = value;
      }

      // Legacy ?utm=xxx → utm_source
      if (!captured.utm_source) {
        const legacyUtm = params.get("utm");
        if (legacyUtm) captured.utm_source = legacyUtm;
      }

      // Origem "grupo": qualquer link disparado no grupo de WhatsApp usa
      // utm_medium=group ou utm_campaign=blast_*. Sobrescrevemos o utm_source
      // para "grupo" (em vez de "whatsapp") para que a atribuição final reflita
      // a origem real — o grupo, não o canal.
      const isGroupLink =
        captured.utm_medium === "group" ||
        (captured.utm_campaign?.startsWith("blast_") ?? false);
      if (isGroupLink) {
        captured.utm_source = "grupo";
      }

      // Referrer + landing page (only persist if cross-origin or has any UTM)
      const referrer = document.referrer || "";
      const sameOrigin = referrer.startsWith(window.location.origin);
      if (referrer && !sameOrigin) {
        captured.referrer = referrer;
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
