import { normalizeAssistantIntentText } from './assistantIntentNormalizer';

const COMMON_ALLOWED_ROUTES = new Set([
    '/profile',
    '/profile/personal-stats',
    '/profile/emotional-history',
    '/profile/emotional-patterns',
    '/ai-assistant'
]);

const STUDENT_ALLOWED_ROUTES = new Set([
    ...COMMON_ALLOWED_ROUTES,
    '/student/support-hub',
    '/student/emotional-checkin',
    '/student/emotional-checkin/manual',
    '/student/emotional-checkin/ai',
    '/student/emotional-checkin/face-scan',
    '/student/ai-chat',
    '/mtss/student-portal'
]);

const WORKFORCE_BASE_ROUTES = new Set([
    ...COMMON_ALLOWED_ROUTES,
    '/support-hub',
    '/emotional-checkin',
    '/emotional-checkin/staff',
    '/mtss',
    '/select-role'
]);

const NAVIGATION_CUE_REGEX = /(bawa(kan)?|antar(kan)?|mau ke|ingin ke|ke halaman|pindah(kan)?|arahin|arahkan|redirect|go to|open|navigate|buka(\s+halaman)?|masuk ke|take me|bring me|visit|show me)/i;
const HELP_CUE_REGEX = /(bantu(in)?|tolong|help me|could you|can you|please|dong|donk|plz)/i;
const QUERY_CONTEXT_REGEX = /(\?|bagaimana|gimana|status|what|how|why|siapa|who|berapa|kapan|where|mana|jelaskan|explain|ringkas|summary|summari[sz]e|draft|buatkan|analisis|analyze|laporan|report)/i;
const THEME_ACTION_CUE_REGEX = /(ubah(in)?|ganti(in)?|switch|set|jadikan|turn|toggle|apply|change|pindah(kan)?|aktifkan|enable|pakai|ubah tampilan)/i;
const THEME_CONTEXT_REGEX = /(theme|tema|mode|appearance|tampilan)/i;
const THEME_TARGET_DARK_REGEX = /(dark(\s*mode)?|mode\s*gelap|tema\s*gelap|night\s*mode|ke\s*dark|jadi\s*dark|jadikan\s*gelap)/i;
const THEME_TARGET_LIGHT_REGEX = /(light(\s*mode)?|mode\s*terang|mode\s*cerah|tema\s*terang|day\s*mode|ke\s*light|jadi\s*light|jadikan\s*terang)/i;
const THEME_TOGGLE_REGEX = /(toggle\s*(theme|mode)|switch\s*(theme|mode)|change\s*(theme|mode)|ganti\s*(theme|tema|mode)|ubah\s*(theme|tema|mode))/i;

const COMMON_ROUTE_INTENTS = [
    {
        intent: 'open_profile_personal_stats',
        label: 'Personal Stats',
        navigateTo: '/profile/personal-stats',
        patterns: [/(personal stats|statistik personal|my stats|halaman stats|statistik saya)/i]
    },
    {
        intent: 'open_profile_emotional_history',
        label: 'Emotional History',
        navigateTo: '/profile/emotional-history',
        patterns: [/(emotional history|riwayat emosi|history emosi|riwayat check[\s-]?in|histori emosi)/i]
    },
    {
        intent: 'open_profile_emotional_patterns',
        label: 'Emotional Insights',
        navigateTo: '/profile/emotional-patterns',
        patterns: [/(emotional patterns?|emotion insights?|insight emosi|pola emosi|trend emosi|tren emosi)/i]
    },
    {
        intent: 'open_profile',
        label: 'Profile',
        navigateTo: '/profile',
        patterns: [/(halaman\s+profile|halaman\s+profil|my profile|profile page|profile|profil|akun saya|account settings|pengaturan akun|settings profile|setting profile)/i]
    }
];

const STUDENT_ROUTE_INTENTS = [
    {
        intent: 'open_student_ai_chat',
        label: 'AI Chat',
        navigateTo: '/student/ai-chat',
        patterns: [/(ai assistant|assistant chat|chat ai|jarvis|open assistant|personal assistant|ai chat|asisten ai|chat room)/i]
    },
    {
        intent: 'open_manual_emotional_checkin',
        label: 'Manual Emotional Check-in',
        navigateTo: '/student/emotional-checkin/manual',
        patterns: [/(manual check[\s-]?in|check[\s-]?in manual|chekcin manual|chekin manual|manual reflection|tulis manual|manual mood|manual emosi)/i]
    },
    {
        intent: 'open_face_scan_emotional_checkin',
        label: 'Face Scan Emotional Check-in',
        navigateTo: '/student/emotional-checkin/face-scan',
        patterns: [/(face scan|scan wajah|analisis wajah|kamera|camera|selfie|emotion scan|scan emosi)/i]
    },
    {
        intent: 'open_ai_emotional_checkin',
        label: 'AI Emotional Check-in',
        navigateTo: '/student/emotional-checkin/ai',
        patterns: [/(ai check[\s-]?in|ai emotional|analisis ai|emotion ai|check[\s-]?in ai)/i]
    },
    {
        intent: 'open_emotional_checkin_home',
        label: 'Emotional Check-in',
        navigateTo: '/student/emotional-checkin',
        patterns: [/(emotional check[\s-]?in|check[\s-]?in|chekcin|chekin|wellbeing check|cek emosi|check in)/i]
    },
    {
        intent: 'open_student_support_hub',
        label: 'Student Support Hub',
        navigateTo: '/student/support-hub',
        patterns: [/(support hub|student support|wellbeing activity|halaman support|support page|hub support)/i]
    },
    {
        intent: 'open_mtss_student_portal',
        label: 'MTSS Student Portal',
        navigateTo: '/mtss/student-portal',
        patterns: [/(student portal|portal student|mtss portal|portal mtss)/i]
    }
];

