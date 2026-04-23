/**
 * Grade and Class normalization utilities
 */

const UNIT_GRADE_MAP = {
    "Junior High": ["Grade 7", "Grade 8", "Grade 9"],
    "Elementary": ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
    "Kindergarten": ["Kindergarten Pre-K", "Kindergarten K1", "Kindergarten K2"],
    Pelangi: ["Kindergarten Pre-K", "Kindergarten K1", "Kindergarten K2"],
};

const GRADE_VARIANTS = {
    "Grade 7": ["Grade 7", "Grade 7 - Helix"],
    "Grade 8": ["Grade 8", "Grade 8 - Cartwheel"],
    "Grade 9": ["Grade 9", "Grade 9 - Messier 87"],
};

export const KINDERGARTEN_GRADES = ["Kindergarten Pre-K", "Kindergarten K1", "Kindergarten K2", "Kindergarten"];

export const KINDERGARTEN_CLASSES = [
    "Kindergarten - Milky Way",
    "Kindergarten - Bear Paw",
    "Kindergarten - Starlight",
];

const STRICT_CLASS_GRADES = new Set(["Grade 1", "Grade 2", "Grade 3", "Grade 4"]);

export const normalizeGradeLabel = (value) => {
    if (!value) return "";
    const raw = value.toString().trim();
    const lower = raw.toLowerCase();

    const gradeMatch = raw.match(/grade\s*\d+/i);
    if (gradeMatch) {
        return gradeMatch[0].replace(/grade/i, "Grade").replace(/\s+/g, " ").trim();
    }
    if (lower.includes("kindergarten") || lower.includes("kindy")) {
        if (/(pre[-\s]?k|prekind)/i.test(raw)) return "Kindergarten Pre-K";
        if (/\bk\s*1\b/i.test(raw)) return "Kindergarten K1";
        if (/\bk\s*2\b/i.test(raw)) return "Kindergarten K2";
        return "Kindergarten";
    }
    return raw.split("-")[0].trim();
};

export const normalizeClassLabel = (value = "") => {
    if (!value) return "";
    const cleaned = value.toString().replace(/\s+/g, " ").trim();
    if (!cleaned) return "";
    const kindergartenMatch = cleaned.match(/^kind(?:ergarten)?(?:\s*-\s*(.*))?$/i);
    if (kindergartenMatch) {
        const suffix = kindergartenMatch[1]?.trim();
        if (!suffix) return "Kindergarten";
        const formatted = suffix
            .split(/\s+/)
            .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
            .join(" ");
        return `Kindergarten - ${formatted}`;
    }
    return cleaned;
};

export const shouldStrictClassFilter = (unit = "", grades = []) => {
    const normalizedUnit = (unit || "").toLowerCase();
    if (normalizedUnit === "kindergarten" || normalizedUnit === "pelangi") return true;
    if (grades.some((grade) => grade.toLowerCase().startsWith("kindergarten"))) return true;
    return grades.some((grade) => STRICT_CLASS_GRADES.has(normalizeGradeLabel(grade)));
};

export const buildGradeQueryValues = (segments = {}) => {
    const values = new Set();
    const addVariants = (grade) => {
        if (!grade) return;
        const normalized = normalizeGradeLabel(grade);
        if (!normalized) return;
        values.add(normalized);
        if (normalized.toLowerCase() === "kindergarten") {
            KINDERGARTEN_GRADES.forEach((entry) => values.add(entry));
            return;
        }
        const variants = GRADE_VARIANTS[normalized];
        if (variants?.length) {
            variants.forEach((variant) => values.add(variant));
        }
    };

    (segments.allowedGrades || []).forEach(addVariants);

    if (!values.size && segments.unit === "Junior High") {
        ["Grade 7", "Grade 8", "Grade 9"].forEach(addVariants);
    }

    return Array.from(values);
};

export const buildClassQueryValues = (segments = {}) =>
    segments.strictClassFilter
        ? Array.from(new Set((segments.allowedClasses || []).map(normalizeClassLabel).filter(Boolean)))
        : [];

export { UNIT_GRADE_MAP, GRADE_VARIANTS };
