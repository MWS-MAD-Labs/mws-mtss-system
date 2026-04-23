/* EcosystemMesh — real-time SVG mesh topology with animated-beam wires */

import { useMemo, memo } from 'react';
import { ECO_NODES, ECO_EDGES } from '../constants/ecosystemTopology';
import { STATUS_PALETTE } from '../constants/theme';
import { lerp, bezierMidpoint } from '../utils/helpers';

const CX = 500, CY = 500;
const CORE_R = 165, MODULE_R = 390;
const MESH_SCALE = 1.14;

function computeEcoPositions() {
  const pos = {};
  const cores = ECO_NODES.filter(n => n.ring === 0);
  const modules = ECO_NODES.filter(n => n.ring === 1);
  cores.forEach((n, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / cores.length;
    pos[n.id] = { x: CX + CORE_R * Math.cos(angle), y: CY + CORE_R * Math.sin(angle) };
  });
  modules.forEach((n, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / modules.length;
    pos[n.id] = { x: CX + MODULE_R * Math.cos(angle), y: CY + MODULE_R * Math.sin(angle) };
  });
  return pos;
}

function EcoBeamEdge({ edgeId, pathD, color, isActive, isHoverHL, hot, idx }) {
  const a = isHoverHL ? 0.68 : isActive ? 0.44 : Math.max(0.12, 0.08 + hot / 14);
  const sw = isHoverHL ? 2.4 : isActive ? 1.95 : lerp(0.75, 1.55, hot / 10);
  const dur = isActive ? (2 + (idx % 4) * 0.3) : (4.5 + (idx % 5) * 0.5);
  const gid = `ebg-${edgeId}`, begin = `${(idx % 8) * 0.35}s`;
  return (
    <g>
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={Math.max(1.1, sw * 1.15)}
        strokeOpacity={isHoverHL ? 0.14 : isActive ? 0.12 : 0.08}
        strokeLinecap="round"
        filter="url(#ecoBlur)"
        style={{ transition: 'stroke-opacity 220ms ease, stroke-width 220ms ease' }}
      />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeOpacity={a}
        strokeLinecap="round"
        style={{ transition: 'stroke-opacity 220ms ease, stroke-width 220ms ease' }}
      />
      <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={color} stopOpacity="0" />
        <stop offset="0%" stopColor={color} stopOpacity="0">
          <animate attributeName="offset" values="0;1" dur={`${dur}s`} repeatCount="indefinite" begin={begin} />
        </stop>
        <stop offset="0%" stopColor={color} stopOpacity={isActive ? 0.85 : 0.45}>
          <animate attributeName="offset" values="0;1" dur={`${dur}s`} repeatCount="indefinite" begin={begin} />
        </stop>
        <stop offset="0%" stopColor={color} stopOpacity="0">
          <animate attributeName="offset" values="0.1;1.1" dur={`${dur}s`} repeatCount="indefinite" begin={begin} />
        </stop>
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
      <path
        d={pathD}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={isActive ? 3.0 : isHoverHL ? 2.45 : 1.75}
        strokeLinecap="round"
        style={{ transition: 'stroke-width 220ms ease' }}
      />
      {(isActive || isHoverHL) && (
        <path d={pathD} fill="none" stroke={color} strokeWidth={sw * 0.6} strokeOpacity={isHoverHL ? 0.34 : 0.18}
          strokeLinecap="round" strokeDasharray="2 16">
          <animate attributeName="stroke-dashoffset" from="0" to="-72" dur={`${isActive ? 1.5 : 3}s`} repeatCount="indefinite" />
        </path>
      )}
    </g>
  );
}

