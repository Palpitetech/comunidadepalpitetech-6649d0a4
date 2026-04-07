/**
 * Smart Link — detecção de ambiente e redirecionamento para grupos WhatsApp
 */

export type OS = "ios" | "android" | "desktop";

export interface Environment {
  os: OS;
  isInAppBrowser: boolean;
}

/** Detecta SO e se está em browser interno de apps sociais */
export function detectEnvironment(ua?: string): Environment {
  const userAgent = ua ?? navigator.userAgent;
  const lower = userAgent.toLowerCase();

  // In-app browser detection (Instagram, Facebook, TikTok, Snapchat, Twitter)
  const inAppPatterns = [
    "instagram",
    "fbav",
    "fban",
    "fb_iab",
    "tiktok",
    "snapchat",
    "twitter",
    "line/",
    "musical_ly",
  ];
  const isInAppBrowser = inAppPatterns.some((p) => lower.includes(p));

  // OS detection
  let os: OS = "desktop";
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    os = "ios";
  } else if (/android/i.test(userAgent)) {
    os = "android";
  }

  return { os, isInAppBrowser };
}

/** Extrai o código do convite de uma URL do WhatsApp */
export function extractInviteCode(url: string): string | null {
  const match = url.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
  return match ? match[1] : null;
}

/** Gera a URL de redirecionamento baseada no ambiente */
export function getRedirectUrl(inviteCode: string, env: Environment): string {
  if (env.os === "ios") {
    return `whatsapp://invite?code=${inviteCode}`;
  }
  if (env.os === "android") {
    return `intent://invite?code=${inviteCode}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
  }
  // Desktop / fallback
  return `https://chat.whatsapp.com/${inviteCode}`;
}

/** Gera um slug aleatório curto */
export function generateSlug(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
