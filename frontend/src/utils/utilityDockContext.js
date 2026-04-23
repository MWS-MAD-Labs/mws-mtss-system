const normalizeText = (value = '') => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
const toArray = (value) => (Array.isArray(value) ? value : []);

const toNumber = (value, fallback = null) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const formatOneDecimal = (value) => {
    const numeric = toNumber(value, null);
    if (numeric === null) return null;
    return Math.round(numeric * 10) / 10;
};

const formatPercent = (value) => {
    const numeric = toNumber(value, null);
    if (numeric === null) return null;
    return Math.round(numeric * 10) / 10;
};

const clampText = (value = '', maxLength = 680) => {
    const text = String(value || '');
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1)}...`;
};

const dedupeList = (list = []) => {
    const seen = new Set();
    return toArray(list).filter((item) => {
        const key = String(item || '').trim();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const readTableCellText = (cell) => {
    const raw = String(cell?.innerText || cell?.textContent || '').replace(/\u00a0/g, ' ');
    const parts = raw
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    if (parts.length === 0) return '';
    return clampText(dedupeList(parts).join(' / '), 160);
};

const isEmotionalPatternsRoute = (pathname = '') => /\/profile\/emotional-patterns/i.test(String(pathname || '').trim());
const isEmotionalHistoryRoute = (pathname = '') => /\/profile\/emotional-history/i.test(String(pathname || '').trim());
const isSupportHubRoute = (pathname = '') => /\/(?:student\/support-hub|support-hub)\b/i.test(String(pathname || '').trim());
const isMtssRoute = (pathname = '') => /\/mtss\//i.test(String(pathname || '').trim());
const isEmotionalDashboardRoute = (pathname = '') => /\/emotional-checkin\/(?:dashboard|teacher-dashboard)\b/i.test(String(pathname || '').trim());

const detectRouteFamily = (pathname = '') => {
    const path = String(pathname || '').trim();
    if (isEmotionalPatternsRoute(path)) return 'emotional_patterns';
    if (isEmotionalHistoryRoute(path)) return 'emotional_history';
    if (isSupportHubRoute(path)) return 'support_hub';
    if (isMtssRoute(path)) return 'mtss';
    if (isEmotionalDashboardRoute(path)) return 'emotional_dashboard';
    return 'general';
};

const MTSS_AUTOMATION_ROLES = new Set([
    'teacher',
    'se_teacher',
    'head_unit',
    'principal',
    'directorate',
    'admin',
    'superadmin'
]);

const isStudentRole = (role = '') => String(role || '').trim().toLowerCase() === 'student';
const isAdminRole = (role = '') => ['admin', 'superadmin', 'directorate'].includes(String(role || '').trim().toLowerCase());
const isTeacherScopeRole = (role = '') => ['teacher', 'se_teacher', 'head_unit', 'principal'].includes(String(role || '').trim().toLowerCase());

const getCommandPackByRoute = (routeFamily = 'general', role = '') => {
    const student = isStudentRole(role);

    if (student) {
        const studentByRoute = {
            emotional_patterns: [
                { command: 'analyze my emotional pattern now', outcome: 'instant trend summary + risk signal' },
                { command: 'what should i improve this week', outcome: '3 practical next actions' },
                { command: 'show quick mood insight', outcome: 'dominant mood + recent shift' }
            ],
            emotional_history: [
                { command: 'summarize my emotional history', outcome: 'reflection count + trend snapshot' },
                { command: 'what changed this month', outcome: 'high/low pattern recap' },
                { command: 'build a short wellbeing plan', outcome: 'time-boxed daily plan' }
            ],
            support_hub: [
                { command: 'prioritize my next action', outcome: 'single top priority + why' },
                { command: 'make my study plan today', outcome: 'time-blocked checklist' },
                { command: 'break this task into steps', outcome: 'small actionable sequence' }
            ],
            mtss: [
                { command: 'check my mtss status', outcome: 'tier + active task summary' },
                { command: 'show my focus by subject', outcome: 'subject snapshot in plain language' },
                { command: 'plan my next 20 minutes', outcome: 'micro plan based on current data' }
            ],
            emotional_dashboard: [
                { command: 'summarize emotional check-in status', outcome: 'latest check-in insight' },
                { command: 'what should i do next', outcome: 'next best action now' }
            ],
            general: [
                { command: 'summarize this page', outcome: 'live page summary without route switch' },
                { command: 'help me right now', outcome: 'quick actionable guidance' },
                { command: 'open support hub', outcome: 'safe in-role navigation' }
            ]
        };
        return studentByRoute[routeFamily] || studentByRoute.general;
    }

    const workforceByRoute = {
        mtss: [
            { command: 'rank overdue mtss students', outcome: 'priority triage list' },
            { command: 'draft 20 minute mtss sprint', outcome: 'compact actionable sprint plan' },
            { command: 'log progress check-in now', outcome: 'prepare progress operation payload' }
        ],
        emotional_dashboard: [
            { command: 'summarize emotional check-in status', outcome: 'live dashboard trend recap' },
            { command: 'who needs support first', outcome: 'priority attention order' }
        ],
        support_hub: [
            { command: 'prioritize my top 3 tasks', outcome: 'ranked next actions' },
            { command: 'draft follow-up checklist', outcome: 'quick execution checklist' }
        ],
        emotional_patterns: [
            { command: 'analyze this emotional pattern page', outcome: 'trend insight + attention flags' }
        ],
        emotional_history: [
            { command: 'summarize this emotional history page', outcome: 'timeline overview + pattern shifts' }
        ],
        general: [
            { command: 'summarize this page', outcome: 'live contextual recap' },
            { command: 'open mtss teacher dashboard', outcome: 'safe role-scoped navigation' },
            { command: 'prepare my next action', outcome: 'single practical next step' }
        ]
    };

    const commands = workforceByRoute[routeFamily] || workforceByRoute.general;
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!MTSS_AUTOMATION_ROLES.has(normalizedRole)) {
        return commands;
    }

    const roleSpecificCommands = [];
    if (isTeacherScopeRole(normalizedRole)) {
        roleSpecificCommands.push(
            { command: 'log progress check-in now', outcome: 'run append_mtss_progress_checkin flow' },
            { command: 'create intervention for selected student', outcome: 'run create_mtss_intervention flow' }
        );
    }
    if (isAdminRole(normalizedRole)) {
        roleSpecificCommands.push(
            { command: 'assign students to mtss mentor', outcome: 'run assign_students_to_mtss_mentor flow' },
            { command: 'reassign mentor for assignment', outcome: 'run reassign_mtss_assignment_mentor flow' }
        );
    }

    return [
        ...commands,
        ...roleSpecificCommands,
        { command: 'create intervention for student', outcome: 'run create_mtss_intervention flow' },
        { command: 'assign mentor to intervention', outcome: 'run assign_intervention_mentor flow' },
        { command: 'update assignment status', outcome: 'run update_mtss_assignment_status flow' }
    ].slice(0, 6);
};

export const buildDockCommandPack = ({
    routeFamily = 'general',
    role = ''
} = {}) => {
    const normalizedRoute = String(routeFamily || 'general').trim() || 'general';
    const normalizedRole = String(role || '').trim().toLowerCase();
    const commands = getCommandPackByRoute(normalizedRoute, normalizedRole);
    if (!Array.isArray(commands) || commands.length === 0) return null;

    return {
        id: `${isStudentRole(normalizedRole) ? 'student' : 'workforce'}_${normalizedRoute}`,
        roleScope: isStudentRole(normalizedRole) ? 'student' : 'workforce',
        routeFamily: normalizedRoute,
        commands: commands.slice(0, 6).map((entry = {}) => ({
            command: clampText(entry.command || '', 90),
            outcome: clampText(entry.outcome || '', 110)
        })).filter((entry) => entry.command && entry.outcome)
    };
};

const EMOTIONAL_PATTERN_SUBJECT_REGEX = /(emotional|emotion|emosi|mood|cuaca|weather|pattern|pola|insight)/i;
const EMOTIONAL_PATTERN_ANALYSIS_REGEX = /(penilaian|nilai|analisis|analysis|insight|ringkas|summary|status|review|assessment|laporan|evaluate)/i;
const EMOTIONAL_HISTORY_SUBJECT_REGEX = /(history|riwayat|trend|timeline|refleksi|reflection|history check|histori)/i;
const PAGE_SUMMARY_REGEX = /(ringkas|summary|status|apa yang terjadi|what.*(page|halaman)|overview|insight|review|assessment|jelaskan halaman|analyze this page)/i;
const NEXT_ACTION_REGEX = /(next action|langkah|prioritas|what should i do|apa yang harus|rencana|plan|to do|todo|kerjakan)/i;

export const detectDockLiveInsightIntent = (message = '', pathname = '') => {
    const text = normalizeText(message);
    if (!text) return null;

    const routeFamily = detectRouteFamily(pathname);
    const asksSummary = PAGE_SUMMARY_REGEX.test(text) || EMOTIONAL_PATTERN_ANALYSIS_REGEX.test(text);
    const asksNextAction = NEXT_ACTION_REGEX.test(text);

    if (routeFamily === 'emotional_patterns' && EMOTIONAL_PATTERN_SUBJECT_REGEX.test(text) && asksSummary) {
        return 'emotional_patterns_analysis';
    }

    if (routeFamily === 'emotional_history' && (EMOTIONAL_HISTORY_SUBJECT_REGEX.test(text) || asksSummary)) {
        return 'emotional_history_summary';
    }

    if (routeFamily === 'support_hub' && (asksSummary || asksNextAction)) {
        return 'support_hub_guidance';
    }

    if (routeFamily === 'mtss' && (asksSummary || asksNextAction)) {
        return 'mtss_dashboard_summary';
    }

    if (routeFamily === 'emotional_dashboard' && (asksSummary || asksNextAction || /emotional|check[\s-]?in/i.test(text))) {
        return 'emotional_dashboard_summary';
    }

    if (asksSummary || asksNextAction) {
        return 'page_summary';
    }

    return null;
};

const collectVisibleHeadings = (limit = 6) => {
    if (typeof document === 'undefined') return [];
    const nodes = Array.from(document.querySelectorAll('main h1, main h2, main h3, [data-ai-context-title], [data-ai-context]'));
    const values = [];
    for (const node of nodes) {
        const text = String(node?.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text) continue;
        if (values.includes(text)) continue;
        values.push(text);
        if (values.length >= limit) break;
    }
    return values;
};

const collectVisibleTextLines = (limit = 22) => {
    if (typeof document === 'undefined') return [];
    const main = document.querySelector('main');
    if (!main) return [];
    const lines = String(main.innerText || '')
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter((line) => line.length >= 3 && line.length <= 120);
    return dedupeList(lines).slice(0, limit);
};

const collectVisibleActions = (limit = 10) => {
    if (typeof document === 'undefined') return [];
    const main = document.querySelector('main');
    if (!main) return [];

    const selectors = [
        'button',
        'a[href]',
        '[role="button"]',
        '[data-ai-action]'
    ];

    const nodes = Array.from(main.querySelectorAll(selectors.join(',')));
    const actionLabels = [];
    for (const node of nodes) {
        const label = String(
            node?.getAttribute?.('aria-label')
            || node?.dataset?.aiAction
            || node?.textContent
            || ''
        )
            .replace(/\s+/g, ' ')
            .trim();
        if (!label) continue;
        if (label.length < 3 || label.length > 72) continue;
        actionLabels.push(label);
        if (actionLabels.length >= limit) break;
    }
    return dedupeList(actionLabels).slice(0, limit);
};

const collectTableSnapshot = (maxTables = 2) => {
    if (typeof document === 'undefined') return [];
    const main = document.querySelector('main');
    if (!main) return [];

    const tables = Array.from(main.querySelectorAll('table')).slice(0, maxTables);
    return tables.map((table, index) => {
        const headers = dedupeList(
            Array.from(table.querySelectorAll('thead th, th'))
                .map((cell) => readTableCellText(cell))
                .filter(Boolean)
        ).slice(0, 7);

        const bodyRows = (
            table.tBodies?.length
                ? Array.from(table.tBodies).flatMap((section) => Array.from(section.rows || []))
                : Array.from(table.querySelectorAll('tr')).filter((row) => !row.closest('thead'))
        ).slice(0, 6);
        const rows = bodyRows.map((row) =>
            Array.from(row.querySelectorAll('td, th'))
                .map((cell) => readTableCellText(cell))
                .filter(Boolean)
                .slice(0, 7)
        ).filter((cells) => {
            if (cells.length === 0) return false;
            if (headers.length === 0) return true;
            return normalizeText(cells.join(' | ')) !== normalizeText(headers.join(' | '));
        });

        return {
            tableIndex: index,
            headers,
            rows
        };
    }).filter((table) => table.rows.length > 0);
};

const METRIC_VALUE_REGEX = /^(?:\d+(?:[.,]\d+)?%?|tier\s*\d+|grade\s*\d+|[0-9]+\s*(?:students?|tasks?|assignments?|goals?|days?|kali|rows?)?)$/i;

const extractMetricHighlightsFromLines = (lines = [], limit = 6) => {
    const values = [];
    for (let index = 0; index < lines.length; index += 1) {
        const current = String(lines[index] || '').trim();
        if (!current) continue;
        if (!METRIC_VALUE_REGEX.test(current)) continue;
        const previous = String(lines[index - 1] || '').trim();
        if (!previous || METRIC_VALUE_REGEX.test(previous)) continue;
        values.push({
            label: previous.slice(0, 70),
            value: current.slice(0, 40)
        });
        if (values.length >= limit) break;
    }
    return values;
};

const buildDomPageSnapshot = (routeFamily = 'general') => {
    const lines = collectVisibleTextLines(24);
    return {
        routeFamily,
        headings: collectVisibleHeadings(6),
        lines: lines.slice(0, 20),
        quickActions: collectVisibleActions(10),
        metricHighlights: extractMetricHighlightsFromLines(lines, 7),
        tableSnapshot: collectTableSnapshot(2)
    };
};

const buildMoodCount = (checkins = []) => {
    const moodCount = {};
    checkins.forEach((checkin = {}) => {
        const moods = toArray(checkin.selectedMoods);
        moods.forEach((mood) => {
            const key = String(mood || '').trim();
            if (!key) return;
            moodCount[key] = (moodCount[key] || 0) + 1;
        });
    });
    return moodCount;
};

const buildWeatherCount = (checkins = []) => {
    const weatherCount = {};
    checkins.forEach((checkin = {}) => {
        const key = String(checkin.weatherType || '').trim();
        if (!key) return;
        weatherCount[key] = (weatherCount[key] || 0) + 1;
    });
    return weatherCount;
};

const buildSortedTopEntries = (counter = {}, limit = 3, total = 1) =>
    Object.entries(counter)
        .sort(([, left], [, right]) => Number(right || 0) - Number(left || 0))
        .slice(0, limit)
        .map(([label, count]) => ({
            label,
            count: Number(count || 0),
            percentage: formatPercent((Number(count || 0) / Math.max(total, 1)) * 100)
        }));

const getRecentCheckinDateLabel = (checkins = []) => {
    const withDate = checkins
        .map((checkin = {}) => new Date(checkin.createdAt || checkin.date || checkin.updatedAt))
        .filter((date) => Number.isFinite(date?.getTime?.()));
    if (withDate.length === 0) return null;
    const latest = withDate.sort((left, right) => right.getTime() - left.getTime())[0];
    return latest.toISOString();
};

export const buildEmotionalPatternsSnapshot = (checkinHistory = []) => {
    const checkins = toArray(checkinHistory).slice(0, 120);
    if (checkins.length === 0) return null;

    const weatherCount = buildWeatherCount(checkins);
    const moodCount = buildMoodCount(checkins);
    const presenceValues = checkins.map((checkin = {}) => toNumber(checkin.presenceLevel, null)).filter((value) => value !== null);
    const capacityValues = checkins.map((checkin = {}) => toNumber(checkin.capacityLevel, null)).filter((value) => value !== null);

    const avgPresence = presenceValues.length > 0
        ? formatOneDecimal(presenceValues.reduce((sum, value) => sum + value, 0) / presenceValues.length)
        : null;
    const avgCapacity = capacityValues.length > 0
        ? formatOneDecimal(capacityValues.reduce((sum, value) => sum + value, 0) / capacityValues.length)
        : null;

    const lowPresenceDays = presenceValues.filter((value) => value < 5).length;
    const lowCapacityDays = capacityValues.filter((value) => value < 5).length;

    return {
        totalCheckins: checkins.length,
        averagePresence: avgPresence,
        averageCapacity: avgCapacity,
        lowPresenceDays,
        lowCapacityDays,
        topWeather: buildSortedTopEntries(weatherCount, 3, checkins.length),
        topMoods: buildSortedTopEntries(moodCount, 5, checkins.length).map(({ label, count }) => ({ label, count })),
        latestCheckinAt: getRecentCheckinDateLabel(checkins)
    };
};

const buildEmotionalHistorySnapshot = (checkinHistory = []) => {
    const checkins = toArray(checkinHistory).slice(0, 120);
    if (checkins.length === 0) return null;

    const moodCount = buildMoodCount(checkins);
    const presenceValues = checkins.map((checkin = {}) => toNumber(checkin.presenceLevel, null)).filter((value) => value !== null);
    const capacityValues = checkins.map((checkin = {}) => toNumber(checkin.capacityLevel, null)).filter((value) => value !== null);

    return {
        totalReflections: checkins.length,
        averagePresence: presenceValues.length > 0
            ? formatOneDecimal(presenceValues.reduce((sum, value) => sum + value, 0) / presenceValues.length)
            : null,
        averageCapacity: capacityValues.length > 0
            ? formatOneDecimal(capacityValues.reduce((sum, value) => sum + value, 0) / capacityValues.length)
            : null,
        topMoods: buildSortedTopEntries(moodCount, 4, checkins.length).map(({ label, count }) => ({ label, count })),
        latestReflectionAt: getRecentCheckinDateLabel(checkins)
    };
};

const buildSupportHubSnapshot = (pageSnapshot = {}) => ({
    options: toArray(pageSnapshot?.quickActions).slice(0, 6),
    highlights: toArray(pageSnapshot?.headings).slice(0, 4)
});

const buildMtssSnapshot = (pageSnapshot = {}) => ({
    metrics: toArray(pageSnapshot?.metricHighlights).slice(0, 6),
    quickActions: toArray(pageSnapshot?.quickActions).slice(0, 6),
    table: toArray(pageSnapshot?.tableSnapshot).slice(0, 1)
});

export const buildUtilityDockContextPayload = ({
    pathname = '',
    role = '',
    user = {},
    checkinHistory = []
} = {}) => {
    const normalizedPath = String(pathname || '').trim() || '/';
    const normalizedRole = String(role || '').trim().toLowerCase();
    const userName = String(user?.name || user?.nickname || '').trim();
    const routeFamily = detectRouteFamily(normalizedPath);
    const pageSnapshot = buildDomPageSnapshot(routeFamily);

    const context = {
        route: normalizedPath,
        routeFamily,
        role: normalizedRole,
        userName,
        visibleHeadings: pageSnapshot.headings,
        pageSnapshot
    };

    if (routeFamily === 'emotional_patterns') {
        context.emotionalPatterns = buildEmotionalPatternsSnapshot(checkinHistory);
    }

    if (routeFamily === 'emotional_history') {
        context.emotionalHistory = buildEmotionalHistorySnapshot(checkinHistory);
    }

    if (routeFamily === 'support_hub') {
        context.supportHub = buildSupportHubSnapshot(pageSnapshot);
    }

    if (routeFamily === 'mtss' || routeFamily === 'emotional_dashboard') {
        context.mtss = buildMtssSnapshot(pageSnapshot);
    }

    return context;
};

const serializeTablePreview = (tableSnapshot = []) => {
    const firstTable = toArray(tableSnapshot)[0];
    if (!firstTable) return '';
    const headerText = toArray(firstTable.headers).join(' | ');
    const rowPreview = toArray(firstTable.rows)
        .slice(0, 3)
        .map((row, index) => `row_${index + 1}: ${toArray(row).join(' | ')}`)
        .join(' ; ');
    return clampText([headerText ? `headers: ${headerText}` : '', rowPreview].filter(Boolean).join(' ; '), 700);
};

export const composeDockContextMessage = ({
    message = '',
    context = {},
    commandPack = null
} = {}) => {
    const userMessage = String(message || '').trim();
    if (!userMessage) return '';

    const pageSnapshot = context?.pageSnapshot || {};
    const commandLines = toArray(commandPack?.commands)
        .slice(0, 6)
        .map((entry = {}) => `${entry.command} => ${entry.outcome}`)
        .filter(Boolean)
        .join(' | ');
    const blocks = [
        '[DOCK_RUNTIME_CONTEXT]',
        `route: ${String(context?.route || '/').trim() || '/'}`,
        context?.routeFamily ? `route_family: ${String(context.routeFamily).trim()}` : '',
        context?.role ? `role: ${String(context.role).trim()}` : '',
        context?.userName ? `user_name: ${String(context.userName).trim()}` : '',
        Array.isArray(context?.visibleHeadings) && context.visibleHeadings.length > 0
            ? `visible_sections: ${context.visibleHeadings.join(' | ')}`
            : '',
        Array.isArray(pageSnapshot?.metricHighlights) && pageSnapshot.metricHighlights.length > 0
            ? `metric_highlights: ${clampText(JSON.stringify(pageSnapshot.metricHighlights), 620)}`
            : '',
        Array.isArray(pageSnapshot?.quickActions) && pageSnapshot.quickActions.length > 0
            ? `visible_actions: ${pageSnapshot.quickActions.slice(0, 7).join(' | ')}`
            : '',
        serializeTablePreview(pageSnapshot?.tableSnapshot)
            ? `table_preview: ${serializeTablePreview(pageSnapshot?.tableSnapshot)}`
            : '',
        Array.isArray(pageSnapshot?.lines) && pageSnapshot.lines.length > 0
            ? `page_lines: ${clampText(pageSnapshot.lines.slice(0, 12).join(' | '), 620)}`
            : '',
        context?.emotionalPatterns
            ? `emotional_patterns_snapshot: ${clampText(JSON.stringify(context.emotionalPatterns), 620)}`
            : '',
        context?.emotionalHistory
            ? `emotional_history_snapshot: ${clampText(JSON.stringify(context.emotionalHistory), 620)}`
            : '',
        context?.mtss
            ? `mtss_snapshot: ${clampText(JSON.stringify(context.mtss), 620)}`
            : '',
        commandPack?.id ? `command_pack_id: ${String(commandPack.id).trim()}` : '',
        commandPack?.roleScope ? `command_pack_scope: ${String(commandPack.roleScope).trim()}` : '',
        commandLines ? `command_pack_commands: ${clampText(commandLines, 620)}` : '',
        'instruction: You are running in inline dock mode. Use runtime context as trusted current-page data. Answer directly from this context, stay concise, and do not claim lack of page access when context exists.',
        'instruction_2: Keep user in current workspace unless user explicitly asks navigation.',
        'instruction_3: If user asks for one of command_pack commands, answer with concrete action-ready output (short checklist/table style when useful).',
        '[/DOCK_RUNTIME_CONTEXT]',
        `User message: ${userMessage}`
    ].filter(Boolean);

    return blocks.join('\n');
};

const formatMetric = (label, value, suffix = '') => {
    if (value === null || value === undefined || value === '') return null;
    return `• ${label}: ${value}${suffix}`;
};

const formatDateCompact = (isoValue) => {
    if (!isoValue) return null;
    try {
        const date = new Date(isoValue);
        if (!Number.isFinite(date.getTime())) return null;
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(date);
    } catch {
        return null;
    }
};

const buildPageSummaryReply = ({ context = {}, assistantName = 'Milo', studentCallName = 'there' } = {}) => {
    const pageSnapshot = context?.pageSnapshot || {};
    const heading = toArray(pageSnapshot.headings)[0] || toArray(context?.visibleHeadings)[0] || 'this page';
    const metrics = toArray(pageSnapshot.metricHighlights).slice(0, 3)
        .map((entry = {}) => `• ${entry.label}: ${entry.value}`);
    const actions = toArray(pageSnapshot.quickActions).slice(0, 3);
    const table = toArray(pageSnapshot.tableSnapshot)[0];
    const tableLine = table ? `• Table detected: ${toArray(table.headers).slice(0, 4).join(', ')}` : null;

    const lines = [
        `${assistantName}: Got it ${studentCallName}, here is a live summary of ${heading}.`,
        ...metrics,
        tableLine,
        actions.length > 0 ? `• Available quick actions: ${actions.join(' | ')}` : null
    ].filter(Boolean);

    return lines.join('\n');
};

const buildSupportHubReply = ({ context = {}, assistantName = 'Milo', studentCallName = 'there' } = {}) => {
    const support = context?.supportHub || {};
    const options = toArray(support.options).slice(0, 5);
    const highlights = toArray(support.highlights).slice(0, 3);
    const lines = [
        `${assistantName}: Got it ${studentCallName}, I can read your Support Hub live.`,
        highlights.length > 0 ? `• Page focus: ${highlights.join(' | ')}` : null,
        options.length > 0 ? `• Quick options you can run now: ${options.join(' | ')}` : null,
        '• Suggested next step: pick 1 main priority first, then send a more specific command so I can break it into practical steps.'
    ].filter(Boolean);
    return lines.join('\n');
};

const buildMtssReply = ({ context = {}, assistantName = 'Milo', studentCallName = 'there' } = {}) => {
    const mtss = context?.mtss || {};
    const metrics = toArray(mtss.metrics).slice(0, 4);
    const actions = toArray(mtss.quickActions).slice(0, 4);
    const table = toArray(mtss.table)[0];
    const headers = table ? toArray(table.headers).slice(0, 5) : [];
    const tablePreview = table
        ? toArray(table.rows).slice(0, 2).map((row) => {
            const cells = toArray(row).slice(0, 5).map((cell) => clampText(cell, 80));
            if (headers.length > 0) {
                return `  - ${cells.map((cell, index) => `${headers[index] || `Col ${index + 1}`}: ${cell}`).join(' • ')}`;
            }
            return `  - ${cells.join(' | ')}`;
        }).join('\n')
        : '';

    const lines = [
        `${assistantName}: Okay ${studentCallName}, here is a live MTSS snapshot from your current page.`,
        ...metrics.map((entry = {}) => `• ${entry.label}: ${entry.value}`),
        headers.length > 0 ? `• Table columns: ${headers.join(', ')}` : null,
        tablePreview ? `• Sample rows:\n${tablePreview}` : null,
        actions.length > 0 ? `• Detected quick actions: ${actions.join(' | ')}` : null,
        '• For real-time actions, send a specific command (example: "draft progress check-in for student X", "summarize overdue assignments", "prepare today follow-up checklist").'
    ].filter(Boolean);

    return lines.join('\n');
};

const buildEmotionalHistoryReply = ({ context = {}, assistantName = 'Milo', studentCallName = 'there' } = {}) => {
    const history = context?.emotionalHistory;
    if (!history || !history.totalReflections) {
        return `${assistantName}: I cannot find enough Emotional History data on this page yet.`;
    }

    const topMoodLabels = toArray(history.topMoods)
        .slice(0, 3)
        .map((item = {}) => `${item.label} (${item.count})`)
        .join(', ');

    const lines = [
        `${assistantName}: Got it ${studentCallName}, here is a live summary of your Emotional History.`,
        formatMetric('Total reflections', history.totalReflections),
        formatMetric('Average Presence', history.averagePresence, '/10'),
        formatMetric('Average Capacity', history.averageCapacity, '/10'),
        topMoodLabels ? `• Dominant moods: ${topMoodLabels}` : null,
        history.latestReflectionAt ? `• Latest reflection: ${formatDateCompact(history.latestReflectionAt)}` : null
    ].filter(Boolean);

    return lines.join('\n');
};

const buildEmotionalPatternsReply = ({ context = {}, assistantName = 'Milo', studentCallName = 'there' } = {}) => {
    const snapshot = context?.emotionalPatterns;
    if (!snapshot || !snapshot.totalCheckins) {
        return `${assistantName}: I cannot find enough Emotional Patterns data on this page yet. Try refreshing the check-in data, then ask again.`;
    }

    const topWeather = Array.isArray(snapshot.topWeather) ? snapshot.topWeather[0] : null;
    const topMoodLabels = Array.isArray(snapshot.topMoods)
        ? snapshot.topMoods.slice(0, 3).map((item) => `${item.label} (${item.count})`).join(', ')
        : '';

    const riskScore = Number(snapshot.lowPresenceDays || 0) + Number(snapshot.lowCapacityDays || 0);
    const riskLabel = riskScore >= 10 ? 'needs high attention' : riskScore >= 4 ? 'needs moderate attention' : 'stable';
    const latestCheckin = formatDateCompact(snapshot.latestCheckinAt);

    const lines = [
        `${assistantName}: Got it ${studentCallName}, here is a live assessment from your Emotional Patterns page.`,
        formatMetric('Total check-in', snapshot.totalCheckins),
        topWeather
            ? `• Dominant emotional weather: ${topWeather.label} (${topWeather.percentage}%)`
            : null,
        topMoodLabels ? `• Top moods: ${topMoodLabels}` : null,
        formatMetric('Average Presence', snapshot.averagePresence, '/10'),
        formatMetric('Average Capacity', snapshot.averageCapacity, '/10'),
        `• Current trend status: ${riskLabel}`,
        latestCheckin ? `• Latest check-in: ${latestCheckin}` : null,
        '• Quick recommendation: continue daily check-ins and follow up when Presence/Capacity drops below 5.'
    ].filter(Boolean);

    return lines.join('\n');
};

export const buildLiveDockInsightReply = ({
    intent = '',
    context = {},
    assistantName = 'Milo',
    studentCallName = 'there'
} = {}) => {
    if (!intent) return null;

    if (intent === 'emotional_patterns_analysis') {
        return buildEmotionalPatternsReply({ context, assistantName, studentCallName });
    }
    if (intent === 'emotional_history_summary') {
        return buildEmotionalHistoryReply({ context, assistantName, studentCallName });
    }
    if (intent === 'support_hub_guidance') {
        return buildSupportHubReply({ context, assistantName, studentCallName });
    }
    if (intent === 'mtss_dashboard_summary' || intent === 'emotional_dashboard_summary') {
        return buildMtssReply({ context, assistantName, studentCallName });
    }
    if (intent === 'page_summary') {
        return buildPageSummaryReply({ context, assistantName, studentCallName });
    }

    return null;
};

export default {
    detectDockLiveInsightIntent,
    buildDockCommandPack,
    buildUtilityDockContextPayload,
    composeDockContextMessage,
    buildLiveDockInsightReply,
    buildEmotionalPatternsSnapshot
};
