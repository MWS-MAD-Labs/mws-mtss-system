const TYPO_MEMORY_STORAGE_KEY = 'assistant_intent_typo_memory_v1';
const MAX_TYPO_MEMORY_ENTRIES = 180;

const DEFAULT_INTENT_LEXICON = [
    // Navigation cues
    'bawa', 'bawakan', 'antar', 'mau', 'ingin', 'halaman', 'pindah', 'arahkan', 'redirect',
    'go', 'to', 'open', 'navigate', 'buka', 'masuk', 'take', 'me', 'bring', 'visit', 'show',
    'help', 'bantu', 'tolong', 'please', 'dong', 'donk', 'plz',
    // Theme controls
    'theme', 'tema', 'mode', 'appearance', 'tampilan', 'dark', 'light', 'toggle', 'switch', 'set',
    'turn', 'change', 'ubah', 'ganti', 'aktifkan', 'enable', 'pakai', 'jadikan',
    // Product domains
    'profile', 'profil', 'stats', 'history', 'patterns', 'insights', 'assistant', 'jarvis',
    'support', 'hub', 'student', 'portal', 'mtss', 'emotional', 'checkin', 'manual', 'face',
    'scan', 'ai', 'teacher', 'dashboard', 'role', 'selection', 'user', 'management',
    'class', 'kelas', 'homework', 'task', 'tasks', 'goal', 'goals', 'progress', 'intervention',
    'strategi', 'strategy', 'monitor', 'wellbeing', 'check'
];

const INTENT_LEXICON = Array.from(new Set(DEFAULT_INTENT_LEXICON.map((item) => String(item).toLowerCase())));
const INTENT_LEXICON_SET = new Set(INTENT_LEXICON);

const normalizeSpaceLower = (value = '') => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
const normalizeUserKey = (value = '') => normalizeSpaceLower(value || 'global') || 'global';
const resolveDistanceLimit = (length = 0) => (length <= 8 ? 1 : 2);

const getStorage = () => {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

let typoMemoryCache = null;

const trimTypoMemory = (memory = {}) => {
    const entries = Object.entries(memory)
        .filter(([, value]) => value && typeof value === 'object')
        .sort(([, left], [, right]) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0))
        .slice(0, MAX_TYPO_MEMORY_ENTRIES);
    return Object.fromEntries(entries);
};

const loadTypoMemory = () => {
    if (typoMemoryCache) return typoMemoryCache;
    const storage = getStorage();
    if (!storage) {
        typoMemoryCache = {};
        return typoMemoryCache;
    }

    try {
        const parsed = JSON.parse(storage.getItem(TYPO_MEMORY_STORAGE_KEY) || '{}');
        typoMemoryCache = trimTypoMemory(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
        typoMemoryCache = {};
    }
    return typoMemoryCache;
};

const persistTypoMemory = (memory = {}) => {
    const safeMemory = trimTypoMemory(memory);
    typoMemoryCache = safeMemory;
    const storage = getStorage();
    if (!storage) return;
    try {
        storage.setItem(TYPO_MEMORY_STORAGE_KEY, JSON.stringify(safeMemory));
    } catch {
        // Ignore storage write failures (private mode / quota).
    }
};

const damerauLevenshteinWithin = (source = '', target = '', maxDistance = 1) => {
    const a = String(source || '');
    const b = String(target || '');
    const aLength = a.length;
    const bLength = b.length;
    if (a === b) return 0;
    if (Math.abs(aLength - bLength) > maxDistance) return maxDistance + 1;

    const matrix = Array.from({ length: aLength + 1 }, () => new Array(bLength + 1).fill(0));
    for (let i = 0; i <= aLength; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= bLength; j += 1) matrix[0][j] = j;

    for (let i = 1; i <= aLength; i += 1) {
        let rowMin = Number.POSITIVE_INFINITY;
        for (let j = 1; j <= bLength; j += 1) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            let value = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );

            if (
                i > 1
                && j > 1
                && a[i - 1] === b[j - 2]
                && a[i - 2] === b[j - 1]
            ) {
                value = Math.min(value, matrix[i - 2][j - 2] + 1);
            }

            matrix[i][j] = value;
            if (value < rowMin) rowMin = value;
        }

        if (rowMin > maxDistance) return maxDistance + 1;
    }

    return matrix[aLength][bLength];
};

const rememberCorrection = (token = '', target = '', userKey = 'global') => {
    const safeToken = normalizeSpaceLower(token);
    const safeTarget = normalizeSpaceLower(target);
    if (!safeToken || !safeTarget || safeToken === safeTarget || !INTENT_LEXICON_SET.has(safeTarget)) return;

    const now = Date.now();
    const memory = loadTypoMemory();
    [`${normalizeUserKey(userKey)}:${safeToken}`, `global:${safeToken}`].forEach((key) => {
        const previous = memory[key] || {};
        memory[key] = {
            target: safeTarget,
            hits: Number(previous.hits || 0) + 1,
            updatedAt: now
        };
    });
    persistTypoMemory(memory);
};

const getLearnedCorrection = (token = '', userKey = 'global') => {
    const safeToken = normalizeSpaceLower(token);
    if (!safeToken) return null;
    const memory = loadTypoMemory();
    const keys = [`${normalizeUserKey(userKey)}:${safeToken}`, `global:${safeToken}`];
    for (const key of keys) {
        const entry = memory[key];
        const target = normalizeSpaceLower(entry?.target || '');
        if (!INTENT_LEXICON_SET.has(target)) continue;
        memory[key] = {
            ...entry,
            hits: Number(entry?.hits || 0) + 1,
            updatedAt: Date.now()
        };
        persistTypoMemory(memory);
        return target;
    }
    return null;
};

const findClosestLexiconToken = (token = '', maxDistance = 1) => {
    const safeToken = normalizeSpaceLower(token);
    if (!safeToken || safeToken.length < 3) return null;

    let bestCandidate = null;
    let bestDistance = maxDistance + 1;
    for (const candidate of INTENT_LEXICON) {
        if (candidate[0] !== safeToken[0]) continue;
        if (Math.abs(candidate.length - safeToken.length) > maxDistance) continue;
        const distance = damerauLevenshteinWithin(safeToken, candidate, maxDistance);
        if (distance < bestDistance) {
            bestDistance = distance;
            bestCandidate = candidate;
            if (distance === 0) break;
        }
    }
    return bestDistance <= maxDistance ? bestCandidate : null;
};

const normalizeIntentToken = (token = '', options = {}) => {
    const safeToken = normalizeSpaceLower(token);
    if (!safeToken || safeToken.length < 3 || safeToken.length > 24) return safeToken;
    if (INTENT_LEXICON_SET.has(safeToken)) return safeToken;

    const userKey = normalizeUserKey(options.userKey || 'global');
    const learned = getLearnedCorrection(safeToken, userKey);
    if (learned) return learned;

    const maxDistance = resolveDistanceLimit(safeToken.length);
    const candidate = findClosestLexiconToken(safeToken, maxDistance);
    if (!candidate || candidate === safeToken) return safeToken;

    if (options.learn !== false) {
        rememberCorrection(safeToken, candidate, userKey);
    }
    return candidate;
};

export const normalizeAssistantIntentText = (value = '', options = {}) => {
    const text = normalizeSpaceLower(value);
    if (!text) return '';

    const userKey = normalizeUserKey(options.userKey || 'global');
    return text.replace(/\b[a-z0-9]{3,24}\b/g, (token) => normalizeIntentToken(token, {
        userKey,
        learn: options.learn !== false
    }));
};

export default {
    normalizeAssistantIntentText
};
