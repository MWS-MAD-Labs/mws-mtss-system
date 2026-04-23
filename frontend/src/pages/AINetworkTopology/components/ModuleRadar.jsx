/* ModuleRadar — left-side panel: module list + live events */

import { memo, useRef, useEffect } from 'react';
import { ECO_NODES } from '../constants/ecosystemTopology';
import { STATUS_PALETTE } from '../constants/theme';
import { formatLatency, timeAgo } from '../utils/helpers';
import gsap from 'gsap';

const ModuleRadar = memo(function ModuleRadar({ nodeStatuses, activeNodes, context, events, onSelect, selectedNode, T, isDark }) {
  const listRef = useRef(null);
  const modules = ECO_NODES.filter(n => n.ring === 1);
  const cores = ECO_NODES.filter(n => n.ring === 0);

  /* GSAP stagger entrance */
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('.eco-radar-item');
    gsap.fromTo(items, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', overflow: 'hidden' }}>
      {/* Context banner */}
      {context?.title && (
        <div style={{
          padding: '8px 10px', borderRadius: 10,
          background: isDark ? 'rgba(34,211,238,0.06)' : 'rgba(34,211,238,0.08)',
          border: `1px solid ${isDark ? 'rgba(34,211,238,0.15)' : 'rgba(34,211,238,0.2)'}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', flexShrink: 0,
            boxShadow: '0 0 8px #22d3ee', animation: 'topo-pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: T.textPrimary, fontSize: 10, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{context.title}</div>
            <div style={{ color: T.textMuted, fontSize: 8 }}>{formatLatency(context.latencyMs)} · {context.rpm} rpm</div>
          </div>
        </div>
      )}

      {/* Core services */}
      <div style={{ padding: '4px 0' }}>
        <div style={{ color: T.textSecondary, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Core Services</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {cores.map(c => {
            const st = nodeStatuses?.[c.id] || 'idle';
            const isActive = activeNodes?.has(c.id);
            return (
              <div key={c.id} onClick={() => onSelect(c.id)} style={{
                padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 8.5, fontWeight: 600,
                background: isActive ? `${c.color}18` : 'transparent',
                border: `1px solid ${isActive ? `${c.color}40` : T.panelBorder}`,
                color: isActive ? c.color : T.textMuted,
                transition: 'all .2s',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_PALETTE[st], display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                {c.short}
              </div>
            );
          })}
        </div>
      </div>

      {/* Module list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ color: T.textSecondary, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Modules</div>
        <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {modules.map(mod => {
            const st = nodeStatuses?.[mod.id] || 'idle';
            const isActive = activeNodes?.has(mod.id);
            const isSel = selectedNode === mod.id;
            return (
              <div key={mod.id} className="eco-radar-item" onClick={() => onSelect(mod.id)} style={{
                padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                background: isSel ? `${mod.color}12` : 'transparent',
                border: `1px solid ${isSel ? `${mod.color}30` : 'transparent'}`,
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all .15s',
              }}>
                <span style={{ fontSize: 14 }}>{mod.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.textPrimary, fontSize: 9.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.label}</div>
                </div>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: STATUS_PALETTE[st], flexShrink: 0,
                  boxShadow: isActive ? `0 0 8px ${STATUS_PALETTE[st]}` : 'none',
                  transition: 'box-shadow .3s',
                }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Live events */}
      {events?.length > 0 && (
        <div style={{ maxHeight: 140, overflow: 'auto' }}>
          <div style={{ color: T.textSecondary, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Live Events</div>
          {events.slice(0, 5).map((ev, i) => (
            <div key={ev.id} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0',
              borderBottom: i < 4 ? `1px solid ${T.panelBorder}` : 'none',
            }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: ev.ok !== false ? '#22d3ee' : '#f87171', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: T.textPrimary, fontSize: 9, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                <div style={{ color: T.textMuted, fontSize: 7.5 }}>{formatLatency(ev.lat)} · {timeAgo(ev.at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ModuleRadar;
