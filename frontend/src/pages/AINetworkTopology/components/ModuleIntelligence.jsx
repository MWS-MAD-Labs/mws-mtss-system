/* ModuleIntelligence — right-side detail panel for selected ecosystem node */

import { memo, useRef, useEffect } from 'react';
import { ECO_NODES, ECO_EDGES } from '../constants/ecosystemTopology';
import { ECOSYSTEM_MODULES } from '../constants/ecosystem';
import { STATUS_PALETTE } from '../constants/theme';
import gsap from 'gsap';

const ModuleIntelligence = memo(function ModuleIntelligence({ nodeId, nodeStatuses, onClose, T, isDark }) {
  const panelRef = useRef(null);
  const node = ECO_NODES.find(n => n.id === nodeId);
  const moduleData = ECOSYSTEM_MODULES.find(m => m.id === nodeId);

  useEffect(() => {
    if (panelRef.current && node) {
      gsap.fromTo(panelRef.current, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' });
    }
  }, [nodeId]);

  if (!node) return null;
  const status = nodeStatuses?.[nodeId] || 'idle';
  const connections = ECO_EDGES.filter(e => e.from === nodeId || e.to === nodeId);
  const connectedIds = connections.map(e => e.from === nodeId ? e.to : e.from);
  const connectedNodes = connectedIds.map(id => ECO_NODES.find(n => n.id === id)).filter(Boolean);

  return (
    <div ref={panelRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>{node.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: T.textMuted, fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Module Intelligence</div>
          <div style={{ color: T.textPrimary, fontSize: 12, fontWeight: 800 }}>{node.label}</div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: T.textMuted, fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: 4,
        }}>✕</button>
      </div>

      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          padding: '2px 8px', borderRadius: 6, fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase',
          background: `${STATUS_PALETTE[status]}16`, color: STATUS_PALETTE[status],
          border: `1px solid ${STATUS_PALETTE[status]}30`,
        }}>{status}</span>
        <span style={{ color: T.textMuted, fontSize: 8.5 }}>{node.type === 'core' ? 'Core Service' : 'Module'}</span>
      </div>

      {/* Description */}
      <p style={{ color: T.textSecondary, fontSize: 10, lineHeight: 1.55, margin: 0 }}>{node.desc}</p>

      {/* Module-specific stats */}
      {moduleData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {[
            { l: 'Pages', v: moduleData.stats.pages, c: '#38bdf8' },
            { l: 'APIs', v: moduleData.stats.apis, c: '#34d399' },
            { l: 'Models', v: moduleData.stats.models, c: '#fbbf24' },
          ].map(s => (
            <div key={s.l} style={{
              padding: '6px 8px', borderRadius: 8, textAlign: 'center',
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${T.panelBorder}`,
            }}>
              <div style={{ color: s.c, fontSize: 14, fontWeight: 800, fontFamily: 'monospace' }}>{s.v}</div>
              <div style={{ color: T.textMuted, fontSize: 7.5, fontWeight: 600, textTransform: 'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tech stack */}
      {moduleData?.tech && (
        <div>
          <div style={{ color: T.textMuted, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Tech Stack</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {moduleData.tech.map(t => (
              <span key={t} style={{
                padding: '2px 7px', borderRadius: 5, fontSize: 8.5,
                background: `${node.color}12`, color: node.color,
                border: `1px solid ${node.color}20`,
              }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Connections graph */}
      <div>
        <div style={{ color: T.textMuted, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
          Connections ({connections.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {connectedNodes.map(cn => {
            const st = nodeStatuses?.[cn.id] || 'idle';
            return (
              <div key={cn.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_PALETTE[st], flexShrink: 0 }} />
                <span style={{ fontSize: 12 }}>{cn.icon}</span>
                <span style={{ color: T.textPrimary, fontSize: 9, fontWeight: 600 }}>{cn.short}</span>
                <span style={{ color: T.textMuted, fontSize: 8, flex: 1, textAlign: 'right' }}>{cn.type}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pages list */}
      {moduleData?.pages && (
        <div>
          <div style={{ color: T.textMuted, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Pages</div>
          {moduleData.pages.map(p => (
            <div key={p} style={{ color: T.textPrimary, fontSize: 9, padding: '2px 0', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: node.color }} /> {p}
            </div>
          ))}
        </div>
      )}

      {/* Routes */}
      {moduleData?.routes && (
        <div>
          <div style={{ color: T.textMuted, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Routes</div>
          {moduleData.routes.map(r => (
            <div key={r} style={{ color: T.textMuted, fontSize: 8.5, fontFamily: 'monospace', padding: '1px 0' }}>{r}</div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ModuleIntelligence;
