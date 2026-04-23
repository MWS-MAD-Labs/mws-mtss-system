import { normalizeClassLabel, normalizeGradeLabel } from "./teacherGradeUtils";

export const PILOT_TEACHER_RUNBOOKS = [
    {
        key: "kindergarten",
        matchers: [/kindergarten/i, /\btk\b/i],
        displayName: "Tr. Yohana",
        fullName: "Yohana Setia Risli",
        email: "yohana@millennia21.id",
        className: "Kindergarten - Starlight",
        grade: "Kindergarten",
        unit: "Kindergarten",
        role: "teacher",
        jobPosition: "Homeroom Teacher",
    },
    {
        key: "elementary",
        matchers: [/elementary/i, /\bsd\b/i],
        displayName: "Tr. Tria",
        fullName: "Tria Fadilla",
        email: "triafadilla@millennia21.id",
        className: "Grade 2 - Skyrocket",
        grade: "Grade 2",
        unit: "Elementary",
        role: "teacher",
        jobPosition: "Homeroom Teacher",
    },
    {
        key: "junior-high",
        matchers: [/junior high/i, /\bsmp\b/i],
        displayName: "Tr. Nando",
        fullName: "Vicki Aprinando",
        email: "vickiaprinando@millennia21.id",
        className: "Grade 9 - Messier 87",
        grade: "Grade 9",
        unit: "Junior High",
        role: "teacher",
        jobPosition: "Homeroom Teacher",
    },
];

const defaultTeacherRunbook = PILOT_TEACHER_RUNBOOKS[1];

const buildPreviewClasses = (runbook = {}) => [
    {
        grade: normalizeGradeLabel(runbook.grade || runbook.className || runbook.unit || ""),
        className: normalizeClassLabel(runbook.className || runbook.grade || ""),
        role: runbook.jobPosition || "Homeroom Teacher",
    },
];

export const resolvePilotTeacherRunbook = (user = {}) => {
    const searchSpace = [
        user?.unit,
        user?.department,
        user?.jobPosition,
        user?.currentGrade,
        ...(Array.isArray(user?.classes)
            ? user.classes.flatMap((entry) => [entry?.grade, entry?.className, entry?.subject])
            : []),
    ]
        .filter(Boolean)
        .join(" ");

    return PILOT_TEACHER_RUNBOOKS.find((entry) => entry.matchers.some((pattern) => pattern.test(searchSpace))) || defaultTeacherRunbook;
};

export const getPilotTeacherPreviewKey = (search = "") => {
    try {
        return new URLSearchParams(search).get("pilotTeacher") || "";
    } catch {
        return "";
    }
};

export const findPilotTeacherRunbook = (key = "") =>
    PILOT_TEACHER_RUNBOOKS.find((entry) => entry.key === key) || null;

export const resolvePilotTeacherPreview = (search = "") => {
    const previewKey = getPilotTeacherPreviewKey(search);
    const runbook = findPilotTeacherRunbook(previewKey);
    if (!runbook) return null;

    return {
        ...runbook,
        name: runbook.fullName,
        username: runbook.displayName,
        classes: buildPreviewClasses(runbook),
        currentGrade: runbook.grade,
        __mtssPilotPreview: true,
    };
};

export const appendPilotTeacherPreviewRoute = (route = "", user = {}) => {
    if (!route.startsWith("/mtss/teacher")) return route;

    const runbook = resolvePilotTeacherRunbook(user);
    if (!runbook?.key) return route;

    const [pathname, rawQuery = ""] = route.split("?");
    const params = new URLSearchParams(rawQuery);
    params.set("pilotTeacher", runbook.key);
    return `${pathname}?${params.toString()}`;
};
