/**
 * Design Tokens — Gravação Estudos Mega-Sena (V2)
 * ------------------------------------------------
 * Tokens premium green-neon usados APENAS na página de gravação fullscreen
 * (/admin/gravacao-estudo/megasena/*). Não impactam o design system global.
 *
 * Uso:
 *   import { ESTUDO_TOKENS as T } from "@/components/gravacao/estudos/tokens";
 *   style={{ background: T.bg.deep, border: T.border.neon, boxShadow: T.shadow.glowMd }}
 */

// ============================================================
// CORES
// ============================================================
export const COLORS = {
  // Backgrounds
  bgDeep: "#050805",                   // preto profundo (fundo principal)
  bgPanel: "rgba(15, 25, 17, 0.7)",    // glassmorphism card
  bgPanelSolid: "rgba(7, 12, 8, 0.95)", // card sólido
  bgSurface: "rgba(15, 20, 16, 0.9)",  // trilha / range bar

  // Verde neon (paleta principal)
  neon: "#7DFF3A",                     // verde neon principal
  neonSecondary: "#39D353",            // verde secundário
  neonGlow: "#B7FF8A",                 // verde suave para brilho/highlight

  // Texto
  text: "#F8FAFC",                     // branco gelo
  textMuted: "rgba(248, 250, 252, 0.65)",
  textDim: "rgba(248, 250, 252, 0.45)",
  textGhost: "rgba(248, 250, 252, 0.30)",

  // Verde com alpha (para sobreposições)
  neonA05: "rgba(125, 255, 58, 0.05)",
  neonA10: "rgba(125, 255, 58, 0.10)",
  neonA15: "rgba(125, 255, 58, 0.15)",
  neonA20: "rgba(125, 255, 58, 0.20)",
  neonA35: "rgba(125, 255, 58, 0.35)",
  neonA50: "rgba(125, 255, 58, 0.50)",
  neonA70: "rgba(125, 255, 58, 0.70)",
  neonA85: "rgba(125, 255, 58, 0.85)",

  // Alertas
  alert: "#EF4444",                    // vermelho — apenas para alertas
  alertA20: "rgba(239, 68, 68, 0.20)",
} as const;

// ============================================================
// GRADIENTES
// ============================================================
export const GRADIENTS = {
  // Background base (vinheta + ruído verde)
  bgBase:
    "radial-gradient(1200px 600px at 50% 0%, rgba(125, 255, 58, 0.06), transparent 70%), radial-gradient(900px 500px at 80% 100%, rgba(57, 211, 83, 0.05), transparent 70%), #050805",

  // Cards
  cardPanel:
    "linear-gradient(160deg, rgba(15, 25, 17, 0.9) 0%, rgba(7, 12, 8, 0.95) 100%)",
  cardHighlight:
    "radial-gradient(circle at 30% 25%, rgba(125, 255, 58, 0.12), rgba(7, 12, 8, 0.95) 70%)",
  cardSubtle:
    "linear-gradient(160deg, rgba(125, 255, 58, 0.1), rgba(57, 211, 83, 0.04))",

  // Texto neon (clip)
  textNeon:
    "linear-gradient(135deg, #B7FF8A 0%, #7DFF3A 50%, #39D353 100%)",

  // Range bar / progress
  neonBar:
    "linear-gradient(90deg, rgba(57, 211, 83, 0.85), #7DFF3A 50%, #B7FF8A)",
  progressBar:
    "linear-gradient(90deg, #39D353, #7DFF3A, #B7FF8A)",

  // Badges
  badgeSolid: "linear-gradient(135deg, #B7FF8A, #7DFF3A)",
  badgeAccent: "linear-gradient(135deg, #39D353, #7DFF3A)",
} as const;

// ============================================================
// BORDAS
// ============================================================
export const BORDERS = {
  none: "none",
  hairline: "1px solid rgba(125, 255, 58, 0.15)",
  subtle: "1.5px solid rgba(125, 255, 58, 0.22)",
  default: "1.5px solid rgba(125, 255, 58, 0.35)",
  neon: "1.5px solid rgba(125, 255, 58, 0.45)",
  strong: "2px solid #7DFF3A",
  emphasis: "2.5px solid #7DFF3A",
  alert: "1.5px solid rgba(239, 68, 68, 0.55)",
} as const;

// ============================================================
// RAIOS
// ============================================================
export const RADII = {
  sm: "0.5rem",   // 8px
  md: "0.75rem",  // 12px
  lg: "1rem",     // 16px
  xl: "1.5rem",   // 24px — cards principais
  pill: "9999px",
} as const;

