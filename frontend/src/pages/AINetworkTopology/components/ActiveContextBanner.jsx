/* ActiveContextBanner — top-center current activity indicator */

import { memo } from 'react';
import { NODE_META } from '../constants/nodes';
import { formatLatency } from '../utils/helpers';

export const ActiveContextBanner = memo(function ActiveContextBanner({ ctx, layerColors, T }) {
  if (!ctx?.title || ctx.title === 'Waiting for backend telemetry') return null;
  const modelMeta = ctx.primaryModel ? NODE_META[ctx.primaryModel] : null;
  return (
    <div className="topo-panel" style={{
      position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)',
      zIndex: 45, display: 'flex', alignItems: 'center', gap: 10,
      background: T.panelBg,
      border: `1px solid ${ctx.severity === 'attention' ? '#f8717130' : '#22d3ee24'}`,
      borderRadius: 10, padding: '8px 16px', maxWidth: 440, whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: ctx.severity === 'attention' ? '#f87171' : '#22d3ee',
        boxShadow: `0 0 8px ${ctx.severity === 'attention' ? '#f87171' : '#22d3ee'}`,
        animation: 'topo-pulse 1.5s ease-in-out infinite',
      }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ color: T.textPrimary, fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ctx.title}</div>
        <div style={{ color: T.textMuted, fontSize: 9 }}>
          {formatLatency(ctx.latencyMs)} · {ctx.throughputRpm ?? 0} rpm
          {modelMeta && <> · <span style={{ color: layerColors.ai.accent }}>{modelMeta.short}</span></>}
        </div>
      </div>
    </div>
  );
});
