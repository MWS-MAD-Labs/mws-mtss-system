export const resolveStudentTitle = (student) => {
    if (!student) return "Student Journey";
    const nickname = (student.nickname || "").trim();
    if (nickname) return `${nickname} Journey`;
    const username = (student.username || "").trim();
    if (username) return `${username} Journey`;
    return `${student.name || "Student"} Journey`;
};

export const resolveBadges = (student) => {
    if (!student) {
        return { hub: 0, mtss: 0, profile: 0 };
    }

    const interventionDetails = Array.isArray(student.interventionDetails) ? student.interventionDetails : [];
    const tierRank = (tier = "") => {
        const normalized = String(tier).toLowerCase();
        if (normalized.includes("3")) return 3;
        if (normalized.includes("2")) return 2;
        return 1;
    };

    const primary = interventionDetails.slice().sort((a, b) => tierRank(b?.tier) - tierRank(a?.tier))[0] || null;
    const goals = Array.isArray(primary?.goals) ? primary.goals : [];
    const pendingGoals = goals.filter((goal) => !goal?.completed).length;
    const updates = Array.isArray(primary?.history) ? primary.history.length : 0;

    const mtssBadge = Math.max(pendingGoals, Math.min(9, updates));
    const tierLabel = student?.tier || student?.primaryIntervention?.tier || "";
    const hubBadge = /tier\s*3/i.test(tierLabel) ? 1 : 0;
    const profileBadge = student?.nickname ? 0 : 1;

    return {
        hub: hubBadge,
        mtss: mtssBadge,
        profile: profileBadge,
    };
};

export const resolveTierShortLabel = (tierLabel = "") => (
    /^tier\s*\d+/i.test(tierLabel) ? tierLabel.replace(/tier\s*/i, "T") : tierLabel
);
