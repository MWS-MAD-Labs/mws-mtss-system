/* Shared utility functions */

import { RING_RADII, NODE_META } from '../constants/nodes';

export function lerp(a, b, t) { return a + (b - a) * t; }

export function computeNodePositions(cx, cy) {
  const positions = {};
  const ringNodes = [[], [], [], [], []];
  Object.entries(NODE_META).forEach(([id, meta]) => {
    ringNodes[meta.ring].push(id);
  });
  ringNodes.forEach((ids, ring) => {
    if (ring === 0) {
      ids.forEach(id => { positions[id] = { x: cx, y: cy }; });
      return;
    }
    const r = RING_RADII[ring];
    const count = ids.length;
    const ringOffset = ring === 1 ? -Math.PI / 6
      : ring === 3 ? Math.PI / 8
      : ring === 4 ? Math.PI / 16 : 0;
    const startAngle = -Math.PI / 2 + ringOffset;
    ids.forEach((id, i) => {
      const angle = startAngle + (2 * Math.PI * i) / count;
      positions[id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
  });
  return positions;
}

export function bezierMidpoint(x1, y1, x2, y2, cx, cy) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = mx - cx;
  const dy = my - cy;
  return { cpx: mx + dx * 0.18, cpy: my + dy * 0.18 };
}

export function formatLatency(ms) {
  if (!ms || ms <= 0) return '—';
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function formatNumber(n) {
  if (n == null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function timeAgo(ts) {
  if (!ts) return 'never';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}
