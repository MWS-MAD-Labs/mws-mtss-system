/* LayerLegend — bottom-right topology key */

import { memo } from 'react';
import { LAYER_LABELS, STATUS_PALETTE } from '../constants/theme';

export const LayerLegend = memo(function LayerLegend({ layerColors, T }) {
  return (
    <div className="topo-panel" style={{
      position: 'absolute', bottom: 16, right: 16, zIndex: 40,
      background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 12,
      padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, width: 240,
    }}>
      <div style={{ color: T.textSecondary, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
        Topology Key
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {Object.entries(LAYER_LABELS).map(([key, label]) => {
          const c = layerColors[key];
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{
                width: 10, height: 10, borderRadius: 3, background: c.glow,
                border: `1px solid ${c.border}55`, boxShadow: `0 0 6px ${c.glow}30`,
              }} />
              <span style={{ color: c.text, fontSize: 10, fontWeight: 600 }}>{label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${T.panelBorder}`, paddingTop: 6, marginTop: 2 }}>
        <div style={{ color: T.textSecondary, fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {Object.entries(STATUS_PALETTE).map(([key, color]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}55` }} />
              <span style={{ color: T.textSecondary, fontSize: 9, textTransform: 'capitalize' }}>{key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
