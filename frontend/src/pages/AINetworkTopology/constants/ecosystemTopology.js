/* Ecosystem Topology — mesh nodes (modules + core services) and edge definitions */

/* Module nodes — from ECOSYSTEM_MODULES, positioned in outer ring */
export const ECO_NODES = [
  /* Core services — inner ring */
  { id: 'ai-fabric', label: 'AI Fabric', short: 'AI', icon: '⚡', color: '#a78bfa', ring: 0, type: 'core', desc: 'Central AI orchestration layer — routes requests to Gemini, Arcee, StepFun models' },
  { id: 'data-mesh', label: 'Data Mesh', short: 'DB', icon: '🔷', color: '#fbbf24', ring: 0, type: 'core', desc: 'MongoDB Atlas + Redis Cache — unified data access layer' },
  { id: 'auth-core', label: 'Auth Core', short: 'AUTH', icon: '🔑', color: '#fb923c', ring: 0, type: 'core', desc: 'JWT + OAuth2 — centralized identity & RBAC provider' },
  { id: 'realtime-bus', label: 'Realtime Bus', short: 'RT', icon: '📡', color: '#22d3ee', ring: 0, type: 'core', desc: 'Socket.IO event bus — real-time push across all modules' },
  { id: 'api-gateway', label: 'API Gateway', short: 'GW', icon: '🌐', color: '#34d399', ring: 0, type: 'core', desc: 'Express 5 gateway — rate limiting, validation, routing' },

  /* Module nodes — outer ring */
  { id: 'emotion', label: 'Emotional Intelligence', short: 'EMO', icon: '🧠', color: '#a78bfa', ring: 1, type: 'module', desc: 'AI emotion check-in, face detection, wellness tracking' },
  { id: 'ai-chat', label: 'AI Student Assistant', short: 'CHAT', icon: '💬', color: '#38bdf8', ring: 1, type: 'module', desc: 'Arcee AI Trinity conversational assistant' },
  { id: 'staff-chat', label: 'Staff AI Assistant', short: 'STAFF', icon: '🤖', color: '#34d399', ring: 1, type: 'module', desc: 'StepFun Step 3.5 Flash staff assistant' },
  { id: 'insights', label: 'Teacher Insights', short: 'INS', icon: '📊', color: '#f472b6', ring: 1, type: 'module', desc: 'AI-generated student insights & alerts' },
  { id: 'mtss', label: 'MTSS Support', short: 'MTSS', icon: '🛡️', color: '#fbbf24', ring: 1, type: 'module', desc: 'Multi-tiered support system' },
  { id: 'auth', label: 'Auth & Users', short: 'USR', icon: '🔐', color: '#fb923c', ring: 1, type: 'module', desc: 'User management, roles, OAuth' },
  { id: 'dashboard', label: 'Exec Dashboards', short: 'DASH', icon: '📈', color: '#22d3ee', ring: 1, type: 'module', desc: 'KPI monitoring & reporting' },
  { id: 'notifications', label: 'Notifications', short: 'NOTIF', icon: '🔔', color: '#c084fc', ring: 1, type: 'module', desc: 'Push, email, Slack notifications' },
  { id: 'devtools', label: 'Developer Tools', short: 'DEV', icon: '🔧', color: '#94a3b8', ring: 1, type: 'module', desc: 'Topology, telemetry, monitoring' },
];

