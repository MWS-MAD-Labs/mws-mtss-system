const MALE_GENDER_KEYS = new Set([
    'm',
    'male',
    'man',
    'pria',
    'l',
    'lk',
    'laki',
    'laki-laki',
    'laki laki'
]);

const FEMALE_GENDER_KEYS = new Set([
    'f',
    'female',
    'woman',
    'wanita',
    'p',
    'pr',
    'perempuan'
]);

const stripTitlePrefix = (rawName = '') =>
    String(rawName || '')
        .replace(/^(mr\.?\s*\/\s*ms\.?|ms\.?\s*\/\s*mr\.?|mr\.?\s*or\s*ms\.?)\s*/i, '')
        .replace(/^(mr\.?|ms\.?|mrs\.?|miss|pak|bpk|bapak|bu|ibu)\s+/i, '')
        .trim();

const normalizeGenderToken = (genderValue = '') =>
    String(genderValue || '')
        .trim()
        .toLowerCase()
        .replace(/\./g, '');

const inferSalutationFromName = (rawName = '') => {
    const normalized = String(rawName || '').trim().toLowerCase();
    if (/^(mr\.?\s*\/\s*ms\.?|ms\.?\s*\/\s*mr\.?|mr\.?\s*or\s*ms\.?)\b/.test(normalized)) return '';
    if (/^(mr\.?|pak|bpk|bapak)\b/.test(normalized)) return 'Mr.';
    if (/^(ms\.?|mrs\.?|miss|bu|ibu)\b/.test(normalized)) return 'Ms.';
    return '';
};

export const resolveStaffSalutation = (gender, rawName = '') => {
    const normalizedGender = normalizeGenderToken(gender);
    if (MALE_GENDER_KEYS.has(normalizedGender)) return 'Mr.';
    if (FEMALE_GENDER_KEYS.has(normalizedGender)) return 'Ms.';

    return inferSalutationFromName(rawName);
};

export const resolveStaffGender = (user = {}) =>
    user?.gender ||
    user?.sex ||
    user?.jenisKelamin ||
    user?.profile?.gender ||
    user?.profile?.sex ||
    user?.profile?.jenisKelamin ||
    '';

export const formatStaffDisplayName = ({ name, username, nickname, gender, fallback = 'Staff' } = {}) => {
    const rawName =
        String(nickname || '').trim() ||
        String(username || '').trim() ||
        String(name || '').trim() ||
        fallback;

    const cleanName = stripTitlePrefix(rawName) || fallback;
    const salutation = resolveStaffSalutation(gender, rawName);
    return `${salutation} ${cleanName}`.trim();
};

export const getStaffGreetingPeriod = (date = new Date()) => {
    const hour = Number(date?.getHours?.() ?? 0);
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
};

export const buildStaffGreeting = (name, templatesByPeriod, date = new Date()) => {
    const period = getStaffGreetingPeriod(date);
    const templates = Array.isArray(templatesByPeriod?.[period]) ? templatesByPeriod[period] : [];
    if (!templates.length) return `Hello ${name}`;

    const seed = date.getDate() + date.getMonth() + date.getHours();
    const template = templates[seed % templates.length];
    return String(template || '').replaceAll('%NAME%', name);
};
