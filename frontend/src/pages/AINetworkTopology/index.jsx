/* AINetworkTopologyPage — lightweight orchestrator */

import { useState, useCallback, useMemo, useRef } from 'react';
import { THEMES, getLayerColors, PRISM_DARK, PRISM_LIGHT } from './constants/theme';
import { computeNodePositions } from './utils/helpers';
import { useSystemTheme } from './hooks/useSystemTheme';
import { useTelemetry } from './hooks/useTelemetry';
import TopologyCanvas from './components/TopologyCanvas';
import EcosystemTopology from './components/EcosystemTopology';
import NeuralModelFabricPanel from './components/NeuralModelFabricPanel';
import {
  DetailPanel, EventLog, SystemStatsBar,
  LayerLegend,
} from './components/OverlayPanels';

const CX = 500, CY = 500;

export default function AINetworkTopologyPage() {
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [activeTab, setActiveTab] = useState('topology');

  /* Theme */
  const [theme] = useSystemTheme();
  const T = THEMES[theme];
  const layerColors = useMemo(() => getLayerColors(theme), [theme]);
  const isDark = theme === 'dark';

  /* Telemetry */
  const telemetry = useTelemetry();
  const positions = useMemo(() => computeNodePositions(CX, CY), []);

  /* Handlers */
  const handleNodeHover = useCallback((id) => setHoveredNode(id), []);
  const handleNodeLeave = useCallback(() => setHoveredNode(null), []);
  const handleNodeClick = useCallback((id) => setSelectedNode(p => p === id ? null : id), []);
  const handleCloseDetail = useCallback(() => setSelectedNode(null), []);
  const toggleView = useCallback(() => setActiveTab(p => p === 'topology' ? 'ecosystem' : 'topology'), []);
  const showNeuralDeck = activeTab === 'topology' && !selectedNode;

  return (
    <div ref={containerRef} style={{
      position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden',
      background: T.pageBg,
      fontFamily: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
    }}>
      <style>{`
        @keyframes topo-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes topo-fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes topo-glow { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.3)} }
        @keyframes neural-bar-slide { from { transform: translateX(-96px); } to { transform: translateX(360px); } }
        @keyframes neural-signal-bar {
          0%, 100% { transform: scaleY(.34); opacity: .34; }
          35% { transform: scaleY(1); opacity: 1; }
          65% { transform: scaleY(.62); opacity: .7; }
        }
        .topology-svg { width:100%; height:100%; display:block }
        .topo-panel {
          position: relative;
          isolation: isolate;
          backdrop-filter: blur(13px) saturate(136%);
          -webkit-backdrop-filter: blur(13px) saturate(136%);
          box-shadow:
            0 10px 28px ${T.panelShadow},
            inset 0 1px 0 rgba(255,255,255,0.06),
            inset 0 -16px 30px rgba(124,58,237,0.03);
          transition: box-shadow .25s ease, border-color .25s ease, transform .25s ease;
        }
        .topo-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background:
            radial-gradient(160px 80px at 15% 6%, rgba(56,189,248,0.08), transparent 72%),
            radial-gradient(220px 110px at 82% 0%, rgba(255,255,255,0.06), transparent 72%),
            ${isDark ? PRISM_DARK : PRISM_LIGHT};
          background-size:
            auto,
            auto,
            122px 122px;
          background-repeat: no-repeat, no-repeat, repeat;
          opacity: ${isDark ? 0.20 : 0.14};
          mix-blend-mode: ${isDark ? 'screen' : 'multiply'};
        }
        .topo-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 22%, rgba(255,255,255,0) 54%),
            radial-gradient(180px 72px at 12% 0%, rgba(167,139,250,0.08), transparent 78%);
          opacity: ${isDark ? 0.78 : 0.42};
        }
        .topo-panel:hover {
          box-shadow:
            0 12px 34px ${T.panelShadow},
            inset 0 1px 0 rgba(255,255,255,0.10),
            inset 0 -20px 36px rgba(124,58,237,0.045);
        }
        .neural-fabric-panel::before {
          opacity: ${isDark ? 0.09 : 0.07};
          background-size:
            auto,
            auto,
            184px 184px !important;
          background-position:
            0 0,
            0 0,
            28px 16px;
        }
        .neural-fabric-panel::after {
          opacity: ${isDark ? 0.9 : 0.55};
          background:
            linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03) 22%, rgba(255,255,255,0) 55%),
            radial-gradient(260px 110px at 10% 0%, rgba(56,189,248,0.10), transparent 76%),
            radial-gradient(260px 120px at 88% 0%, rgba(167,139,250,0.11), transparent 78%);
        }
        .neural-fabric-panel::-webkit-scrollbar { width: 4px; }
        .neural-fabric-panel::-webkit-scrollbar-thumb { background: ${T.scrollThumb}; border-radius: 999px; }
        .neural-fabric-card {
          position: relative;
          isolation: isolate;
          --mx: 50%;
          --my: 50%;
        }
        .neural-fabric-card::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          opacity: 0;
          transition: opacity .26s ease;
          background:
            linear-gradient(115deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015) 28%, rgba(255,255,255,0) 52%),
            radial-gradient(120px 60px at 85% 0%, rgba(167,139,250,0.10), transparent 72%);
        }
        .neural-fabric-card::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          opacity: 0;
          transition: opacity .22s ease;
          background:
            radial-gradient(140px 90px at var(--mx) var(--my), rgba(125,211,252,0.12), rgba(167,139,250,0.07) 42%, transparent 78%);
          mix-blend-mode: screen;
        }
        .neural-fabric-card:hover::before,
        .neural-fabric-card:hover::after {
          opacity: 1;
        }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.scrollThumb};border-radius:4px}
      `}</style>

      {/* Background layers */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: `radial-gradient(ellipse at 30% 80%, ${T.auroraA} 0%, transparent 50%), radial-gradient(ellipse at 70% 20%, ${T.auroraB} 0%, transparent 50%)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        opacity: T.gridOpacity,
        backgroundImage: isDark ? PRISM_DARK : PRISM_LIGHT,
        backgroundSize: '80px 80px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        opacity: isDark ? 0.028 : 0.022,
        backgroundImage: isDark ? PRISM_DARK : PRISM_LIGHT,
        backgroundSize: '130px 130px',
        backgroundPosition: '40px 24px',
        mixBlendMode: isDark ? 'screen' : 'multiply',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: `radial-gradient(ellipse at center, transparent 55%, ${T.vignetteColor} 100%)`,
      }} />

      {/* Title — shifted right, no tabs */}
      <h1 style={{
        position: 'absolute', top: 12, left: 56, zIndex: 50,
        margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase',
        background: isDark
          ? 'linear-gradient(135deg, #c4b5fd, #7dd3fc, #6ee7b7)'
          : 'linear-gradient(135deg, #6d28d9, #0369a1, #047857)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        pointerEvents: 'none',
      }}>
        AI Network
      </h1>

      {/* View toggle button (top-right) */}
      <button onClick={toggleView} title={activeTab === 'topology' ? 'MWS Ecosystem' : 'AI Topology'} style={{
        position: 'absolute', top: 10, right: 16, zIndex: 55,
        height: 30, borderRadius: 8, padding: '0 14px',
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}`,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
        color: isDark ? '#94a3b8' : '#475569',
        transition: 'all .2s',
      }}>
        <span style={{ fontSize: 14 }}>{activeTab === 'topology' ? '◎' : '◈'}</span>
        {activeTab === 'topology' ? 'Ecosystem' : 'Topology'}
      </button>

      {/* Topology view */}
      {activeTab === 'topology' && (
        <>
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '44px 208px 78px 208px',
            animation: 'topo-fadeIn .4s ease-out',
          }}>
            <div style={{
              width: '100%',
              maxWidth: showNeuralDeck ? 1354 : 980,
              display: 'grid',
              gridTemplateColumns: showNeuralDeck ? 'minmax(0, 1fr) 426px' : 'minmax(0, 1fr)',
              alignItems: 'start',
              gap: showNeuralDeck ? 12 : 0,
            }}>
              <div style={{ width: '100%', maxWidth: showNeuralDeck ? 904 : 980, aspectRatio: '1/1', justifySelf: 'center' }}>
                <TopologyCanvas
                  positions={positions}
                  activeNodes={telemetry.displayActiveNodes}
                  activeEdges={telemetry.displayActiveEdges}
                  edgeHotness={telemetry.displayEdgeHotness}
                  nodeStatuses={telemetry.displayNodeStatuses}
                  selectedNode={selectedNode}
                  onNodeClick={handleNodeClick}
                  hoveredNode={hoveredNode}
                  onNodeHover={handleNodeHover}
                  onNodeLeave={handleNodeLeave}
                  cx={CX} cy={CY}
                  layerColors={layerColors} T={T}
                />
              </div>

              {showNeuralDeck && (
                <NeuralModelFabricPanel
                  modelStats={telemetry.displayModelStats}
                  events={telemetry.displayEvents}
                  context={telemetry.displayContext}
                  activeNodes={telemetry.displayActiveNodes}
                  nodeStatuses={telemetry.displayNodeStatuses}
                  hoveredNode={hoveredNode}
                  selectedNode={selectedNode}
                  onHoverModel={handleNodeHover}
                  onLeaveModel={handleNodeLeave}
                  onClickModel={handleNodeClick}
                  dataSource={telemetry.dataSource}
                  T={T}
                />
              )}
            </div>
          </div>

          <SystemStatsBar
            stats={telemetry.displayStats}
            modelStats={telemetry.displayModelStats}
            viewers={telemetry.displayViewers}
            dataSource={telemetry.dataSource}
            T={T}
          />
          <EventLog events={telemetry.displayEvents} T={T} />
          <DetailPanel
            nodeId={selectedNode}
            nodeRuntime={telemetry.isLive ? telemetry.runtime?.nodeRuntime : null}
            onClose={handleCloseDetail}
            layerColors={layerColors} T={T}
          />
          <LayerLegend layerColors={layerColors} T={T} />
        </>
      )}

      {/* Ecosystem topology view */}
      {activeTab === 'ecosystem' && (
        <EcosystemTopology T={T} isDark={isDark} />
      )}
    </div>
  );
}
