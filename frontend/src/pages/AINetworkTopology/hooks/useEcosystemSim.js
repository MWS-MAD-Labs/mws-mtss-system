/* useEcosystemSim — lightweight real-time simulation for ecosystem topology */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ECO_NODES, ECO_EDGES, ECO_SIM_FLOWS } from '../constants/ecosystemTopology';

export function useEcosystemSim() {
  const [state, setState] = useState(() => ({
    activeNodes: new Set(),
    activeEdges: new Set(),
    edgeHotness: {},
    nodeStatuses: Object.fromEntries(ECO_NODES.map(n => [n.id, 'idle'])),
    context: { title: 'Initializing...', primary: null, latencyMs: 0, rpm: 0 },
    events: [],
    scenarioIdx: 0,
  }));

  const timerRef = useRef(null);
  const idxRef = useRef(0);

  useEffect(() => {
    const tick = () => {
      const idx = idxRef.current % ECO_SIM_FLOWS.length;
      idxRef.current = idx + 1;
      const flow = ECO_SIM_FLOWS[idx];
      const lat = Math.round(30 + Math.random() * 180);
      const rpm = Math.round(4 + Math.random() * 18);
      const now = Date.now();

      setState(prev => {
        const hotness = { ...prev.edgeHotness };
        Object.keys(hotness).forEach(k => { hotness[k] = Math.max(0, (hotness[k] || 0) - 2); });
        flow.edges.forEach(eId => { hotness[eId] = 10; });

        const statuses = { ...prev.nodeStatuses };
        ECO_NODES.forEach(n => {
          if (flow.active.includes(n.id)) statuses[n.id] = 'active';
          else if (statuses[n.id] === 'active') statuses[n.id] = 'warm';
          else if (statuses[n.id] === 'warm' && Math.random() > 0.6) statuses[n.id] = 'idle';
        });

        const event = { id: `eco-${now}`, title: flow.title, lat, at: now, ok: Math.random() > 0.05 };
        return {
          activeNodes: new Set(flow.active),
          activeEdges: new Set(flow.edges),
          edgeHotness: hotness,
          nodeStatuses: statuses,
          context: { title: flow.title, primary: flow.primary, latencyMs: lat, rpm },
          events: [event, ...prev.events].slice(0, 8),
          scenarioIdx: idx,
        };
      });

      const delay = 3000 + Math.random() * 2200;
      timerRef.current = setTimeout(tick, delay);
    };

    tick();
    return () => clearTimeout(timerRef.current);
  }, []);

  return state;
}
