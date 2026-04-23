/* EventLog — bottom-left live activity feed */

import { memo } from 'react';
import { formatLatency, timeAgo } from '../utils/helpers';

export const EventLog = memo(function EventLog({ events, T }) {
  if (!events?.length) return null;
  return (
    <div className="topo-panel" style={{
      position: 'absolute', bottom: 16, left: 16, width: 360, maxHeight: 210,
      overflowY: 'auto', background: T.panelBg,
      border: `1px solid ${T.panelBorder}`, borderRadius: 12,
      padding: '12px 14px', zIndex: 40,
    }}>
      <div style={{ color: T.textSecondary, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 }}>
        Live Activity
      </div>
      {events.slice(0, 5).map((ev, i) => (
        <div key={ev.id || i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 7, padding: '4px 0',
          borderBottom: i < 4 ? `1px solid ${T.panelBorder}` : 'none',
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', marginTop: 5, flexShrink: 0,
            background: ev.ok !== false ? '#22d3ee' : '#f87171',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: T.textPrimary, fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
            <div style={{ color: T.textMuted, fontSize: 9 }}>{formatLatency(ev.latencyMs)} · {ev.source || 'backend'} · {timeAgo(ev.at)}</div>
          </div>
        </div>
      ))}
    </div>
  );
});
