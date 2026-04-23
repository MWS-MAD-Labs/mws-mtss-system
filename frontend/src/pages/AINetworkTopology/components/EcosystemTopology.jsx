/* EcosystemTopology — real-time mesh topology view for MWS Ecosystem */

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useEcosystemSim } from '../hooks/useEcosystemSim';
import { ECO_NODES } from '../constants/ecosystemTopology';
import { ECOSYSTEM_MODULES } from '../constants/ecosystem';
import { PRISM_DARK, PRISM_LIGHT } from '../constants/theme';
import EcosystemMesh from './EcosystemMesh';
import ModuleRadar from './ModuleRadar';
import ModuleIntelligence from './ModuleIntelligence';
import TechnologyMatrix from './TechnologyMatrix';
import gsap from 'gsap';

function LiquidGlassPanel({
  children,
  T,
  isDark,
  accent = '#7dd3fc',
  className = '',
  panelStyle = {},
  contentStyle = {},
}) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        background: isDark
          ? 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.016))'
          : 'linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.55))',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.65)'}`,
        boxShadow: isDark
          ? `0 14px 34px ${T.panelShadow}, inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -18px 40px rgba(124,58,237,0.05)`
          : `0 10px 28px ${T.panelShadow}, inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -18px 40px rgba(14,165,233,0.03)`,
        backdropFilter: 'blur(14px) saturate(138%)',
        WebkitBackdropFilter: 'blur(14px) saturate(138%)',
        ...panelStyle,
      }}>
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: isDark ? PRISM_DARK : PRISM_LIGHT,
        backgroundSize: '118px 118px',
        opacity: isDark ? 0.022 : 0.018,
        mixBlendMode: isDark ? 'screen' : 'multiply',
      }} />
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: [
          `radial-gradient(120px 90px at 16% 8%, ${accent}16 0%, transparent 72%)`,
          `radial-gradient(240px 120px at 84% 0%, rgba(255,255,255,0.09) 0%, transparent 70%)`,
          `radial-gradient(160px 80px at 18% 98%, ${accent}12 0%, transparent 76%)`,
          isDark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.014) 28%, rgba(255,255,255,0) 56%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.13) 35%, rgba(255,255,255,0) 60%)',
        ].join(', '),
      }} />
      <div aria-hidden style={{
        position: 'absolute',
        top: -24,
        left: '8%',
        width: '56%',
        height: 70,
        pointerEvents: 'none',
        background: `radial-gradient(ellipse at center, ${accent}2a 0%, transparent 72%)`,
        filter: 'blur(12px)',
        opacity: isDark ? 0.55 : 0.35,
      }} />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', ...contentStyle }}>
        {children}
      </div>
    </div>
  );
}