const WORKFORCE_ROUTE_INTENTS = [
    {
        intent: 'open_ai_assistant',
        label: 'AI Assistant',
        navigateTo: '/ai-assistant',
        patterns: [/(ai assistant|assistant chat|chat ai|jarvis|open assistant|personal assistant|ai chat)/i]
    },
    {
        intent: 'open_support_hub',
        label: 'Support Hub',
        navigateTo: '/support-hub',
        patterns: [/(support hub|halaman support|wellbeing activity|hub support)/i]
    },
    {
        intent: 'open_staff_emotional_checkin',
        label: 'Emotional Check-in',
        navigateTo: '/emotional-checkin/staff',
        patterns: [/(emotional check[\s-]?in|check[\s-]?in|chekcin|chekin|wellbeing check|cek emosi|staff checkin)/i]
    },
    {
        intent: 'open_teacher_dashboard',
        label: 'Teacher Dashboard',
        navigateTo: '/emotional-checkin/teacher-dashboard',
        patterns: [/(teacher dashboard|dashboard teacher|mentor dashboard)/i]
    },
    {
        intent: 'open_emotional_dashboard',
        label: 'Emotional Dashboard',
        navigateTo: '/emotional-checkin/dashboard',
        patterns: [/(emotional dashboard|unit dashboard|dashboard)/i]
    },
    {
        intent: 'open_mtss_teacher_dashboard',
        label: 'MTSS Teacher Dashboard',
        navigateTo: '/mtss/teacher',
        patterns: [/(mtss teacher|mtss dashboard|mentor assignment|portal mtss|mtss)/i]
    },
    {
        intent: 'open_mtss_admin_dashboard',
        label: 'MTSS Admin Dashboard',
        navigateTo: '/mtss/admin',
        patterns: [/(mtss admin|kelola mtss|manage mtss|admin mtss)/i]
    },
    {
        intent: 'open_role_selection',
        label: 'Role Selection',
        navigateTo: '/select-role',
        patterns: [/(role selection|select role|pilih role|pilih peran)/i]
    },
    {
        intent: 'open_user_management',
        label: 'User Management',
        navigateTo: '/user-management',
        patterns: [/(user management|manage users|manajemen user|kelola user)/i]
    }
];

const normalizeText = (value = '') => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();

const normalizeRole = (role = '') => String(role || '').trim().toLowerCase();
const normalizeTheme = (theme = '') => (String(theme || '').trim().toLowerCase() === 'dark' ? 'dark' : 'light');
const getThemeIncantation = (theme = 'light') => (normalizeTheme(theme) === 'dark' ? 'Nox' : 'Lumos Maxima');

const isStudentRole = (role = '') => normalizeRole(role) === 'student';

export const getAssistantAllowedRoutes = (role = 'student') => {
    if (isStudentRole(role)) return STUDENT_ALLOWED_ROUTES;

    const normalizedRole = normalizeRole(role);
    const routes = new Set([...WORKFORCE_BASE_ROUTES]);

    if (['teacher', 'se_teacher', 'head_unit', 'principal', 'directorate', 'admin', 'superadmin'].includes(normalizedRole)) {
        routes.add('/emotional-checkin/teacher-dashboard');
        routes.add('/mtss/teacher');
    }

    if (['head_unit', 'principal', 'directorate', 'admin', 'superadmin'].includes(normalizedRole)) {
        routes.add('/emotional-checkin/dashboard');
    }

    if (['admin', 'superadmin', 'directorate'].includes(normalizedRole)) {
        routes.add('/mtss/admin');
        routes.add('/user-management');
    }

    return routes;
};

export const isAssistantRouteAllowed = (path = '', role = 'student') =>
    getAssistantAllowedRoutes(role).has(String(path || '').trim());

export const sanitizeAssistantNavigateAction = (action = {}, role = 'student') => {
    if (!action || typeof action !== 'object') return null;
    if (String(action.type || '').toLowerCase() !== 'navigate') return null;

    const navigateTo = String(action.navigateTo || '').trim();
    if (!isAssistantRouteAllowed(navigateTo, role)) return null;

    return {
        type: 'navigate',
        intent: String(action.intent || 'assistant_navigation'),
        navigateTo,
        label: String(action.label || 'Assistant page'),
        autoNavigate: true,
        confidence: Number(action.confidence || 0.9)
    };
};

