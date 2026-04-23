import { useState, useEffect, useMemo } from 'react';
import socketService from '@/services/socketService';
import { NODE_META } from '../constants/nodes';
import { SIM_FLOWS } from '../constants/simFlows';

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';
const ALLOWED_TELEMETRY_ROLES = new Set(['admin', 'superadmin', 'directorate', 'head_unit']);

function getStoredAuthToken() {
  return (
    localStorage.getItem('auth_token')
    || localStorage.getItem('token')
    || sessionStorage.getItem('auth_token')
    || sessionStorage.getItem('token')
    || null
  );
}

function getStoredAuthRole() {
  const raw = (
    localStorage.getItem('auth_user')
    || localStorage.getItem('user')
    || sessionStorage.getItem('auth_user')
    || sessionStorage.getItem('user')
    || null
  );
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return String(parsed?.role || '').toLowerCase() || null;
  } catch {
    return null;
  }
}

export function useTelemetry() {
  const [dataSource, setDataSource] = useState('connecting');
  const [runtime, setRuntime] = useState(null);
  const [simActiveNodes, setSimActiveNodes] = useState(['hub-core']);
  const [simActiveEdges, setSimActiveEdges] = useState([]);
  const [simEvents, setSimEvents] = useState([]);
  const [simModelStats, setSimModelStats] = useState(null);
  const [simSystemStats, setSimSystemStats] = useState({
    totalRequests: 0, liveLatencyMs: 0, tokensPerMin: 0,
    activeWires: 0, healthScore: 99.1, lastEventAt: Date.now(),
  });
  const [simNodeStatuses, setSimNodeStatuses] = useState(() => {
    const s = {};
    Object.keys(NODE_META).forEach(id => {
      s[id] = id === 'hub-core' ? 'active' : 'idle';
    });
    return s;
  });

  /* Fetch initial snapshot */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getStoredAuthToken();
        const role = getStoredAuthRole();
        if (!token || (role && !ALLOWED_TELEMETRY_ROLES.has(role))) {
          if (!cancelled) setDataSource('simulator');
          return;
        }
        const res = await fetch(`${API_BASE}/dev/topology/snapshot`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();
        const data = json?.data || json;
        if (!cancelled && data?.runtime) {
          setRuntime(data.runtime);
          setDataSource('live');
        }
      } catch {
        if (!cancelled) setDataSource('simulator');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* Socket subscription */
  useEffect(() => {
    const token = getStoredAuthToken();
    const role = getStoredAuthRole();
    if (!token || (role && !ALLOWED_TELEMETRY_ROLES.has(role))) {
      return undefined;
    }

    socketService.connect();
    socketService.joinDevTopology();
    const handle = (payload) => {
      const data = payload?.runtime || payload?.data?.runtime || payload;
      if (data?.nodeRuntime || data?.systemStats) {
        setRuntime(data);
        setDataSource('live');
      }
    };
    socketService.onDevTopologyUpdate(handle);
    socketService.onDevTopologySnapshot(handle);
    return () => {
      socketService.offDevTopologyUpdate(handle);
      socketService.offDevTopologySnapshot(handle);
      socketService.leaveDevTopology();
    };
  }, []);

  /* Simulator — fires every ~4s when backend is offline */
  useEffect(() => {
    if (dataSource === 'live') return;
    const interval = setInterval(() => {
      const flow = SIM_FLOWS[Math.floor(Math.random() * SIM_FLOWS.length)];
      const latency = 80 + Math.random() * 400;
      const now = Date.now();

      setSimActiveNodes(flow.nodes);
      setSimActiveEdges(flow.edges);
      setSimNodeStatuses(prev => {
        const next = { ...prev };
        Object.keys(NODE_META).forEach(id => {
          if (flow.nodes.includes(id)) next[id] = 'active';
          else if (next[id] === 'active') next[id] = 'warm';
          else if (Math.random() < 0.15) next[id] = 'idle';
        });
        return next;
      });
      setSimSystemStats(prev => ({
        totalRequests: (prev.totalRequests || 0) + 1,
        liveLatencyMs: Math.round(prev.liveLatencyMs * 0.7 + latency * 0.3),
        tokensPerMin: Math.round(prev.tokensPerMin * 0.8 + (flow.model ? 120 + Math.random() * 300 : 0) * 0.2),
        activeWires: flow.edges.length,
        healthScore: Math.min(99.9, Math.max(92, prev.healthScore + (Math.random() > 0.1 ? 0.05 : -0.3))),
        lastEventAt: now,
        mongoBoostUntil: flow.edges.includes('e-orch-mongo') ? now + 3600 : prev.mongoBoostUntil || 0,
      }));
      setSimModelStats(() => {
        const stats = {};
        ['ai-openai-gpt', 'ai-anthropic-claude', 'ai-google-gemini'].forEach(id => {
          const isAct = id === flow.model;
          stats[id] = {
            rpm: isAct ? Math.round(3 + Math.random() * 12) : 0,
            latencyMs: isAct ? Math.round(latency * 1.5) : 0,
            successRate: 98.5 + Math.random() * 1.4,
            active: isAct, status: isAct ? 'active' : 'idle',
          };
        });
        return stats;
      });
      setSimEvents(prev => [{
        id: `sim-${now}`, title: flow.label, summary: `Simulated ${flow.key}`,
        severity: 'normal', source: 'simulator', at: now,
        latencyMs: Math.round(latency), throughputRpm: Math.round(1 + Math.random() * 8),
        routeKey: flow.key, ok: true,
      }, ...prev].slice(0, 8));
    }, 4000);
    return () => clearInterval(interval);
  }, [dataSource]);

  /* Derived display values */
  const isLive = dataSource === 'live' && runtime;

  const displayActiveNodes = isLive
    ? (runtime.activeContext?.activeNodes || ['hub-core'])
    : simActiveNodes;

  const displayActiveEdges = useMemo(() => {
    return isLive ? (runtime?.activeContext?.activeEdges || []) : simActiveEdges;
  }, [isLive, runtime, simActiveEdges]);

  const displayNodeStatuses = useMemo(() => {
    if (isLive && runtime.nodeRuntime) {
      const s = {};
      Object.entries(runtime.nodeRuntime).forEach(([id, nr]) => {
        s[id] = nr.status || 'idle';
      });
      return s;
    }
    return simNodeStatuses;
  }, [isLive, runtime, simNodeStatuses]);

  const displayEdgeHotness = useMemo(() => {
    if (isLive && runtime.edgeRuntime) {
      const h = {};
      Object.entries(runtime.edgeRuntime).forEach(([id, er]) => {
        h[id] = er.hotness || 0;
      });
      return h;
    }
    const h = {};
    displayActiveEdges.forEach(id => { h[id] = 7; });
    return h;
  }, [isLive, runtime, displayActiveEdges]);

  return {
    dataSource: dataSource === 'live' ? 'live' : 'simulator',
    isLive,
    runtime,
    displayActiveNodes,
    displayActiveEdges,
    displayNodeStatuses,
    displayEdgeHotness,
    displayStats: isLive ? (runtime.systemStats || {}) : simSystemStats,
    displayModelStats: isLive ? (runtime.modelStats || null) : simModelStats,
    displayEvents: isLive ? (runtime.events || []) : simEvents,
    displayViewers: isLive ? (runtime.viewers || 0) : 0,
    displayContext: isLive ? (runtime.activeContext || null) : null,
  };
}