const EcosystemMesh = memo(function EcosystemMesh({
  activeNodes, activeEdges, edgeHotness, nodeStatuses,
  selectedNode, onNodeClick, hoveredNode, onNodeHover, onNodeLeave,
  T, isDark,
}) {
  const positions = useMemo(() => computeEcoPositions(), []);
  const nodeMap = useMemo(() => Object.fromEntries(ECO_NODES.map(n => [n.id, n])), []);
  const activeSet = useMemo(() => activeNodes || new Set(), [activeNodes]);
  const activeEdgeSet = useMemo(() => activeEdges || new Set(), [activeEdges]);

  const hoveredEdges = useMemo(() => {
    if (!hoveredNode) return new Set();
    const s = new Set();
    ECO_EDGES.forEach(e => { if (e.from === hoveredNode || e.to === hoveredNode) s.add(e.id); });
    return s;
  }, [hoveredNode]);

  const hoveredConnected = useMemo(() => {
    if (!hoveredNode) return new Set();
    const s = new Set([hoveredNode]);
    ECO_EDGES.forEach(e => {
      if (e.from === hoveredNode) s.add(e.to);
      if (e.to === hoveredNode) s.add(e.from);
    });
    return s;
  }, [hoveredNode]);

  return (
    <svg
      viewBox="0 0 1000 1000"
      style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id="ecoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isDark ? '#7c3aed' : '#8b5cf6'} stopOpacity="0.12" />
          <stop offset="100%" stopColor={isDark ? '#7c3aed' : '#8b5cf6'} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ecoStageLightA" cx="25%" cy="22%" r="55%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity={isDark ? '0.08' : '0.05'} />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ecoStageLightB" cx="78%" cy="18%" r="52%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity={isDark ? '0.09' : '0.055'} />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <pattern id="ecoPrismPattern" width="92" height="92" patternUnits="userSpaceOnUse">
          <g stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(71,85,105,0.08)'} strokeWidth="0.38" fill="none">
            <polygon points="46,3 88,23 88,69 46,89 4,69 4,23" />
            <line x1="46" y1="3" x2="46" y2="89" />
            <line x1="4" y1="23" x2="88" y2="69" />
            <line x1="88" y1="23" x2="4" y2="69" />
          </g>
        </pattern>
        <filter id="ecoBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g transform={`translate(${CX} ${CY}) scale(${MESH_SCALE}) translate(${-CX} ${-CY})`}>
        <rect
          x="28"
          y="28"
          width="944"
          height="944"
          rx="28"
          fill={isDark ? 'rgba(4,6,18,0.18)' : 'rgba(255,255,255,0.18)'}
          opacity="0.9"
        />
        <rect x="28" y="28" width="944" height="944" rx="28" fill="url(#ecoPrismPattern)" opacity={isDark ? 0.035 : 0.026} />
        <rect x="28" y="28" width="944" height="944" rx="28" fill="url(#ecoStageLightA)" />
        <rect x="28" y="28" width="944" height="944" rx="28" fill="url(#ecoStageLightB)" />

        {/* Ring guides */}
        <circle cx={CX} cy={CY} r={CORE_R} fill="none" stroke={T.svgRingStroke} strokeWidth="1.1" strokeDasharray="4 8" />
        <circle cx={CX} cy={CY} r={MODULE_R} fill="none" stroke={T.svgRingStroke} strokeWidth="1.1" strokeDasharray="4 8" />
        <text x={CX} y={CY - CORE_R - 14} textAnchor="middle" fill={T.textMuted} fontSize="8.2" fontWeight="700" letterSpacing="1.35" opacity="0.56">CORE SERVICES</text>
        <text x={CX} y={CY - MODULE_R - 14} textAnchor="middle" fill={T.textMuted} fontSize="8.2" fontWeight="700" letterSpacing="1.35" opacity="0.56">MODULES</text>
        <circle cx={CX} cy={CY} r={106} fill="url(#ecoGlow)" />

        {/* Animated beam edges */}
        {ECO_EDGES.map((edge, idx) => {
          const p1 = positions[edge.from], p2 = positions[edge.to];
          if (!p1 || !p2) return null;
          const hot = edgeHotness?.[edge.id] || 0;
          const isActive = activeEdgeSet.has(edge.id);
          const isHoverHL = hoveredEdges.has(edge.id);
          const { cpx, cpy } = bezierMidpoint(p1.x, p1.y, p2.x, p2.y, CX, CY);
          const color = nodeMap[edge.from]?.color || nodeMap[edge.to]?.color || '#94a3b8';
          const pathD = `M ${p1.x} ${p1.y} Q ${cpx} ${cpy} ${p2.x} ${p2.y}`;

          return (
            <EcoBeamEdge key={edge.id} edgeId={edge.id} pathD={pathD}
              color={color} isActive={isActive} isHoverHL={isHoverHL} hot={hot} idx={idx} />
          );
        })}

        {/* Nodes */}
        {ECO_NODES.map(node => {
          const pos = positions[node.id];
          if (!pos) return null;
          const status = nodeStatuses?.[node.id] || 'idle';
          const isActive = activeSet.has(node.id);
          const isSelected = selectedNode === node.id;
          const isHovered = hoveredNode === node.id;
          const isCore = node.ring === 0;
          const nodeR = isCore ? 36 : 30;
          const statusColor = STATUS_PALETTE[status] || STATUS_PALETTE.idle;
          const isDimmed = hoveredNode && !hoveredConnected.has(node.id);
          const scale = isHovered ? 1.14 : isSelected ? 1.035 : 1;
          const label = String(node.label || node.short || node.id);

          return (
            <g key={node.id}
              onClick={() => onNodeClick(node.id)}
              onMouseEnter={() => onNodeHover(node.id)}
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
                  <circle r={nodeR + 10} fill="none" stroke={node.color}
                    strokeWidth="1.35" strokeOpacity="0.34" filter="url(#ecoBlur)"
                    style={{ transition: 'stroke-opacity 240ms ease' }} />
                )}
                {isSelected && (
                  <circle r={nodeR + 14} fill="none" stroke={T.textPrimary}
                    strokeWidth="1.1" strokeOpacity="0.42" strokeDasharray="4 4">
                    <animateTransform attributeName="transform" type="rotate"
                      from="0" to="360" dur="10s" repeatCount="indefinite" />
                  </circle>
                )}
                {isHovered && (
                  <circle r={nodeR + 15} fill="none" stroke={node.color}
                    strokeWidth="1.7" strokeOpacity="0.42" filter="url(#ecoBlur)">
                    <animate attributeName="r" values={`${nodeR + 12};${nodeR + 18};${nodeR + 12}`}
                      dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle r={nodeR} fill={isDark ? `${node.color}18` : `${node.color}12`}
                  stroke={isActive ? statusColor : `${node.color}66`}
                  strokeWidth={isActive ? 2.2 : 1.35} strokeOpacity={isActive ? 1 : 0.62}
                  style={{ transition: 'stroke 220ms ease, stroke-width 220ms ease, stroke-opacity 220ms ease' }} />
                <circle cx={nodeR - 4} cy={-(nodeR - 4)} r={isCore ? 4.2 : 3.8}
                  fill={statusColor} stroke={T.statusDotBorder} strokeWidth="1.15"
                  style={{ transition: 'fill 220ms ease' }} />
                <text y={isCore ? 1.6 : -2.2} textAnchor="middle"
                  fill={node.color}
                  fontSize={isCore ? 12.4 : 9.6} fontWeight="700"
                  fontFamily="'Inter','SF Pro',system-ui,sans-serif"
                  style={{ pointerEvents: 'none', transition: 'opacity 220ms ease' }}>{node.short}</text>
                <text y={nodeR + 17} textAnchor="middle"
                  fill={isDark ? `${node.color}d8` : node.color}
                  fontSize="7.6" fontFamily="'Inter',system-ui,sans-serif"
                  opacity={isHovered ? 1 : 0.76}
                  style={{ pointerEvents: 'none', transition: 'opacity 220ms ease' }}>
                  {label.length > 18 ? label.slice(0, 16) + '…' : label}
                </text>
                {isCore && (
                  <text y={12} textAnchor="middle" fill={T.textMuted} fontSize="6.8"
                    style={{ pointerEvents: 'none', transition: 'opacity 220ms ease' }} opacity="0.62">{node.icon}</text>
                )}
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
});

export default EcosystemMesh;
