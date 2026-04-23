/* Theme system — dark / light adaptive colors */

export const THEMES = {
  dark: {
    pageBg: 'radial-gradient(ellipse at 50% 30%, #0f0d2e 0%, #070619 40%, #020109 100%)',
    pageBgFlat: '#070619',
    auroraA: 'rgba(124,58,237,0.05)',
    auroraB: 'rgba(14,165,233,0.04)',
    panelBg: 'rgba(10,10,30,0.88)',
    panelBorder: 'rgba(148,163,184,0.10)',
    panelShadow: 'rgba(0,0,0,0.4)',
    textPrimary: '#e2e8f0',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    svgRingStroke: 'rgba(148,163,184,0.07)',
    gridOpacity: 0.02,
    vignetteColor: 'rgba(0,0,0,0.5)',
    scrollThumb: 'rgba(148,163,184,0.2)',
    statusDotBorder: '#0f172a',
    nodeHub: { bg: '#0f0f23', border: '#a78bfa', glow: '#7c3aed', text: '#e0d4ff', accent: '#c4b5fd' },
    nodeAi: { bg: '#0c1a2e', border: '#38bdf8', glow: '#0ea5e9', text: '#e0f2fe', accent: '#7dd3fc' },
    nodeBackend: { bg: '#0f1a17', border: '#34d399', glow: '#10b981', text: '#d1fae5', accent: '#6ee7b7' },
    nodeData: { bg: '#1a1008', border: '#fbbf24', glow: '#f59e0b', text: '#fef3c7', accent: '#fcd34d' },
    nodeFrontend: { bg: '#1a0c1e', border: '#f472b6', glow: '#ec4899', text: '#fce7f3', accent: '#f9a8d4' },
  },
  light: {
    pageBg: 'radial-gradient(ellipse at 50% 30%, #f0f0ff 0%, #e8eaf6 40%, #dfe3ee 100%)',
    pageBgFlat: '#eef0f7',
    auroraA: 'rgba(124,58,237,0.03)',
    auroraB: 'rgba(14,165,233,0.03)',
    panelBg: 'rgba(255,255,255,0.88)',
    panelBorder: 'rgba(100,116,139,0.18)',
    panelShadow: 'rgba(0,0,0,0.06)',
    textPrimary: '#1e293b',
    textSecondary: '#475569',
    textMuted: '#64748b',
    svgRingStroke: 'rgba(100,116,139,0.12)',
    gridOpacity: 0.05,
    vignetteColor: 'rgba(255,255,255,0.0)',
    scrollThumb: 'rgba(100,116,139,0.25)',
    statusDotBorder: '#ffffff',
    nodeHub: { bg: '#f5f3ff', border: '#8b5cf6', glow: '#7c3aed', text: '#4c1d95', accent: '#6d28d9' },
    nodeAi: { bg: '#f0f9ff', border: '#0ea5e9', glow: '#0284c7', text: '#0c4a6e', accent: '#0369a1' },
    nodeBackend: { bg: '#f0fdf4', border: '#10b981', glow: '#059669', text: '#064e3b', accent: '#047857' },
    nodeData: { bg: '#fffbeb', border: '#f59e0b', glow: '#d97706', text: '#78350f', accent: '#b45309' },
    nodeFrontend: { bg: '#fdf2f8', border: '#ec4899', glow: '#db2777', text: '#831843', accent: '#be185d' },
  },
};

export function getLayerColors(theme) {
  const t = THEMES[theme];
  return {
    hub: t.nodeHub, ai: t.nodeAi, backend: t.nodeBackend,
    data: t.nodeData, frontend: t.nodeFrontend,
  };
}

export const LAYER_LABELS = {
  hub: 'Core Hub', ai: 'AI Models', backend: 'Backend Services',
  data: 'Data Stores', frontend: 'Frontend Pages',
};

export const STATUS_PALETTE = {
  active: '#22d3ee', warm: '#a78bfa', idle: '#94a3b8', degraded: '#f87171',
};

export const PRISM_DARK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.4' opacity='0.6'%3E%3Cpolygon points='40,0 80,20 80,60 40,80 0,60 0,20'/%3E%3Cline x1='40' y1='0' x2='40' y2='80'/%3E%3Cline x1='0' y1='20' x2='80' y2='60'/%3E%3Cline x1='80' y1='20' x2='0' y2='60'/%3E%3C/g%3E%3C/svg%3E")`;

export const PRISM_LIGHT = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23475569' stroke-width='0.35' opacity='0.4'%3E%3Cpolygon points='40,0 80,20 80,60 40,80 0,60 0,20'/%3E%3Cline x1='40' y1='0' x2='40' y2='80'/%3E%3Cline x1='0' y1='20' x2='80' y2='60'/%3E%3Cline x1='80' y1='20' x2='0' y2='60'/%3E%3C/g%3E%3C/svg%3E")`;
