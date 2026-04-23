/* NeuralModelFabricPanel — neural + ML visualization side rail (presentation-grade, lightweight) */

import { memo, useMemo } from 'react';
import { NODE_META } from '../constants/nodes';
import { STATUS_PALETTE } from '../constants/theme';
import { formatLatency } from '../utils/helpers';

const MODEL_DEFS = [
  {
    id: 'ai-google-gemini',
    title: 'Google Gemini Flash',
    short: 'Gemini',
    role: 'Multimodal emotion analysis + insight generation',
    architecture: 'Vision + Text Transformer',
    process: ['Face signal', 'Emotion parse', 'Insight synth'],
    tags: ['Check-in', 'Teacher Insights'],
    variant: 'vision',
    routeHint: 'Student AI Check-in / Teacher Insights',
    metricColor: '#67e8f9',
  },
  {
    id: 'ai-openai-gpt',
    title: 'Arcee AI Trinity',
    short: 'Trinity',
    role: 'Student assistant conversational reasoning',
    architecture: 'Chat Inference + Context Memory',
    process: ['Context build', 'Route tooling', 'Response stream'],
    tags: ['Student AI Chat', 'Assistant Ops'],
    variant: 'chat',
    routeHint: 'Student AI Chat',
    metricColor: '#93c5fd',
  },
  {
    id: 'ai-anthropic-claude',
    title: 'StepFun Step 3.5',
    short: 'Step 3.5',
    role: 'Staff assistant drafting + operational help',
    architecture: 'Fast Decoder Transformer',
    process: ['Prompt refine', 'Draft infer', 'Action response'],
    tags: ['Staff Support', 'Operations'],
    variant: 'ops',
    routeHint: 'Staff / Head Unit AI Assist',
    metricColor: '#a7f3d0',
  },
  {
    id: 'ai-openrouter-api',
    title: 'OpenRouter API',
    short: 'OpenRouter',
    role: 'Model routing, provider abstraction, failover',
    architecture: 'Router Mesh + Provider Bridge',
    process: ['Route select', 'Provider bridge', 'Telemetry return'],
    tags: ['Trinity Route', 'Step Route'],
    variant: 'router',
    routeHint: 'Gateway for Trinity + Step 3.5',
    metricColor: '#fcd34d',
    synthetic: true,
  },
];