/* Edges — core-to-module and cross-module correlations */
export const ECO_EDGES = [
  /* AI Fabric connections */
  { id: 'af-emo', from: 'ai-fabric', to: 'emotion', weight: 3 },
  { id: 'af-chat', from: 'ai-fabric', to: 'ai-chat', weight: 3 },
  { id: 'af-staff', from: 'ai-fabric', to: 'staff-chat', weight: 3 },
  { id: 'af-ins', from: 'ai-fabric', to: 'insights', weight: 2 },
  /* Data Mesh connections */
  { id: 'dm-emo', from: 'data-mesh', to: 'emotion', weight: 2 },
  { id: 'dm-ins', from: 'data-mesh', to: 'insights', weight: 3 },
  { id: 'dm-mtss', from: 'data-mesh', to: 'mtss', weight: 2 },
  { id: 'dm-dash', from: 'data-mesh', to: 'dashboard', weight: 2 },
  { id: 'dm-auth', from: 'data-mesh', to: 'auth', weight: 1 },
  /* Auth Core connections */
  { id: 'ac-auth', from: 'auth-core', to: 'auth', weight: 3 },
  { id: 'ac-mtss', from: 'auth-core', to: 'mtss', weight: 1 },
  { id: 'ac-dash', from: 'auth-core', to: 'dashboard', weight: 1 },
  /* Realtime Bus connections */
  { id: 'rb-chat', from: 'realtime-bus', to: 'ai-chat', weight: 3 },
  { id: 'rb-staff', from: 'realtime-bus', to: 'staff-chat', weight: 2 },
  { id: 'rb-notif', from: 'realtime-bus', to: 'notifications', weight: 3 },
  { id: 'rb-dash', from: 'realtime-bus', to: 'dashboard', weight: 2 },
  { id: 'rb-dev', from: 'realtime-bus', to: 'devtools', weight: 2 },
  /* API Gateway connections */
  { id: 'gw-emo', from: 'api-gateway', to: 'emotion', weight: 2 },
  { id: 'gw-mtss', from: 'api-gateway', to: 'mtss', weight: 2 },
  { id: 'gw-notif', from: 'api-gateway', to: 'notifications', weight: 1 },
  /* Cross-core */
  { id: 'af-dm', from: 'ai-fabric', to: 'data-mesh', weight: 2 },
  { id: 'gw-ac', from: 'api-gateway', to: 'auth-core', weight: 2 },
  { id: 'rb-gw', from: 'realtime-bus', to: 'api-gateway', weight: 1 },
  /* Cross-module correlations */
  { id: 'emo-ins', from: 'emotion', to: 'insights', weight: 2 },
  { id: 'ins-dash', from: 'insights', to: 'dashboard', weight: 1 },
  { id: 'mtss-emo', from: 'mtss', to: 'emotion', weight: 1 },
];

/* Simulation scenarios for the ecosystem */
export const ECO_SIM_FLOWS = [
  { title: 'Student Emotion Check-in', active: ['emotion', 'ai-fabric', 'data-mesh', 'api-gateway'], edges: ['af-emo', 'dm-emo', 'gw-emo'], primary: 'emotion' },
  { title: 'AI Chat Session (Student)', active: ['ai-chat', 'ai-fabric', 'realtime-bus'], edges: ['af-chat', 'rb-chat'], primary: 'ai-chat' },
  { title: 'Staff AI Briefing', active: ['staff-chat', 'ai-fabric', 'realtime-bus'], edges: ['af-staff', 'rb-staff'], primary: 'staff-chat' },
  { title: 'Teacher Insight Generation', active: ['insights', 'ai-fabric', 'data-mesh'], edges: ['af-ins', 'dm-ins', 'emo-ins'], primary: 'insights' },
  { title: 'MTSS Tier Evaluation', active: ['mtss', 'data-mesh', 'auth-core', 'api-gateway'], edges: ['dm-mtss', 'ac-mtss', 'gw-mtss', 'mtss-emo'], primary: 'mtss' },
  { title: 'OAuth Login Flow', active: ['auth', 'auth-core', 'data-mesh', 'api-gateway'], edges: ['ac-auth', 'dm-auth', 'gw-ac'], primary: 'auth' },
  { title: 'Dashboard KPI Refresh', active: ['dashboard', 'data-mesh', 'realtime-bus'], edges: ['dm-dash', 'rb-dash', 'ins-dash'], primary: 'dashboard' },
  { title: 'Push Notification Burst', active: ['notifications', 'realtime-bus', 'api-gateway'], edges: ['rb-notif', 'gw-notif'], primary: 'notifications' },
  { title: 'Telemetry Snapshot', active: ['devtools', 'realtime-bus', 'api-gateway'], edges: ['rb-dev', 'rb-gw'], primary: 'devtools' },
  { title: 'Cross-Module Sync', active: ['emotion', 'insights', 'dashboard', 'data-mesh', 'ai-fabric'], edges: ['emo-ins', 'ins-dash', 'dm-ins', 'af-ins', 'dm-dash', 'af-dm'], primary: 'insights' },
  { title: 'Face Scan Verification', active: ['emotion', 'ai-fabric', 'api-gateway', 'data-mesh'], edges: ['af-emo', 'gw-emo', 'dm-emo'], primary: 'emotion' },
  { title: 'Emotion Pattern Analysis', active: ['emotion', 'insights', 'ai-fabric', 'data-mesh'], edges: ['emo-ins', 'af-emo', 'af-ins', 'dm-ins', 'af-dm'], primary: 'emotion' },
];
