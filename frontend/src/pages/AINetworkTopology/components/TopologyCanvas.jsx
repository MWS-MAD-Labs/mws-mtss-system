/* SVG topology canvas — animated-beam style wires with gradient pulse */

import { useMemo, memo } from 'react';
import { NODE_META, EDGE_DEF, RING_RADII } from '../constants/nodes';
import { STATUS_PALETTE } from '../constants/theme';
import { lerp, bezierMidpoint } from '../utils/helpers';

/* Animated beam edge — gradient pulse travelling along a curved path */
function BeamEdge({ edgeId, pathD, color, isActive, isHoverHL, hot, idx }) {
  const baseAlpha = isHoverHL ? 0.7 : isActive ? 0.46 : Math.max(0.13, 0.08 + hot / 14);
  const sw = isHoverHL ? 2.35 : isActive ? 1.95 : lerp(0.7, 1.45, hot / 10);
  const beamDur = isActive ? (2.2 + (idx % 4) * 0.3) : (5 + (idx % 5) * 0.6);
  const gradId = `bg-${edgeId}`;

  return (
    <g>
      {/* Base wire — subtle static path */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={Math.max(1.05, sw * 1.2)}
        strokeOpacity={isHoverHL ? 0.15 : isActive ? 0.12 : 0.08}
        strokeLinecap="round"
        filter="url(#glowF)"
        style={{ transition: 'stroke-opacity 220ms ease, stroke-width 220ms ease' }}
      />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeOpacity={baseAlpha}
        strokeLinecap="round"
        style={{ transition: 'stroke-opacity 220ms ease, stroke-width 220ms ease' }}
      />

      {/* Animated beam gradient — short bright pulse that travels the path */}
      <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={color} stopOpacity="0" />
        <stop offset="0%" stopColor={color} stopOpacity="0">
          <animate attributeName="offset" values="0;1" dur={`${beamDur}s`}
            repeatCount="indefinite" begin={`${(idx % 7) * 0.4}s`} />
        </stop>
        <stop offset="0%" stopColor={color} stopOpacity={isActive ? 0.9 : 0.5}>
          <animate attributeName="offset" values="0;1" dur={`${beamDur}s`}
            repeatCount="indefinite" begin={`${(idx % 7) * 0.4}s`} />
        </stop>
        <stop offset="0%" stopColor={color} stopOpacity="0">
          <animate attributeName="offset" values="0.08;1.08" dur={`${beamDur}s`}
            repeatCount="indefinite" begin={`${(idx % 7) * 0.4}s`} />
        </stop>
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>

      {/* Beam path — the travelling gradient */}
      <path d={pathD} fill="none" stroke={`url(#${gradId})`}
        strokeWidth={isActive ? 3.0 : isHoverHL ? 2.5 : 1.75}
        strokeLinecap="round"
        style={{ transition: 'stroke-width 220ms ease' }} />

      {/* Active shimmer dash */}
      {(isActive || isHoverHL) && (
        <path d={pathD} fill="none" stroke={color}
          strokeWidth={sw * 0.6} strokeOpacity={isHoverHL ? 0.36 : 0.2}
          strokeLinecap="round" strokeDasharray="2 16">
          <animate attributeName="stroke-dashoffset" from="0" to="-72"
            dur={`${isActive ? 1.5 : 3}s`} repeatCount="indefinite" />
        </path>
      )}
    </g>
  );
}

const AI_MODEL_NODE_IDS = ['ai-google-gemini', 'ai-openai-gpt', 'ai-anthropic-claude'];

function NeuralFabricOverlay({
  positions,
  cx,
  cy,
  activeNodeSet,
  nodeStatuses,
  hoveredNode,
  selectedNode,
}) {
  const hub = positions['hub-core'];
  const gemini = positions['ai-google-gemini'];
  const trinity = positions['ai-openai-gpt'];
  const step = positions['ai-anthropic-claude'];

  const microNeurons = useMemo(() => (
    [
      { x: -76, y: -44 }, { x: -58, y: -12 }, { x: -64, y: 28 }, { x: -28, y: -54 },
      { x: -16, y: -20 }, { x: -10, y: 18 }, { x: 20, y: -52 }, { x: 24, y: -16 },
      { x: 20, y: 22 }, { x: 56, y: -34 }, { x: 66, y: 4 }, { x: 56, y: 40 },
      { x: -34, y: 52 }, { x: 0, y: 58 }, { x: 36, y: 56 },
    ].map((n, i) => ({
      ...n,
      r: i % 5 === 0 ? 3.2 : i % 3 === 0 ? 2.8 : 2.3,
      key: `n-${i}`,
      color: i % 3 === 0 ? '#a78bfa' : i % 3 === 1 ? '#67e8f9' : '#6ee7b7',
      linkTo: i % 3 === 0 ? 'ai-openai-gpt' : i % 3 === 1 ? 'ai-google-gemini' : 'ai-anthropic-claude',
    }))
  ), []);

  if (!hub || !gemini || !trinity || !step) return null;

  const aiPoints = [
    { id: 'ai-google-gemini', p: gemini, color: '#67e8f9' },
    { id: 'ai-openai-gpt', p: trinity, color: '#93c5fd' },
    { id: 'ai-anthropic-claude', p: step, color: '#a7f3d0' },
  ];

  const openRouterActive = hoveredNode === 'ai-openrouter-api'
    || activeNodeSet.has('ai-openai-gpt')
    || activeNodeSet.has('ai-anthropic-claude')
    || ['active', 'warm'].includes(nodeStatuses?.['ai-openai-gpt'])
    || ['active', 'warm'].includes(nodeStatuses?.['ai-anthropic-claude']);

  const trinityStepMid = {
    x: (trinity.x + step.x) / 2 + 48,
    y: (trinity.y + step.y) / 2 - 62,
  };
  const openRouterFocus = hoveredNode === 'ai-openrouter-api' || selectedNode === 'ai-openrouter-api';

  const hoverKnownAi = AI_MODEL_NODE_IDS.includes(hoveredNode) ? hoveredNode : null;
  const focusAi = hoverKnownAi || (AI_MODEL_NODE_IDS.includes(selectedNode) ? selectedNode : null);

  return (
    <g pointerEvents="none">
      {/* Latent shell rings */}
      {[RING_RADII[1] - 20, RING_RADII[1] + 12, RING_RADII[1] + 42].map((r, i) => (
        <circle
          key={`latent-shell-${r}`}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={i === 1 ? '#a78bfa' : '#38bdf8'}
          strokeWidth={i === 1 ? 1.05 : 0.85}
          strokeOpacity={i === 1 ? 0.11 : 0.07}
          strokeDasharray={i === 0 ? '3 10' : i === 1 ? '5 11' : '2 12'}
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to={i % 2 === 0 ? '-96' : '96'}
            dur={`${18 + i * 6}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            values={i === 1 ? '0.08;0.14;0.08' : '0.05;0.09;0.05'}
            dur={`${6 + i * 1.5}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* AI-to-AI neural coordination lanes */}
      {[
        ['ai-google-gemini', 'ai-openai-gpt', '#67e8f9'],
        ['ai-openai-gpt', 'ai-anthropic-claude', '#a78bfa'],
        ['ai-anthropic-claude', 'ai-google-gemini', '#6ee7b7'],
      ].map(([fromId, toId, color], idx) => {
        const p1 = positions[fromId];
        const p2 = positions[toId];
        if (!p1 || !p2) return null;
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        const d = `M ${p1.x} ${p1.y} Q ${mx + (mx - cx) * 0.12} ${my + (my - cy) * 0.12} ${p2.x} ${p2.y}`;
        const focusEdge = focusAi && (fromId === focusAi || toId === focusAi);
        const edgeActive = activeNodeSet.has(fromId) || activeNodeSet.has(toId) || focusEdge;
        return (
          <g key={`ai-mesh-${fromId}-${toId}`}>
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeOpacity={edgeActive ? 0.16 : 0.07}
              strokeWidth={edgeActive ? 1.35 : 0.85}
              strokeLinecap="round"
              filter={edgeActive ? 'url(#neuralGlowF)' : undefined}
              style={{ transition: 'stroke-opacity 220ms ease, stroke-width 220ms ease' }}
            />
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeOpacity={edgeActive ? 0.28 : 0.11}
              strokeWidth={edgeActive ? 1.8 : 1.1}
              strokeLinecap="round"
              strokeDasharray={focusEdge ? '3 9' : '2 14'}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-64"
                dur={`${edgeActive ? 2.0 : 4.4 + idx * 0.4}s`}
                repeatCount="indefinite"
              />
            </path>
          </g>
        );
      })}

      {/* Hub latent neuron cluster */}
      {microNeurons.map((n, i) => {
        const target = positions[n.linkTo];
        const linkActive = activeNodeSet.has(n.linkTo) || focusAi === n.linkTo;
        const linkD = target
          ? `M ${cx + n.x} ${cy + n.y} Q ${cx + n.x * 0.4} ${cy + n.y * 0.4} ${target.x} ${target.y}`
          : null;
        return (
          <g key={n.key}>
            {linkD && (
              <path
                d={linkD}
                fill="none"
                stroke={n.color}
                strokeWidth={0.8}
                strokeOpacity={linkActive ? 0.13 : 0.05}
                strokeDasharray="2 10"
                style={{ transition: 'stroke-opacity 240ms ease' }}
              >
                {(linkActive || i % 4 === 0) && (
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-40"
                    dur={`${linkActive ? 1.8 : 3.8}s`}
                    repeatCount="indefinite"
                    begin={`${(i % 6) * 0.1}s`}
                  />
                )}
              </path>
            )}
            <circle
              cx={cx + n.x}
              cy={cy + n.y}
              r={n.r}
              fill={n.color}
              fillOpacity={linkActive ? 0.72 : 0.38}
              filter="url(#neuralGlowF)"
              style={{ transition: 'fill-opacity 220ms ease' }}
            >
              <animate
                attributeName="fill-opacity"
                values={linkActive ? '0.55;0.95;0.55' : '0.26;0.46;0.26'}
                dur={`${2.1 + (i % 5) * 0.35}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })}

      {/* OpenRouter virtual routing layer (visualized 4th AI gateway) */}
      <g opacity={openRouterActive ? 1 : 0.72}>
        {[trinity, step].map((p, idx) => {
          const d = `M ${trinityStepMid.x} ${trinityStepMid.y} Q ${(p.x + trinityStepMid.x) / 2 + 18} ${(p.y + trinityStepMid.y) / 2 - 14} ${p.x} ${p.y}`;
          return (
            <g key={`openrouter-link-${idx}`}>
              <path
                d={d}
                fill="none"
                stroke="#fcd34d"
                strokeWidth={openRouterFocus ? 1.9 : 1.35}
                strokeOpacity={openRouterActive ? 0.24 : 0.12}
                strokeLinecap="round"
                filter={openRouterActive ? 'url(#neuralGlowF)' : undefined}
                style={{ transition: 'stroke-opacity 220ms ease, stroke-width 220ms ease' }}
              />
              <path
                d={d}
                fill="none"
                stroke="#fcd34d"
                strokeWidth={openRouterFocus ? 2.3 : 1.55}
                strokeOpacity={openRouterActive ? 0.45 : 0.22}
                strokeDasharray="3 12"
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-50"
                  dur={openRouterActive ? '1.45s' : '3.2s'}
                  repeatCount="indefinite"
                  begin={`${idx * 0.12}s`}
                />
              </path>
            </g>
          );
        })}

        <g transform={`translate(${trinityStepMid.x},${trinityStepMid.y})`}>
          <ellipse
            rx="42"
            ry="16"
            fill="rgba(251,191,36,0.06)"
            stroke="#fcd34d"
            strokeWidth={openRouterFocus ? 1.5 : 1.05}
            strokeOpacity={openRouterActive ? 0.42 : 0.22}
            filter={openRouterActive ? 'url(#neuralGlowF)' : undefined}
            style={{ transition: 'stroke-opacity 220ms ease, stroke-width 220ms ease' }}
          >
            <animate
              attributeName="ry"
              values={openRouterActive ? '15.5;17.8;15.5' : '15.5;16.2;15.5'}
              dur={openRouterActive ? '2.2s' : '3.8s'}
              repeatCount="indefinite"
            />
          </ellipse>
          <ellipse rx="24" ry="8.2" fill="rgba(251,191,36,0.05)" stroke="#fcd34d" strokeWidth="0.8" strokeOpacity={openRouterActive ? 0.5 : 0.24}>
            <animate attributeName="rx" values="22;26;22" dur="2.6s" repeatCount="indefinite" />
          </ellipse>
          <text
            x="0"
            y="-1"
            textAnchor="middle"
            fill="#fde68a"
            fontSize="7.5"
            fontWeight="700"
            letterSpacing="0.85"
            fontFamily="'Inter',system-ui,sans-serif"
            opacity={openRouterActive ? 0.95 : 0.68}
          >
            OPENROUTER
          </text>
          <text
            x="0"
            y="8"
            textAnchor="middle"
            fill="#fcd34d"
            fontSize="5.8"
            letterSpacing="0.6"
            fontFamily="'Inter',system-ui,sans-serif"
            opacity={openRouterActive ? 0.78 : 0.5}
          >
            ROUTING LAYER
          </text>
        </g>
      </g>

      {/* AI node latent halos */}
      {aiPoints.map((a, i) => {
        const st = nodeStatuses?.[a.id] || 'idle';
        const active = activeNodeSet.has(a.id) || st === 'active' || focusAi === a.id;
        const warm = !active && st === 'warm';
        return (
          <g key={`ai-halo-${a.id}`}>
            <circle
              cx={a.p.x}
              cy={a.p.y}
              r={active ? 46 : warm ? 40 : 36}
              fill="none"
              stroke={a.color}
              strokeWidth={active ? 1.25 : 0.9}
              strokeOpacity={active ? 0.18 : warm ? 0.1 : 0.04}
              strokeDasharray="3 9"
              filter={active ? 'url(#neuralGlowF)' : undefined}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to={i % 2 ? '58' : '-58'}
                dur={`${active ? 3.4 : 6.8}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })}
    </g>
  );
}

const TopologyCanvas = memo(function TopologyCanvas({
  positions, activeNodes, activeEdges, edgeHotness, nodeStatuses,
  selectedNode, onNodeClick, hoveredNode, onNodeHover, onNodeLeave,
  cx, cy, layerColors, T,
}) {
  const nodeEntries = useMemo(() => Object.entries(NODE_META), []);
  const edgeEntries = useMemo(() => Object.entries(EDGE_DEF), []);
  const activeNodeSet = useMemo(() => new Set(activeNodes || []), [activeNodes]);
  const activeEdgeSet = useMemo(() => new Set(activeEdges || []), [activeEdges]);
  const hoveredIsKnownNode = !!(hoveredNode && NODE_META[hoveredNode]);

  const hoveredEdgeSet = useMemo(() => {
    if (!hoveredNode || !hoveredIsKnownNode) return new Set();
    const s = new Set();
    edgeEntries.forEach(([edgeId, { from, to }]) => {
      if (from === hoveredNode || to === hoveredNode) s.add(edgeId);
    });
    return s;
  }, [hoveredNode, edgeEntries, hoveredIsKnownNode]);

  const hoveredConnectedSet = useMemo(() => {
    if (!hoveredNode || !hoveredIsKnownNode) return new Set();
    const s = new Set([hoveredNode]);
    edgeEntries.forEach(([, { from, to }]) => {
      if (from === hoveredNode) s.add(to);
      if (to === hoveredNode) s.add(from);
    });
    return s;
  }, [hoveredNode, edgeEntries, hoveredIsKnownNode]);

  return (
    <svg viewBox="0 0 1000 1000" className="topology-svg" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={layerColors.hub.glow} stopOpacity="0.25" />
          <stop offset="100%" stopColor={layerColors.hub.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="aiStageLightA" cx="26%" cy="18%" r="56%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="aiStageLightB" cx="78%" cy="20%" r="58%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <pattern id="aiPrismPattern" width="72" height="72" patternUnits="userSpaceOnUse">
          <g stroke="rgba(255,255,255,0.22)" strokeWidth="0.7" fill="none">
            <polygon points="36,2 68,18 68,54 36,70 4,54 4,18" />
            <line x1="36" y1="2" x2="36" y2="70" />
            <line x1="4" y1="18" x2="68" y2="54" />
            <line x1="68" y1="18" x2="4" y2="54" />
          </g>
        </pattern>
        <filter id="glowF" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="neuralGlowF" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect x="20" y="20" width="960" height="960" rx="28"
        fill="rgba(7,6,25,0.10)" opacity="0.9" />
      <rect x="20" y="20" width="960" height="960" rx="28"
        fill="url(#aiPrismPattern)" opacity="0.08" />
      <rect x="20" y="20" width="960" height="960" rx="28" fill="url(#aiStageLightA)" />
      <rect x="20" y="20" width="960" height="960" rx="28" fill="url(#aiStageLightB)" />

      {/* Concentric ring guides */}
      {RING_RADII.slice(1).map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={T.svgRingStroke} strokeWidth="1" strokeDasharray="4 8" />
      ))}

      {/* Neural AI / ML overlay layer (lightweight, presentation-focused) */}
      <NeuralFabricOverlay
        positions={positions}
        cx={cx}
        cy={cy}
        activeNodeSet={activeNodeSet}
        nodeStatuses={nodeStatuses}
        hoveredNode={hoveredNode}
        selectedNode={selectedNode}
      />

      {/* Ring labels */}
      {['AI MODELS', 'BACKEND SERVICES', 'DATA STORES', 'FRONTEND PAGES'].map((label, i) => (
        <text key={label} x={cx} y={cy - RING_RADII[i + 1] - 8} textAnchor="middle"
          fill={T.textMuted} fontSize="7.5" fontWeight="600" letterSpacing="1.4"
          fontFamily="'Inter',system-ui,sans-serif" opacity="0.5">{label}</text>
      ))}

      <circle cx={cx} cy={cy} r={90} fill="url(#hubGlow)" />

      {/* Animated beam edges */}
      {edgeEntries.map(([edgeId, { from, to }], idx) => {
        const p1 = positions[from], p2 = positions[to];
        if (!p1 || !p2) return null;
        const hot = edgeHotness?.[edgeId] || 0;
        const isActive = activeEdgeSet.has(edgeId);
        const isHoverHL = hoveredEdgeSet.has(edgeId);
        const { cpx, cpy } = bezierMidpoint(p1.x, p1.y, p2.x, p2.y, cx, cy);
        const fromMeta = NODE_META[from], toMeta = NODE_META[to];
        const layerColor = fromMeta?.ring < (toMeta?.ring || 0)
          ? layerColors[fromMeta?.layer]?.glow : layerColors[toMeta?.layer]?.glow;
        const pathD = `M ${p1.x} ${p1.y} Q ${cpx} ${cpy} ${p2.x} ${p2.y}`;

        return (
          <BeamEdge key={edgeId} edgeId={edgeId} pathD={pathD}
            color={layerColor || T.textMuted}
            isActive={isActive} isHoverHL={isHoverHL} hot={hot} idx={idx} />
        );
      })}

      {/* Nodes */}
      {nodeEntries.map(([nodeId, meta]) => {
        const pos = positions[nodeId];
        if (!pos) return null;
        const layer = layerColors[meta.layer];
        const status = nodeStatuses?.[nodeId] || 'idle';
        const isActive = activeNodeSet.has(nodeId);
        const isSelected = selectedNode === nodeId;
        const isHovered = hoveredNode === nodeId;
        const isHub = meta.ring === 0;
        const nodeR = isHub ? 42 : meta.layer === 'ai' ? 30 : 24;
        const statusColor = STATUS_PALETTE[status] || STATUS_PALETTE.idle;
        const isDimmed = hoveredIsKnownNode && hoveredNode && !hoveredConnectedSet.has(nodeId);
        const scale = isHovered ? 1.15 : isSelected ? 1.045 : 1;

        return (
          <g key={nodeId}
            onClick={() => onNodeClick(nodeId)}
            onMouseEnter={() => onNodeHover(nodeId)}
            onMouseLeave={onNodeLeave}
            style={{ cursor: 'pointer', opacity: isDimmed ? 0.24 : 1, transition: 'opacity 260ms ease' }}
            transform={`translate(${pos.x},${pos.y})`}
          >
            <g style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              transform: `scale(${scale})`,
              transition: 'transform 260ms cubic-bezier(0.22,1,0.36,1)',
              willChange: 'transform',
            }}>
              {isActive && (
                <circle r={nodeR + 8} fill="none" stroke={layer.glow}
                  strokeWidth="1.2" strokeOpacity="0.25" filter="url(#glowF)"
                  style={{ transition: 'stroke-opacity 220ms ease' }} />
              )}
              {isSelected && (
                <circle r={nodeR + 11} fill="none" stroke={T.textPrimary}
                  strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 4">
                  <animateTransform attributeName="transform" type="rotate"
                    from="0" to="360" dur="10s" repeatCount="indefinite" />
                </circle>
              )}
              {isHovered && (
                <circle r={nodeR + 12} fill="none" stroke={layer.glow}
                  strokeWidth="1.5" strokeOpacity="0.4" filter="url(#glowF)">
                  <animate attributeName="r" values={`${nodeR + 10};${nodeR + 16};${nodeR + 10}`}
                    dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r={nodeR} fill={layer.bg}
                stroke={isActive ? statusColor : layer.border}
                strokeWidth={isActive ? 2.1 : 1.3}
                strokeOpacity={isActive ? 1 : 0.55}
                style={{ transition: 'stroke 220ms ease, stroke-width 220ms ease, stroke-opacity 220ms ease' }} />
              <circle cx={nodeR - 3.4} cy={-(nodeR - 3.4)} r={isHub ? 4.2 : 3.8}
                fill={statusColor} stroke={T.statusDotBorder} strokeWidth="1.2"
                style={{ transition: 'fill 220ms ease' }} />
              <text y={isHub ? 1 : -1} textAnchor="middle" fill={layer.text}
                fontSize={isHub ? 12.5 : 9.2} fontWeight="700"
                fontFamily="'Inter','SF Pro',system-ui,sans-serif"
                style={{ pointerEvents: 'none', transition: 'opacity 220ms ease' }}>{meta.short}</text>
              {!isHub && (
                <text y={nodeR + 15.5} textAnchor="middle" fill={layer.accent}
                  fontSize="7.4" fontFamily="'Inter',system-ui,sans-serif"
                  opacity={isHovered ? 0.95 : 0.7}
                  style={{ pointerEvents: 'none', transition: 'opacity 220ms ease' }}>
                  {meta.label.length > 20 ? meta.label.slice(0, 18) + '…' : meta.label}
                </text>
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
});

export default TopologyCanvas;