// ============================================================
// SOMBRAS / GLOW
// ============================================================
export const SHADOWS = {
  none: "none",

  // Glow externo
  glowSm: "0 0 18px rgba(125, 255, 58, 0.35)",
  glowMd: "0 0 30px rgba(125, 255, 58, 0.45)",
  glowLg: "0 0 50px rgba(125, 255, 58, 0.55)",
  glowXl: "0 0 70px rgba(125, 255, 58, 0.65)",

  // Glow + inner highlight (cards premium)
  cardSoft:
    "0 0 24px rgba(125, 255, 58, 0.2), inset 0 0 20px rgba(125, 255, 58, 0.04), 0 4px 20px rgba(0,0,0,0.5)",
  cardEmphasis:
    "0 0 50px rgba(125, 255, 58, 0.55), inset 0 0 30px rgba(125, 255, 58, 0.08), 0 8px 30px rgba(0,0,0,0.6)",
  circleEmphasis:
    "0 0 70px rgba(125, 255, 58, 0.65), inset 0 0 40px rgba(125, 255, 58, 0.12), 0 0 0 1px rgba(183, 255, 138, 0.3)",

  // Trilha / inset
  trackInset:
    "inset 0 2px 10px rgba(0,0,0,0.7), 0 0 20px rgba(125, 255, 58, 0.08)",

  // Texto com glow
  textGlowSm: "0 0 12px rgba(125, 255, 58, 0.7)",
  textGlowMd: "0 0 20px rgba(125, 255, 58, 0.7)",
  textGlowLg: "0 0 35px rgba(125, 255, 58, 0.95), 0 0 12px rgba(183, 255, 138, 0.7)",

  // Progress bar
  progress:
    "0 0 18px rgba(125, 255, 58, 0.85), 0 0 4px rgba(183, 255, 138, 1)",
} as const;

// ============================================================
// BLUR
// ============================================================
export const BLUR = {
  none: "none",
  xs: "blur(4px)",
  sm: "blur(8px)",
  md: "blur(16px)",
  glass: "blur(12px) saturate(140%)",
} as const;

// Backdrop-filter helpers (use via style ou className "backdrop-blur-sm")
export const BACKDROP = {
  panel: "blur(8px) saturate(130%)",
  panelStrong: "blur(16px) saturate(150%)",
} as const;

// ============================================================
// TIPOGRAFIA
// ============================================================
export const FONT_FAMILY = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', monospace",
} as const;

export const FONT_WEIGHT = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

export const FONT_SIZE = {
  // Labels / micro
  micro: "0.625rem",   // 10px — eyebrow, tracking alto
  caption: "0.75rem",  // 12px
  body: "0.875rem",    // 14px
  bodyLg: "1rem",      // 16px
  lead: "1.25rem",     // 20px — descrições
  leadLg: "1.5rem",    // 24px
  // Títulos
  h3: "3rem",          // 48px
  h2: "3.75rem",       // 60px — títulos de slide
  h1: "5rem",          // 80px — slide hero
  display: "7rem",     // 112px — números gigantes
  hero: "9rem",        // 144px — P4 / P5 / P6 italic
} as const;

export const TRACKING = {
  tight: "-0.02em",
  normal: "0",
  wide: "0.05em",
  wider: "0.15em",
  widest: "0.25em",
  ultra: "0.4em",     // eyebrow padrão
  ultraXl: "0.55em",  // labels premium
} as const;

export const LEADING = {
  none: 1,
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.625,
} as const;

// ============================================================
// ESPAÇAMENTO / LAYOUT
// ============================================================
export const SPACING = {
  slidePadding: 80,    // padding interno de cada slide (px)
  cardPadding: 24,     // padding interno de cards
  gap: { xs: 8, sm: 12, md: 20, lg: 32, xl: 48 },
} as const;

// ============================================================
// ANIMAÇÕES (durações + easings)
// ============================================================
export const MOTION = {
  duration: {
    fast: "0.3s",
    base: "0.6s",
    slow: "0.9s",
  },
  easing: {
    standard: "cubic-bezier(0.65, 0, 0.35, 1)",
    out: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  // Transition strings prontas
  slide: "transform 0.6s cubic-bezier(0.65, 0, 0.35, 1)",
  fade: "opacity 0.3s ease-out",
} as const;

// ============================================================
// EXPORT AGRUPADO (atalho ergonômico)
// ============================================================
export const ESTUDO_TOKENS = {
  color: COLORS,
  bg: {
    deep: COLORS.bgDeep,
    panel: COLORS.bgPanel,
    panelSolid: COLORS.bgPanelSolid,
    surface: COLORS.bgSurface,
    base: GRADIENTS.bgBase,
  },
  gradient: GRADIENTS,
  border: BORDERS,
  radius: RADII,
  shadow: SHADOWS,
  blur: BLUR,
  backdrop: BACKDROP,
  font: {
    family: FONT_FAMILY,
    weight: FONT_WEIGHT,
    size: FONT_SIZE,
    tracking: TRACKING,
    leading: LEADING,
  },
  spacing: SPACING,
  motion: MOTION,
} as const;

export type EstudoTokens = typeof ESTUDO_TOKENS;
