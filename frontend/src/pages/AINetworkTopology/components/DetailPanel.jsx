/* DetailPanel — right-side node detail on click */

import { memo } from 'react';
import { NODE_META } from '../constants/nodes';
import { LAYER_LABELS, STATUS_PALETTE } from '../constants/theme';
import { formatLatency, formatNumber, timeAgo } from '../utils/helpers';

function Stat({ label, value, T }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: T.textMuted, fontSize: 9.5 }}>{label}</span>
      <span style={{ color: T.textPrimary, fontSize: 9.5, fontWeight: 600, fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

function Section({ label, children, T }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: T.textMuted, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>{label}</div>
      {children}
    </div>
  );
}

export const DetailPanel = memo(function DetailPanel({ nodeId, nodeRuntime, onClose, layerColors, T }) {
  if (!nodeId) return null;
  const meta = NODE_META[nodeId];
  if (!meta) return null;
  const layer = layerColors[meta.layer];
  const runtime = nodeRuntime?.[nodeId];
  const status = runtime?.status || 'idle';

  return (
    <div className="topo-panel" style={{
      position: 'absolute', top: 16, right: 16, width: 320, maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto', background: T.panelBg,
      border: `1px solid ${layer.border}44`, borderRadius: 14,
      padding: '18px 18px', zIndex: 50,
      boxShadow: `0 0 24px ${layer.glow}10, 0 4px 16px ${T.panelShadow}`,
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 10, right: 12, background: 'none',
        border: 'none', color: T.textMuted, fontSize: 18, cursor: 'pointer', lineHeight: 1,
      }}>✕</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{meta.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: layer.text, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.label}</div>
          <div style={{ color: layer.accent, fontSize: 10.5, opacity: 0.8 }}>{LAYER_LABELS[meta.layer]} · Ring {meta.ring}</div>
        </div>
        <span style={{
          padding: '2px 8px', borderRadius: 8, fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase',
          background: `${STATUS_PALETTE[status]}16`, color: STATUS_PALETTE[status],
          border: `1px solid ${STATUS_PALETTE[status]}30`,
        }}>{status}</span>
      </div>
      <p style={{ color: T.textSecondary, fontSize: 11.5, lineHeight: 1.55, margin: '0 0 12px' }}>{meta.purpose}</p>
      {runtime && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px',
          marginBottom: 12, padding: '8px 10px',
          background: `${layer.glow}08`, borderRadius: 8, border: `1px solid ${layer.glow}12`,
        }}>
          <Stat label="Hits" value={formatNumber(runtime.hits)} T={T} />
          <Stat label="Latency" value={formatLatency(runtime.avgLatency)} T={T} />
          <Stat label="Queue" value={runtime.queueDepth ?? '—'} T={T} />
          <Stat label="Throughput" value={`${runtime.lastThroughput ?? 0} rpm`} T={T} />
          <Stat label="Last Active" value={timeAgo(runtime.lastActiveAt)} T={T} />
        </div>
      )}
      <Section label="Methods" T={T}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {meta.methods.map(m => (
            <span key={m} style={{
              padding: '2px 7px', borderRadius: 5, fontSize: 9.5,
              background: `${layer.glow}12`, color: layer.accent,
              border: `1px solid ${layer.glow}20`,
            }}>{m}</span>
          ))}
        </div>
      </Section>
      <Section label="API / Routes" T={T}>
        {meta.apis.map(a => (
          <div key={a} style={{ color: T.textMuted, fontSize: 9.5, fontFamily: 'monospace', padding: '1px 0' }}>{a}</div>
        ))}
      </Section>
    </div>
  );
});