const getRoleIntents = (role = 'student') => (
    isStudentRole(role)
        ? [...COMMON_ROUTE_INTENTS, ...STUDENT_ROUTE_INTENTS]
        : [...COMMON_ROUTE_INTENTS, ...WORKFORCE_ROUTE_INTENTS]
);

export const detectAssistantNavigationIntent = (message = '', role = 'student') => {
    const rawText = normalizeText(message);
    if (!rawText) return null;
    const text = normalizeAssistantIntentText(rawText, {
        userKey: normalizeRole(role) || 'global'
    });
    const intents = getRoleIntents(role);
    const isStudent = isStudentRole(role);

    const hasNavigationCue = NAVIGATION_CUE_REGEX.test(text);
    const hasHelpCue = HELP_CUE_REGEX.test(text);
    const isQueryLike = QUERY_CONTEXT_REGEX.test(text);
    const directRouteMention = /\/(?:student|profile|mtss|support|emotional-checkin|ai-assistant|user-management)\//i.test(rawText);
    const maxDirectIntentWords = 8;
    let routeIntentMatch = intents.find((routeIntent) => routeIntent.patterns.some((pattern) => pattern.test(text)));
    if (!isStudent && /(mtss|mentor assignment|intervention|intervensi|portal mtss)/i.test(text)) {
        const prioritizedMtssIntent = intents.find(
            (routeIntent) =>
                routeIntent.intent === 'open_mtss_teacher_dashboard'
                && routeIntent.patterns.some((pattern) => pattern.test(text))
        );
        if (prioritizedMtssIntent) {
            routeIntentMatch = prioritizedMtssIntent;
        }
    }
    if (routeIntentMatch) {
        const isShortDirectCommand = text.split(/\s+/).filter(Boolean).length <= maxDirectIntentWords;
        const safeAction = sanitizeAssistantNavigateAction({
            type: 'navigate',
            intent: routeIntentMatch.intent,
            navigateTo: routeIntentMatch.navigateTo,
            label: routeIntentMatch.label,
            autoNavigate: true,
            confidence: 0.9
        }, role);
        const allowShortIntent = isShortDirectCommand && !isQueryLike && !hasHelpCue;
        if (safeAction && (hasNavigationCue || directRouteMention || allowShortIntent)) return safeAction;
    }

    if (!hasNavigationCue && !directRouteMention) return null;

    const directRouteMatch = rawText.match(/\/[a-z0-9/_-]+/i);
    if (directRouteMatch) {
        const navigateTo = String(directRouteMatch[0] || '').trim();
        return sanitizeAssistantNavigateAction({
            type: 'navigate',
            intent: 'open_direct_route',
            navigateTo,
            label: 'Requested Page',
            autoNavigate: true,
            confidence: 0.9
        }, role);
    }

    return null;
};

export const detectAssistantThemeIntent = (message = '', currentTheme = 'light') => {
    const rawText = normalizeText(message);
    if (!rawText) return null;
    const text = normalizeAssistantIntentText(rawText, {
        userKey: 'theme'
    });

    const asksDark = THEME_TARGET_DARK_REGEX.test(text);
    const asksLight = THEME_TARGET_LIGHT_REGEX.test(text);
    const asksToggle = THEME_TOGGLE_REGEX.test(text);
    const hasThemeContext = THEME_CONTEXT_REGEX.test(text) || asksDark || asksLight || asksToggle;
    if (!hasThemeContext) return null;

    const hasActionCue = THEME_ACTION_CUE_REGEX.test(text) || HELP_CUE_REGEX.test(text);
    if (!hasActionCue && !asksToggle) return null;

    const previousTheme = normalizeTheme(currentTheme);
    let targetTheme = previousTheme;

    if (asksToggle || (asksDark && asksLight)) {
        targetTheme = previousTheme === 'dark' ? 'light' : 'dark';
    } else if (asksDark) {
        targetTheme = 'dark';
    } else if (asksLight) {
        targetTheme = 'light';
    } else {
        return null;
    }

    return {
        type: 'set_theme',
        intent: targetTheme === 'dark' ? 'set_theme_dark' : 'set_theme_light',
        label: targetTheme === 'dark' ? 'Dark Mode' : 'Light Mode',
        previousTheme,
        targetTheme,
        incantation: getThemeIncantation(targetTheme),
        autoApply: true,
        confidence: 0.96
    };
};

// Backward compatibility wrappers
export const isStudentRouteAllowed = (path = '') => isAssistantRouteAllowed(path, 'student');
export const sanitizeStudentNavigateAction = (action = {}) => sanitizeAssistantNavigateAction(action, 'student');
export const detectStudentAssistantNavigationIntent = (message = '') => detectAssistantNavigationIntent(message, 'student');