const EcosystemTopology = memo(function EcosystemTopology({ T, isDark }) {
  const sim = useEcosystemSim();
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const layoutRef = useRef(null);

  const handleSelect = useCallback((id) => setSelectedNode(p => p === id ? null : id), []);
  const handleHover = useCallback((id) => setHoveredNode(id), []);
  const handleLeave = useCallback(() => setHoveredNode(null), []);
  const handleClose = useCallback(() => setSelectedNode(null), []);

  /* GSAP entrance animation */
  useEffect(() => {
    if (!layoutRef.current) return;
    const panels = layoutRef.current.querySelectorAll('.eco-panel');
    gsap.fromTo(panels, { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out' });
  }, []);

  /* KPI stats */
  const totalPages = ECOSYSTEM_MODULES.reduce((s, m) => s + m.stats.pages, 0);
  const totalApis = ECOSYSTEM_MODULES.reduce((s, m) => s + m.stats.apis, 0);
  const totalModels = ECOSYSTEM_MODULES.reduce((s, m) => s + m.stats.models, 0);
  const kpis = [
    { label: 'Modules', value: ECOSYSTEM_MODULES.length, color: '#a78bfa' },
    { label: 'Pages', value: totalPages, color: '#38bdf8' },
    { label: 'APIs', value: `${totalApis}+`, color: '#34d399' },
    { label: 'Models', value: totalModels, color: '#fbbf24' },
    { label: 'Nodes', value: ECO_NODES.length, color: '#f472b6' },
  ];

  return (
    <div ref={layoutRef} style={{
      position: 'absolute', inset: 0, zIndex: 10,
      display: 'flex', flexDirection: 'column',
      padding: '40px 12px 12px',
      animation: 'topo-fadeIn .4s ease-out',
    }}>
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: isDark
          ? 'radial-gradient(ellipse at 20% 18%, rgba(14,165,233,0.05) 0%, transparent 48%), radial-gradient(ellipse at 78% 14%, rgba(168,85,247,0.06) 0%, transparent 46%), radial-gradient(ellipse at 50% 92%, rgba(34,211,238,0.04) 0%, transparent 52%)'
          : 'radial-gradient(ellipse at 20% 18%, rgba(14,165,233,0.03) 0%, transparent 48%), radial-gradient(ellipse at 78% 14%, rgba(168,85,247,0.04) 0%, transparent 46%), radial-gradient(ellipse at 50% 92%, rgba(34,211,238,0.025) 0%, transparent 52%)',
      }} />
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: isDark ? PRISM_DARK : PRISM_LIGHT,
        backgroundSize: '120px 120px',
        opacity: isDark ? 0.025 : 0.02,
      }} />

      {/* Top: subtitle + KPI chips */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{
          color: isDark ? '#c4b5fd' : '#6d28d9', fontSize: 10, fontWeight: 700,
          letterSpacing: 1.5, textTransform: 'uppercase',
        }}>MWS Ecosystem Topology</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {kpis.map(k => (
            <div key={k.label} style={{
              padding: '4px 11px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5,
              background: isDark
                ? `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)), rgba(10,10,30,0.45)`
                : 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.65))',
              border: `1px solid ${isDark ? `${k.color}24` : 'rgba(255,255,255,0.75)'}`,
              boxShadow: isDark
                ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 16px rgba(0,0,0,0.18)`
                : `inset 0 1px 0 rgba(255,255,255,0.85), 0 4px 14px rgba(0,0,0,0.06)`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}>
              <span style={{ color: k.color, fontSize: 11, fontWeight: 800, fontFamily: 'monospace' }}>{k.value}</span>
              <span style={{ color: T.textMuted, fontSize: 7.5, fontWeight: 600, textTransform: 'uppercase' }}>{k.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3-column layout */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'grid', gridTemplateColumns: selectedNode ? '220px 1fr 260px' : '220px 1fr', gap: 10, minHeight: 0 }}>
        {/* Left: Module Radar */}
        <LiquidGlassPanel
          className="eco-panel topo-panel"
          T={T}
          isDark={isDark}
          accent="#22d3ee"
          panelStyle={{}}
          contentStyle={{ padding: '12px 12px', overflow: 'hidden' }}>
          <ModuleRadar
            nodeStatuses={sim.nodeStatuses}
            activeNodes={sim.activeNodes}
            context={sim.context}
            events={sim.events}
            onSelect={handleSelect}
            selectedNode={selectedNode}
            T={T} isDark={isDark}
          />
        </LiquidGlassPanel>

        {/* Center: Mesh topology */}
        <LiquidGlassPanel
          className="eco-panel topo-panel"
          T={T}
          isDark={isDark}
          accent="#a78bfa"
          panelStyle={{
            position: 'relative',
            minHeight: 0,
            background: isDark
              ? 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)), rgba(7,6,25,0.34)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.58))',
          }}
          contentStyle={{ position: 'relative', height: '100%' }}>
          <div aria-hidden style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: isDark ? PRISM_DARK : PRISM_LIGHT,
            backgroundSize: '132px 132px',
            opacity: isDark ? 0.022 : 0.016,
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }} />
          <div aria-hidden style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: isDark
              ? 'radial-gradient(circle at 22% 26%, rgba(56,189,248,0.10), transparent 42%), radial-gradient(circle at 76% 18%, rgba(167,139,250,0.10), transparent 40%), radial-gradient(circle at 56% 74%, rgba(34,211,238,0.08), transparent 45%)'
              : 'radial-gradient(circle at 22% 26%, rgba(56,189,248,0.07), transparent 42%), radial-gradient(circle at 76% 18%, rgba(167,139,250,0.08), transparent 40%), radial-gradient(circle at 56% 74%, rgba(34,211,238,0.06), transparent 45%)',
          }} />
          <div aria-hidden style={{
            position: 'absolute', left: '4%', right: '20%', top: -18, height: 84,
            pointerEvents: 'none',
            background: isDark
              ? 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0))'
              : 'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0))',
            filter: 'blur(10px)',
            opacity: isDark ? 0.55 : 0.35,
          }} />
          <EcosystemMesh
            activeNodes={sim.activeNodes}
            activeEdges={sim.activeEdges}
            edgeHotness={sim.edgeHotness}
            nodeStatuses={sim.nodeStatuses}
            selectedNode={selectedNode}
            onNodeClick={handleSelect}
            hoveredNode={hoveredNode}
            onNodeHover={handleHover}
            onNodeLeave={handleLeave}
            T={T} isDark={isDark}
          />
        </LiquidGlassPanel>

        {/* Right: Module Intelligence */}
        {selectedNode && (
          <LiquidGlassPanel
            className="eco-panel topo-panel"
            T={T}
            isDark={isDark}
            accent="#f472b6"
            contentStyle={{ padding: '12px 12px', overflow: 'hidden' }}>
            <ModuleIntelligence
              nodeId={selectedNode}
              nodeStatuses={sim.nodeStatuses}
              onClose={handleClose}
              T={T} isDark={isDark}
            />
          </LiquidGlassPanel>
        )}
      </div>

      {/* Bottom: Technology Matrix */}
      <LiquidGlassPanel
        className="eco-panel topo-panel"
        T={T}
        isDark={isDark}
        accent="#34d399"
        panelStyle={{ borderRadius: 12, marginTop: 8 }}
        contentStyle={{ padding: '10px 14px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
        }}>
          <div style={{ color: T.textSecondary, fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Technology Matrix</div>
          <div style={{ flex: 1, height: 1, background: T.panelBorder }} />
        </div>
        <TechnologyMatrix T={T} isDark={isDark} />
      </LiquidGlassPanel>
    </div>
  );
});

export default EcosystemTopology;