function buildModelRows(modelStats) {
  const stats = modelStats || {};
  const trinity = stats['ai-openai-gpt'] || {};
  const step35 = stats['ai-anthropic-claude'] || {};
  const sources = [trinity, step35].filter(Boolean);

  const openRouter = {
    rpm: sources.reduce((sum, item) => sum + (item?.rpm ?? 0), 0),
    latencyMs: sources.length
      ? Math.round(sources.reduce((sum, item) => sum + (item?.latencyMs ?? 0), 0) / sources.length)
      : 0,
    successRate: sources.length
      ? sources.reduce((sum, item) => sum + (item?.successRate ?? 99), 0) / sources.length
      : 99,
    status: sources.some((item) => item?.status === 'active')
      ? 'active'
      : sources.some((item) => item?.status === 'warm' || (item?.rpm ?? 0) > 0)
        ? 'warm'
        : 'idle',
  };

  return MODEL_DEFS.map((def) => ({
    ...def,
    stats: def.synthetic ? openRouter : (stats[def.id] || {}),
  }));
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function getModelVisualEnergy(row, state, focused = false) {
  const rpm = row.stats?.rpm ?? 0;
  const latency = row.stats?.latencyMs ?? 0;
  const success = row.stats?.successRate ?? 99;

  const base = row.synthetic ? 0.28 : 0.22;
  const rpmFactor = clamp01(rpm / (row.synthetic ? 18 : 10)) * 0.38;
  const latencyFactor = latency > 0 ? clamp01(1 - (latency / 1400)) * 0.16 : 0.06;
  const successFactor = clamp01((success - 95) / 5) * 0.08;
  const statusBoost = state === 'active' ? 0.30 : state === 'warm' ? 0.16 : 0;
  const focusBoost = focused ? 0.18 : 0;

  return clamp01(base + rpmFactor + latencyFactor + successFactor + statusBoost + focusBoost);
}

function MiniMetric({ label, value, color, T }) {
  return (
    <div style={{
      borderRadius: 8,
      padding: '4px 7px',
      border: `1px solid ${T.panelBorder}`,
      background: 'rgba(255,255,255,0.02)',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
    }}>
      <span style={{ color: T.textMuted, fontSize: 8.1, letterSpacing: 0.45 }}>{label}</span>
      <span style={{ color, fontSize: 9.4, fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
    </div>
  );
}

function setNeuralCardPointer(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  el.style.setProperty('--mx', `${Math.max(0, Math.min(100, x))}%`);
  el.style.setProperty('--my', `${Math.max(0, Math.min(100, y))}%`);
}

function clearNeuralCardPointer(e) {
  const el = e.currentTarget;
  el.style.setProperty('--mx', '50%');
  el.style.setProperty('--my', '50%');
}

function StatChip({ label, value, color, T, truncate }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      borderRadius: 999,
      padding: '4px 8px',
      border: `1px solid ${color}2E`,
      background: `${color}10`,
      minWidth: 0,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
      <span style={{ color: T.textMuted, fontSize: 7.9, fontWeight: 700, letterSpacing: 0.6 }}>{label}</span>
      <span style={{
        color,
        fontSize: 8.5,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: truncate ? 118 : undefined,
      }}>
        {value}
      </span>
    </div>
  );
}

function SignalBars({ active, warm, color, T, intensity = 0.35 }) {
  const visual = clamp01(intensity);
  const speed = active ? 1.05 : warm ? 1.7 : 2.4 - visual * 0.8;
  return (
    <div style={{
      borderRadius: 9,
      border: `1px solid ${T.panelBorder}`,
      background: 'rgba(255,255,255,0.02)',
      padding: '6px 8px',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center',
      gap: 8,
    }}>
      <span style={{ color: T.textMuted, fontSize: 7.9, letterSpacing: 0.55, textTransform: 'uppercase', fontWeight: 700 }}>
        Comms
      </span>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3.5, height: 14, minWidth: 0 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={`bar-${i}`}
            style={{
              width: 3,
              height: 12,
              borderRadius: 999,
              background: color,
              opacity: 0.16 + visual * 0.46,
              boxShadow: visual > 0.55 ? `0 0 8px ${color}` : 'none',
              transformOrigin: 'center bottom',
              animationName: 'neural-signal-bar',
              animationDuration: `${speed}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: `${i * 0.07}s`,
              animationPlayState: 'running',
            }}
          />
        ))}
      </div>
      <span style={{ color, fontSize: 8.25, fontWeight: 700, fontFamily: 'monospace' }}>
        {active ? 'flowing' : warm ? 'sync' : visual > 0.35 ? 'listening' : 'idle'}
      </span>
    </div>
  );
}

function NeuralMiniMap({ idBase, color, active, warm, variant, intensity = 0.35, focused = false }) {
  const visual = clamp01(intensity);
  const activeLike = active || focused || visual > 0.72;
  const warmLike = warm || visual > 0.42;
  const lineOpacity = 0.08 + visual * 0.46;
  const pulseOpacity = 0.14 + visual * 0.78;
  const nodeOpacity = 0.26 + visual * 0.74;
  const canAnimate = visual > 0.12;
  const pulseSpeed = activeLike ? 1.1 : warmLike ? 1.8 : 2.7 - visual * 0.8;
  const sweepSpeed = activeLike ? 2.1 : warmLike ? 3.2 : 4.1 - visual * 0.7;
  const packetSpeedA = activeLike ? 1.35 : warmLike ? 2.2 : 3.0 - visual * 0.6;
  const packetSpeedB = activeLike ? 1.8 : warmLike ? 2.8 : 3.5 - visual * 0.5;

  const nodes = variant === 'router'
    ? [
      { x: 14, y: 28 }, { x: 38, y: 14 }, { x: 38, y: 42 },
      { x: 70, y: 12 }, { x: 70, y: 28 }, { x: 70, y: 44 },
      { x: 102, y: 18 }, { x: 102, y: 38 }, { x: 134, y: 28 },
    ]
    : variant === 'vision'
      ? [
        { x: 14, y: 12 }, { x: 14, y: 28 }, { x: 14, y: 44 },
        { x: 44, y: 18 }, { x: 44, y: 38 },
        { x: 78, y: 14 }, { x: 78, y: 28 }, { x: 78, y: 42 },
        { x: 112, y: 18 }, { x: 112, y: 38 }, { x: 142, y: 28 },
      ]
      : [
        { x: 14, y: 16 }, { x: 14, y: 40 },
        { x: 42, y: 12 }, { x: 42, y: 28 }, { x: 42, y: 44 },
        { x: 76, y: 10 }, { x: 76, y: 28 }, { x: 76, y: 46 },
        { x: 110, y: 14 }, { x: 110, y: 38 }, { x: 142, y: 28 },
      ];

  const edges = variant === 'router'
    ? [[0, 1], [0, 2], [1, 4], [2, 4], [1, 3], [2, 5], [3, 6], [4, 6], [4, 7], [5, 7], [6, 8], [7, 8]]
    : [[0, 3], [1, 3], [1, 4], [2, 4], [3, 5], [3, 6], [4, 6], [4, 7], [5, 8], [6, 8], [6, 9], [7, 9], [8, 10], [9, 10]];

  const animatedEdgeIdx = new Set(edges.map((_, i) => i).filter((i) => i % 3 === 0 || i === edges.length - 1));

  return (
    <svg
      className="neural-mini-map"
      viewBox="0 0 156 56"
      width="100%"
      height="56"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <defs>
        <filter id={`${idBase}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.35" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id={`${idBase}-halo`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity={0.04 + visual * 0.18} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${idBase}-sweep`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity={(0.05 + visual * 0.24).toFixed(3)} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="1" y="1" width="154" height="54" rx="10" fill={`url(#${idBase}-halo)`} />
      {canAnimate && (
        <rect x="-50" y="1" width="46" height="54" rx="10" fill={`url(#${idBase}-sweep)`} opacity={0.42 + visual * 0.58}>
          <animate attributeName="x" values="-54;164" dur={`${sweepSpeed}s`} repeatCount="indefinite" />
        </rect>
      )}
      <g stroke="rgba(255,255,255,0.06)" strokeWidth="0.45" opacity="0.35">
        <line x1="12" y1="10" x2="144" y2="10" />
        <line x1="12" y1="28" x2="144" y2="28" />
        <line x1="12" y1="46" x2="144" y2="46" />
      </g>

      {edges.map(([a, b], i) => {
        const p1 = nodes[a];
        const p2 = nodes[b];
        const d = `M ${p1.x} ${p1.y} Q ${(p1.x + p2.x) / 2} ${(p1.y + p2.y) / 2 + (i % 2 ? -3 : 3)} ${p2.x} ${p2.y}`;
        return (
          <g key={`${a}-${b}-${i}`}>
            <path d={d} fill="none" stroke={color} strokeWidth="0.8" strokeOpacity={lineOpacity} strokeLinecap="round" />
            {canAnimate && animatedEdgeIdx.has(i) && (
              <>
                <path d={d} fill="none" stroke={color} strokeWidth={1.0 + visual * 0.75} strokeOpacity={0.11 + visual * 0.34} strokeLinecap="round" strokeDasharray="2 10" filter={visual > 0.45 ? `url(#${idBase}-glow)` : undefined}>
                  <animate attributeName="stroke-dashoffset" from="0" to="-38" dur={`${pulseSpeed}s`} repeatCount="indefinite" begin={`${(i % 4) * 0.1}s`} />
                </path>
                <circle r={1.2 + visual * 0.65} fill={color} opacity={0.35 + visual * 0.62} filter={visual > 0.55 ? `url(#${idBase}-glow)` : undefined}>
                  <animateMotion dur={`${packetSpeedA}s`} repeatCount="indefinite" path={d} begin={`${(i % 5) * 0.12}s`} />
                </circle>
                {(i % 2 === 0) && (
                  <circle r={1.0 + visual * 0.45} fill={color} opacity={0.2 + visual * 0.55}>
                    <animateMotion
                      dur={`${packetSpeedB}s`}
                      repeatCount="indefinite"
                      path={d}
                      keyPoints="1;0"
                      keyTimes="0;1"
                      calcMode="linear"
                      begin={`${0.22 + (i % 4) * 0.09}s`}
                    />
                    <animate attributeName="opacity" values={`${0.12 + visual * 0.16};${0.32 + visual * 0.58};${0.12 + visual * 0.16}`} dur={`${packetSpeedB}s`} repeatCount="indefinite" />
                  </circle>
                )}
              </>
            )}
          </g>
        );
      })}

      {nodes.map((n, i) => (
        <g key={`${n.x}-${n.y}-${i}`}>
          {canAnimate && (i % 3 === 0) && (
            <circle cx={n.x} cy={n.y} r={4.1 + visual * 1.1} fill="none" stroke={color} strokeWidth="0.7" strokeOpacity={pulseOpacity * 0.30}>
              <animate attributeName="r" values={`${3.2 + visual * 0.8};${5.1 + visual * 1.6};${3.2 + visual * 0.8}`} dur={`${1.9 + (1 - visual) * 1.2}s`} repeatCount="indefinite" begin={`${(i % 4) * 0.14}s`} />
              <animate attributeName="stroke-opacity" values={`${pulseOpacity * 0.30};${pulseOpacity * 0.07};${pulseOpacity * 0.30}`} dur={`${1.9 + (1 - visual) * 1.2}s`} repeatCount="indefinite" begin={`${(i % 4) * 0.14}s`} />
            </circle>
          )}
          <circle cx={n.x} cy={n.y} r={i === nodes.length - 1 ? 2.35 + visual * 0.9 : 1.85 + visual * 0.55} fill={color} opacity={nodeOpacity} filter={visual > 0.55 ? `url(#${idBase}-glow)` : undefined}>
            {canAnimate && (
              <>
                <animate attributeName="opacity" values={`${0.24 + visual * 0.28};${0.46 + visual * 0.54};${0.24 + visual * 0.28}`} dur={`${1.8 + (1 - visual) * 0.9 + (i % 4) * 0.14}s`} repeatCount="indefinite" begin={`${(i % 6) * 0.08}s`} />
                <animate attributeName="r" values={`${i === nodes.length - 1 ? 2.2 + visual * 0.75 : 1.75 + visual * 0.45};${i === nodes.length - 1 ? 2.7 + visual * 0.95 : 2.05 + visual * 0.65};${i === nodes.length - 1 ? 2.2 + visual * 0.75 : 1.75 + visual * 0.45}`} dur={`${2 + (1 - visual) * 1.1 + (i % 5) * 0.15}s`} repeatCount="indefinite" begin={`${(i % 5) * 0.09}s`} />
              </>
            )}
          </circle>
        </g>
      ))}

      {canAnimate && (
        <>
          <path d="M 8 53 L 148 53" stroke={color} strokeOpacity={0.08 + visual * 0.18} strokeWidth="1" strokeLinecap="round" />
          <path d="M 8 52.5 C 42 44, 64 58, 90 52.5 S 132 45, 148 52.5" fill="none" stroke={color} strokeOpacity={0.05 + visual * 0.18} strokeWidth="0.8" strokeDasharray="2 8">
            <animate attributeName="stroke-dashoffset" from="0" to="-34" dur={`${1.4 + (1 - visual) * 1.8}s`} repeatCount="indefinite" />
          </path>
        </>
      )}
    </svg>
  );
}

function NeuralFabricLiveMap({ rows, nodeStatuses, activeNodeSet, hoveredNode, selectedNode, T }) {
  const idBase = 'neural-live-overview';
  const hub = { x: 82, y: 62, id: 'hub-core', label: 'Hub' };
  const points = [
    { id: 'ai-google-gemini', x: 42, y: 24, label: 'Gemini', color: '#67e8f9' },
    { id: 'ai-openai-gpt', x: 122, y: 24, label: 'Trinity', color: '#93c5fd' },
    { id: 'ai-anthropic-claude', x: 42, y: 100, label: 'Step 3.5', color: '#a7f3d0' },
    { id: 'ai-openrouter-api', x: 122, y: 100, label: 'OpenRouter', color: '#fcd34d', synthetic: true },
  ];

  const statusMap = Object.fromEntries(rows.map((r) => {
    const status = r.synthetic ? (r.stats?.status || 'idle') : (nodeStatuses?.[r.id] || r.stats?.status || 'idle');
    return [r.id, status];
  }));
  const energyMap = Object.fromEntries(rows.map((r) => {
    const status = statusMap[r.id] || 'idle';
    const focused = hoveredNode === r.id || selectedNode === r.id;
    return [r.id, getModelVisualEnergy(r, status, focused)];
  }));

  const openRouterLinkActive = ['ai-openai-gpt', 'ai-anthropic-claude'].some((id) => {
    const st = statusMap[id];
    return activeNodeSet.has(id) || st === 'active' || st === 'warm' || (energyMap[id] ?? 0) > 0.4;
  }) || hoveredNode === 'ai-openrouter-api';

  const edges = [
    ['hub-core', 'ai-google-gemini'],
    ['hub-core', 'ai-openai-gpt'],
    ['hub-core', 'ai-anthropic-claude'],
    ['hub-core', 'ai-openrouter-api'],
    ['ai-openrouter-api', 'ai-openai-gpt'],
    ['ai-openrouter-api', 'ai-anthropic-claude'],
    ['ai-google-gemini', 'ai-openai-gpt'],
  ];

  const pointById = Object.fromEntries([hub, ...points].map((p) => [p.id, p]));

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${T.panelBorder}`,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012))',
      padding: 10,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div>
          <div style={{ color: T.textSecondary, fontSize: 8.6, fontWeight: 700, letterSpacing: 0.9, textTransform: 'uppercase' }}>Live Neural Mesh</div>
          <div style={{ color: T.textPrimary, fontSize: 11.2, fontWeight: 700 }}>Inference Coordination Map</div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 7px', borderRadius: 999,
          border: '1px solid rgba(34,211,238,0.22)', background: 'rgba(34,211,238,0.08)',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }} />
          <span style={{ color: '#67e8f9', fontSize: 8.1, fontWeight: 700, letterSpacing: 0.55 }}>REAL-TIME</span>
        </div>
      </div>

      <svg viewBox="0 0 164 124" width="100%" height="124" aria-hidden="true" style={{ display: 'block' }}>
        <defs>
          <filter id={`${idBase}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id={`${idBase}-bgA`} cx="18%" cy="10%" r="65%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${idBase}-bgB`} cx="82%" cy="14%" r="70%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="1" y="1" width="162" height="122" rx="12" fill={`url(#${idBase}-bgA)`} />
        <rect x="1" y="1" width="162" height="122" rx="12" fill={`url(#${idBase}-bgB)`} />
        <g stroke="rgba(255,255,255,0.05)" strokeWidth="0.55">
          <circle cx="82" cy="62" r="44" fill="none" />
          <circle cx="82" cy="62" r="30" fill="none" strokeDasharray="2 7" />
          <line x1="12" y1="62" x2="152" y2="62" />
          <line x1="82" y1="10" x2="82" y2="114" />
        </g>

        {edges.map(([fromId, toId], i) => {
          const p1 = pointById[fromId];
          const p2 = pointById[toId];
          if (!p1 || !p2) return null;
          const color = p2.color || p1.color || '#a78bfa';
          const stFrom = statusMap[fromId] || (fromId === 'hub-core' ? 'active' : 'idle');
          const stTo = statusMap[toId] || 'idle';
          const eFrom = fromId === 'hub-core' ? 0.7 : (energyMap[fromId] ?? 0.2);
          const eTo = energyMap[toId] ?? 0.2;
          const edgeEnergy = clamp01(((eFrom + eTo) / 2) + (hoveredNode === toId || selectedNode === toId ? 0.18 : 0));
          const edgeActive = fromId === 'hub-core'
            ? activeNodeSet.has(toId) || stTo === 'active' || hoveredNode === toId || selectedNode === toId || edgeEnergy > 0.34
            : (fromId === 'ai-openrouter-api' || toId === 'ai-openrouter-api')
              ? openRouterLinkActive || edgeEnergy > 0.38
              : [stFrom, stTo].includes('active') || edgeEnergy > 0.48;
          const edgeAnimate = edgeEnergy > 0.18;
          const edgeStrokeOpacity = 0.07 + edgeEnergy * 0.32;
          const edgeStrokeWidth = 0.65 + edgeEnergy * 1.1;
          const dashSpeed = 2.6 - edgeEnergy * 1.15 + (i % 3) * 0.18;
          const packetSpeed = 3.0 - edgeEnergy * 1.45 + (i % 2) * 0.16;

          const d = `M ${p1.x} ${p1.y} Q ${(p1.x + p2.x) / 2} ${(p1.y + p2.y) / 2 + (i % 2 ? -7 : 7)} ${p2.x} ${p2.y}`;
          return (
            <g key={`${fromId}-${toId}`}>
              <path d={d} fill="none" stroke={color} strokeOpacity={edgeStrokeOpacity} strokeWidth={edgeStrokeWidth} strokeLinecap="round" filter={edgeEnergy > 0.52 ? `url(#${idBase}-glow)` : undefined} />
              {edgeAnimate && (
                <>
                  <path d={d} fill="none" stroke={color} strokeOpacity={0.08 + edgeEnergy * 0.42} strokeWidth={1 + edgeEnergy * 1.1} strokeDasharray={edgeActive ? '3 12' : '2 16'} strokeLinecap="round">
                    <animate attributeName="stroke-dashoffset" from="0" to="-46" dur={`${Math.max(1.05, dashSpeed)}s`} repeatCount="indefinite" />
                  </path>
                  <circle r={1.1 + edgeEnergy * 1.25} fill={color} opacity={0.3 + edgeEnergy * 0.65} filter={edgeEnergy > 0.5 ? `url(#${idBase}-glow)` : undefined}>
                    <animateMotion dur={`${Math.max(1.2, packetSpeed)}s`} repeatCount="indefinite" path={d} begin={`${(i % 4) * 0.11}s`} />
                  </circle>
                  {(edgeEnergy > 0.34) && (
                    <circle r={0.95 + edgeEnergy * 0.7} fill={color} opacity={0.16 + edgeEnergy * 0.46}>
                      <animateMotion dur={`${Math.max(1.5, packetSpeed + 0.55)}s`} repeatCount="indefinite" path={d} keyPoints="1;0" keyTimes="0;1" calcMode="linear" begin={`${0.18 + (i % 3) * 0.09}s`} />
                    </circle>
                  )}
                </>
              )}
            </g>
          );
        })}

        <g>
          <circle cx={hub.x} cy={hub.y} r="12" fill="rgba(124,58,237,0.12)" stroke="#a78bfa" strokeOpacity="0.66" strokeWidth="1.4" filter={`url(#${idBase}-glow)`} />
          <circle cx={hub.x} cy={hub.y} r="17" fill="none" stroke="#a78bfa" strokeOpacity="0.18" strokeWidth="0.9" strokeDasharray="3 8">
            <animate attributeName="stroke-dashoffset" from="0" to="36" dur="5.8s" repeatCount="indefinite" />
          </circle>
          <text x={hub.x} y={hub.y - 1} textAnchor="middle" fill="#ddd6fe" fontSize="8.8" fontWeight="700" fontFamily="Inter,system-ui">HUB</text>
          <text x={hub.x} y={hub.y + 8} textAnchor="middle" fill="#a78bfa" fontSize="6.1" letterSpacing="0.6" fontFamily="Inter,system-ui" opacity="0.8">LATENT</text>
        </g>

        {points.map((p) => {
          const st = statusMap[p.id] || 'idle';
          const energy = energyMap[p.id] ?? 0.2;
          const active = p.synthetic ? (openRouterLinkActive || st === 'active' || energy > 0.68) : (activeNodeSet.has(p.id) || st === 'active' || energy > 0.72);
          const warm = !active && (st === 'warm' || energy > 0.4);
          const focused = hoveredNode === p.id || selectedNode === p.id;
          const radius = p.synthetic ? 9.4 : 8.4;
          return (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r={radius + (focused ? 6 : 4)} fill="none" stroke={p.color} strokeWidth="0.85" strokeOpacity={0.08 + energy * 0.3 + (focused ? 0.12 : 0)}>
                <animate attributeName="r" values={`${radius + 3};${radius + 4.5 + energy * 2.2};${radius + 3}`} dur={`${active ? 1.9 : warm ? 2.5 : 3.1}s`} repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values={`${0.06 + energy * 0.15};${0.16 + energy * 0.34};${0.06 + energy * 0.15}`} dur={`${active ? 1.9 : warm ? 2.5 : 3.1}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={p.x} cy={p.y} r={radius} fill={`${p.color}14`} stroke={p.color} strokeWidth={focused ? 1.6 : 1.1} strokeOpacity={0.35 + energy * 0.6} filter={energy > 0.52 ? `url(#${idBase}-glow)` : undefined}>
                <animate attributeName="r" values={`${radius - 0.15};${radius + energy * 0.45};${radius - 0.15}`} dur={`${2.1 + (1 - energy) * 1.2}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={p.x + radius - 1.5} cy={p.y - radius + 1.5} r="1.9" fill={STATUS_PALETTE[st] || STATUS_PALETTE.idle} stroke="#0f172a" strokeWidth="0.8" />
              <text x={p.x} y={p.y + 2} textAnchor="middle" fill={p.color} fontSize={p.synthetic ? '5.8' : '6.1'} fontWeight="700" letterSpacing="0.4" fontFamily="Inter,system-ui">{p.short || p.label.split(' ')[0].toUpperCase()}</text>
              <text x={p.x} y={p.y + radius + 8} textAnchor="middle" fill={T.textMuted} fontSize="5.7" fontFamily="Inter,system-ui" opacity="0.9">{p.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default memo(function NeuralModelFabricPanel({
  modelStats,
  events,
  context,
  activeNodes,
  nodeStatuses,
  hoveredNode,
  selectedNode,
  onHoverModel,
  onLeaveModel,
  onClickModel,
  dataSource,
  T,
}) {
  const rows = useMemo(() => buildModelRows(modelStats), [modelStats]);
  const activeNodeSet = useMemo(() => new Set(activeNodes || []), [activeNodes]);

  const aggregate = useMemo(() => {
    const totalRpm = rows.reduce((sum, row) => sum + (row.stats?.rpm ?? 0), 0);
    const activeCount = rows.filter((row) => {
      const state = row.synthetic ? row.stats?.status : nodeStatuses?.[row.id];
      return (state || row.stats?.status || 'idle') !== 'idle' || (row.stats?.rpm ?? 0) > 0;
    }).length;
    const latencyRows = rows.filter((row) => (row.stats?.latencyMs ?? 0) > 0);
    const avgLatency = latencyRows.length
      ? Math.round(latencyRows.reduce((sum, row) => sum + (row.stats?.latencyMs ?? 0), 0) / latencyRows.length)
      : 0;
    return { totalRpm, activeCount, avgLatency };
  }, [rows, nodeStatuses]);

  const currentSignal = context?.title || events?.[0]?.title || 'Neural inference standby';
  const currentLatency = context?.latencyMs ?? events?.[0]?.latencyMs ?? aggregate.avgLatency;

  return (
    <div className="topo-panel neural-fabric-panel" style={{
      width: '100%',
      borderRadius: 16,
      border: `1px solid ${T.panelBorder}`,
      background: T.panelBg,
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      maxHeight: 'calc(100vh - 134px)',
      overflowY: 'auto',
      animation: 'topo-fadeIn .35s ease-out',
    }}>
      <div style={{
        borderRadius: 12,
        border: `1px solid ${T.panelBorder}`,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.014))',
        padding: '10px 11px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div>
          <div style={{ color: T.textSecondary, fontSize: 8.7, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            Neural AI Fabric
          </div>
          <div style={{ color: T.textPrimary, fontSize: 14.2, fontWeight: 800, lineHeight: 1.18, marginTop: 2 }}>
            Topology + ML Model Inference Layer
          </div>

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <StatChip label={dataSource === 'live' ? 'LIVE' : 'SIM'} value={currentSignal} color={dataSource === 'live' ? '#22d3ee' : '#fbbf24'} T={T} truncate />
          <StatChip label="LATENCY" value={formatLatency(currentLatency)} color="#6ee7b7" T={T} />
          <StatChip label="ACTIVE" value={`${aggregate.activeCount}/4 models`} color="#a78bfa" T={T} />
          <StatChip label="RPM" value={`${aggregate.totalRpm}r total`} color="#fcd34d" T={T} />
        </div>

        <NeuralFabricLiveMap
          rows={rows}
          nodeStatuses={nodeStatuses}
          activeNodeSet={activeNodeSet}
          hoveredNode={hoveredNode}
          selectedNode={selectedNode}
          T={T}
        />
      </div>

      <div style={{ color: T.textSecondary, fontSize: 8.7, fontWeight: 700, letterSpacing: 0.95, textTransform: 'uppercase', padding: '0 2px' }}>
        AI Model Machine Learning Visualized
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
        {rows.map((row, idx) => {
          const nodeMeta = NODE_META[row.id];
          const state = row.synthetic ? (row.stats?.status || 'idle') : (nodeStatuses?.[row.id] || row.stats?.status || 'idle');
          const statusColor = STATUS_PALETTE[state] || STATUS_PALETTE.idle;
          const isHovered = hoveredNode === row.id;
          const isSelected = selectedNode === row.id;
          const canFocusTopologyNode = !row.synthetic && !!nodeMeta;
          const visualEnergy = getModelVisualEnergy(row, state, isHovered || isSelected);
          const isActive = (row.synthetic ? state === 'active' : activeNodeSet.has(row.id) || state === 'active') || visualEnergy > 0.72;
          const isWarm = !isActive && (state === 'warm' || visualEnergy > 0.42);

          return (
            <button
              key={row.id}
              type="button"
              onMouseEnter={() => onHoverModel?.(row.id)}
              onMouseMove={setNeuralCardPointer}
              onMouseLeave={() => onLeaveModel?.()}
              onPointerLeave={clearNeuralCardPointer}
              onClick={() => canFocusTopologyNode && onClickModel?.(row.id)}
              className="neural-fabric-card"
              title={canFocusTopologyNode ? `Highlight ${row.title} in topology` : row.routeHint}
              style={{
                position: 'relative',
                textAlign: 'left',
                borderRadius: 12,
                border: `1px solid ${isHovered || isSelected ? `${statusColor}50` : T.panelBorder}`,
                background: isHovered || isSelected
                  ? `linear-gradient(180deg, ${statusColor}11, rgba(255,255,255,0.015))`
                  : 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
                padding: 9,
                cursor: canFocusTopologyNode ? 'pointer' : 'default',
                transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1), border-color 220ms ease, box-shadow 220ms ease, background 220ms ease',
                transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
                boxShadow: isHovered || isSelected
                  ? `0 10px 22px ${statusColor}14, inset 0 1px 0 rgba(255,255,255,0.06)`
                  : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
              }}
            >
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.8,
                background: 'radial-gradient(180px 70px at 10% -4%, rgba(255,255,255,0.04), transparent 78%), radial-gradient(170px 80px at 100% -6%, rgba(167,139,250,0.06), transparent 74%)',
              }} />

              <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8, alignItems: 'start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', background: statusColor,
                      boxShadow: `0 0 8px ${statusColor}`,
                      animation: isActive ? 'topo-pulse 1.3s ease-in-out infinite' : undefined,
                      flexShrink: 0,
                    }} />
                    <span style={{ color: T.textPrimary, fontSize: 11.2, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.title}
                    </span>
                  </div>
                  <div style={{ color: T.textMuted, fontSize: 8.9, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.architecture}
                  </div>
                </div>
                <span style={{
                  padding: '2px 6px', borderRadius: 999,
                  border: `1px solid ${statusColor}2A`, background: `${statusColor}10`, color: statusColor,
                  fontSize: 8, fontWeight: 700, letterSpacing: 0.55, textTransform: 'uppercase',
                  alignSelf: 'center',
                }}>{state}</span>
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <NeuralMiniMap
                  idBase={`neural-model-${idx}`}
                  color={row.metricColor}
                  active={isActive}
                  warm={isWarm}
                  variant={row.variant}
                  intensity={visualEnergy}
                  focused={isHovered || isSelected}
                />
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <SignalBars active={isActive} warm={isWarm} color={row.metricColor} T={T} intensity={visualEnergy} />
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 6 }}>
                <MiniMetric label="RPM" value={`${row.stats?.rpm ?? 0}r`} color={row.metricColor} T={T} />
                <MiniMetric label="Latency" value={formatLatency(row.stats?.latencyMs ?? 0)} color="#6ee7b7" T={T} />
                <MiniMetric label="Success" value={`${(row.stats?.successRate ?? 99).toFixed(0)}%`} color="#fcd34d" T={T} />
              </div>

              <div style={{ position: 'relative', zIndex: 1, color: T.textSecondary, fontSize: 9.2, lineHeight: 1.35 }}>
                {row.role}
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                  <span style={{ color: T.textMuted, fontSize: 8.1, letterSpacing: 0.45 }}>Flow</span>
                  <span style={{
                    color: T.textMuted, fontSize: 8.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {row.process.join(' → ')}
                  </span>
                </div>
                <span style={{
                  flexShrink: 0,
                  padding: '2px 6px',
                  borderRadius: 999,
                  border: `1px solid ${row.metricColor}20`,
                  background: `${row.metricColor}0A`,
                  color: row.metricColor,
                  fontSize: 7.8,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}>
                  {isActive ? 'communicating' : isWarm ? 'warming' : visualEnergy > 0.34 ? 'listening' : 'standby'}
                </span>
              </div>

              <div style={{ position: 'relative', zIndex: 1, minWidth: 0 }}>
                <svg viewBox="0 0 300 20" width="100%" height="20" aria-hidden="true" style={{ display: 'block' }}>
                  <defs>
                    <linearGradient id={`flow-strip-${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={row.metricColor} stopOpacity="0" />
                      <stop offset="50%" stopColor={row.metricColor} stopOpacity={(0.08 + visualEnergy * 0.55).toFixed(3)} />
                      <stop offset="100%" stopColor={row.metricColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M 0 10 C 40 3, 80 17, 120 10 S 200 3, 240 10 S 280 17, 300 10" fill="none" stroke={row.metricColor} strokeOpacity={0.05 + visualEnergy * 0.22} strokeWidth="1" />
                  <path d="M 0 10 C 40 3, 80 17, 120 10 S 200 3, 240 10 S 280 17, 300 10" fill="none" stroke={`url(#flow-strip-${idx})`} strokeWidth={(1.05 + visualEnergy * 1.05).toFixed(2)} strokeLinecap="round">
                    <animate attributeName="stroke-dasharray" values={`${14 + Math.round(visualEnergy * 28)} ${286 - Math.round(visualEnergy * 28)};${22 + Math.round(visualEnergy * 46)} ${278 - Math.round(visualEnergy * 46)};${14 + Math.round(visualEnergy * 28)} ${286 - Math.round(visualEnergy * 28)}`} dur={`${2.9 - visualEnergy * 1.5}s`} repeatCount="indefinite" />
                    <animate attributeName="stroke-dashoffset" from="0" to="-74" dur={`${2.8 - visualEnergy * 1.45}s`} repeatCount="indefinite" />
                  </path>
                  {visualEnergy > 0.18 && (
                    <>
                      <circle r={1.1 + visualEnergy * 1.2} fill={row.metricColor} opacity={0.25 + visualEnergy * 0.7}>
                        <animateMotion dur={`${2.8 - visualEnergy * 1.35}s`} repeatCount="indefinite" path="M 0 10 C 40 3, 80 17, 120 10 S 200 3, 240 10 S 280 17, 300 10" />
                      </circle>
                      <circle r={0.9 + visualEnergy * 0.7} fill={row.metricColor} opacity={0.18 + visualEnergy * 0.52}>
                        <animateMotion dur={`${3.3 - visualEnergy * 1.1}s`} repeatCount="indefinite" path="M 300 10 C 260 17, 220 3, 180 10 S 100 17, 60 10 S 20 3, 0 10" />
                      </circle>
                    </>
                  )}
                </svg>
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {row.tags.slice(0, 2).map((tag) => (
                  <span key={tag} style={{
                    padding: '2px 6px', borderRadius: 999,
                    border: `1px solid ${row.metricColor}22`, background: `${row.metricColor}0A`,
                    color: row.metricColor, fontSize: 8.05,
                  }}>{tag}</span>
                ))}
                <span style={{
                  padding: '2px 6px', borderRadius: 999,
                  border: `1px solid ${T.panelBorder}`, background: 'rgba(255,255,255,0.015)',
                  color: T.textMuted, fontSize: 8.05,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                }} title={row.routeHint}>{row.routeHint}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
