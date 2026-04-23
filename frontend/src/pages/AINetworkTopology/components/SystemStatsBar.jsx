/* SystemStatsBar — top-left stats + data source + AI models */

import { memo } from 'react';
import { NODE_META } from '../constants/nodes';
import { STATUS_PALETTE } from '../constants/theme';
import { formatLatency, formatNumber } from '../utils/helpers';

const AI_MODEL_PANEL_ORDER = [
  { id: 'ai-google-gemini', label: 'Google Gemini Flash' },
  { id: 'ai-openai-gpt', label: 'Arcee AI Trinity' },
  { id: 'ai-anthropic-claude', label: 'StepFun Step 3.5' },
  { id: 'ai-openrouter-api', label: 'OpenRouter API', synthetic: true },
];

function buildModelPanelRows(modelStats) {
  if (!modelStats) return [];

  const trinity = modelStats['ai-openai-gpt'] || null;
  const step35 = modelStats['ai-anthropic-claude'] || null;
  const openRouterSources = [trinity, step35].filter(Boolean);
  const avgSuccess = openRouterSources.length
    ? openRouterSources.reduce((s, m) => s + (m?.successRate ?? 99), 0) / openRouterSources.length
    : 99;
  const openRouterStatus = openRouterSources.some(m => m?.status === 'active')
    ? 'active'
    : openRouterSources.some(m => (m?.rpm ?? 0) > 0 || m?.status === 'warm')
      ? 'warm'
      : 'idle';

  const syntheticMap = {
    'ai-openrouter-api': {
      rpm: openRouterSources.reduce((s, m) => s + (m?.rpm ?? 0), 0),
      successRate: avgSuccess,
      status: openRouterStatus,
    },
  };

  return AI_MODEL_PANEL_ORDER.map((row) => {
    const stats = row.synthetic ? syntheticMap[row.id] : modelStats[row.id];
    return {
      id: row.id,
      label: row.label,
      stats: stats || { rpm: 0, successRate: 99, status: 'idle' },
    };
  });
}

export const SystemStatsBar = memo(function SystemStatsBar({ stats, modelStats, viewers, dataSource, T }) {
  const modelRows = buildModelPanelRows(modelStats);

  return (
    <div style={{
      position: 'absolute', top: 56, left: 16, zIndex: 40,
      display: 'flex', flexDirection: 'column', gap: 6, width: 236,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 8,
        background: dataSource === 'live' ? 'rgba(16,185,129,0.10)' : 'rgba(251,191,36,0.10)',
        border: `1px solid ${dataSource === 'live' ? '#10b98130' : '#fbbf2430'}`,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: dataSource === 'live' ? '#10b981' : '#fbbf24',
          boxShadow: `0 0 6px ${dataSource === 'live' ? '#10b981' : '#fbbf24'}`,
        }} />
        <span style={{ color: dataSource === 'live' ? '#10b981' : '#fbbf24', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {dataSource === 'live' ? 'Live Telemetry' : 'Simulator'}
        </span>
        {viewers > 0 && <span style={{ color: T.textMuted, fontSize: 8.5, marginLeft: 'auto' }}>{viewers} viewer{viewers !== 1 ? 's' : ''}</span>}
      </div>

      <div className="topo-panel" style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10,
        padding: '10px 12px',
      }}>
        {[
          { label: 'Health', value: `${(stats?.healthScore ?? 99.1).toFixed(1)}%`, color: '#22d3ee' },
          { label: 'Requests', value: formatNumber(stats?.totalRequests ?? 0), color: '#a78bfa' },
          { label: 'Latency', value: formatLatency(stats?.liveLatencyMs ?? 0), color: '#34d399' },
          { label: 'Tokens/m', value: formatNumber(stats?.tokensPerMin ?? 0), color: '#fbbf24' },
          { label: 'Wires', value: stats?.activeWires ?? 0, color: '#f472b6' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: T.textMuted, fontSize: 9.5 }}>{s.label}</span>
            <span style={{ color: s.color, fontSize: 10.5, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {modelRows.length > 0 && (
        <div className="topo-panel" style={{
          display: 'flex', flexDirection: 'column', gap: 3,
          background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10,
          padding: '10px 12px',
        }}>
          <div style={{ color: T.textSecondary, fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>AI Models</div>
          {modelRows.map(({ id, label, stats: ms }) => {
            const meta = NODE_META[id];
            const statusColor = STATUS_PALETTE[ms?.status || 'idle'];
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0' }} title={label}>
                <span style={{
                  width: 4, height: 4, borderRadius: '50%', background: statusColor, flexShrink: 0,
                  boxShadow: `0 0 6px ${statusColor}55`,
                }} />
                <span style={{
                  color: T.textPrimary, fontSize: 9.25, fontWeight: 600, flex: 1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {label || meta?.label || meta?.short || id}
                </span>
                <span style={{ color: T.textMuted, fontSize: 8.15, fontFamily: 'monospace', flexShrink: 0 }}>
                  {ms?.rpm ?? 0}r · {(ms?.successRate ?? 99).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
