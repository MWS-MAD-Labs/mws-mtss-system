const PILOT_STEP_GUIDES = {
    "dashboard-overview": {
        pageType: "admin",
        adminTab: "overview",
        title: "Start with the overview summary",
        description: "Scan the cards and distribution panels first. This step is about checking whether the overview tells a truthful MTSS story at a glance.",
        bullets: [
            "Read the tier and intervention summaries before opening any student.",
            "If the visible roster is Tier 1 only, intervention types should stay empty.",
        ],
    },
    "mentor-assignment": {
        pageType: "admin",
        adminTab: "mentors",
        title: "Review ownership first, then test one handoff",
        description: "This page already shows the mentor workflow. Start by reading the ownership guidance, then try one Assign action for a special-case handoff.",
        bullets: [
            "Classroom ownership is automatic for homeroom teachers.",
            "Use Assign only for subject-specific or exceptional ownership changes.",
        ],
        mentorAction: "assign",
    },
    "students-filters": {
        pageType: "admin",
        adminTab: "students",
        title: "Begin with the filter bar above the roster",
        description: "Use grade, tier, type, and mentor filters first. The goal is to prove principals can narrow the roster quickly without losing context.",
        bullets: [
            "Try at least two filter combinations.",
            "Then search one student name and confirm the list stays consistent.",
        ],
        panelArea: "filters",
    },
    "create-intervention": {
        pageType: "teacher",
        teacherTab: "create",
        title: "Complete one plan from top to bottom",
        description: "You are already on the teacher plan builder. Fill the student, focus area, tier, baseline, target, and monitoring fields before saving.",
        bullets: [
            "Use 5 different students for the pilot workload.",
            "Keep the plan quantitative: baseline, target, and measurable progress.",
        ],
        formAction: "save-plan",
    },
    "edit-intervention": {
        pageType: "teacher",
        teacherTab: "students",
        title: "Click one Edit Plan action in the roster",
        description: "Open My Students and use the cyan Edit Plan action on an active intervention. This tests whether teachers can refine a live plan without losing history.",
        bullets: [
            "Use Edit Plan only when the current plan needs revision.",
            "Do not create a new plan if the same intervention only needs adjustment.",
        ],
        studentAction: "edit",
    },
    "submit-progress": {
        pageType: "teacher",
        teacherTab: "students",
        title: "Click the amber progress icon to log an update",
        description: "Use the Progress Update action in the roster. That opens the fast update flow, where principals can test quick logging and then compare it with the fuller progress experience.",
        bullets: [
            "Each pilot intervention should reach at least 3 weekly updates.",
            "Use Quick Update for one entry and the fuller progress flow for another.",
        ],
        studentAction: "progress",
    },
    "evidence-growth": {
        pageType: "teacher",
        teacherTab: "students",
        title: "Open one progress action, then upload evidence",
        description: "Start from a student with existing progress history. Open the progress flow first, then attach evidence and review the intervention timeline.",
        bullets: [
            "Attach one evidence item to a recent check-in.",
            "Confirm the growth story is clear from baseline to latest update.",
        ],
        studentAction: "progress",
    },
    "student-detail": {
        pageType: "admin",
        adminTab: "students",
        title: "Open one student row from the roster",
        description: "Pick one pilot student from the list to test whether the full profile gives enough context for follow-up decisions.",
        bullets: [
            "Use the roster to choose a student with active support.",
            "Check whether the profile explains ownership, status, and next action clearly.",
        ],
        studentAction: "view",
    },
    "ai-assistant-insights": {
        pageType: "teacher",
        teacherTab: "dashboard",
        title: "Start from the teacher dashboard signals",
        description: "Review any teacher-facing insight or alert on the dashboard first. Then open AI Assistant and ask one plan question plus one progress question.",
        bullets: [
            "Use a specific student or intervention when asking AI.",
            "Judge whether the answer is practical enough for real teacher follow-up.",
        ],
    },
    "mentor-visibility": {
        pageType: "admin",
        adminTab: "mentors",
        title: "Compare class ownership and manual cases",
        description: "This step stays on the mentor roster. Review how many students are owned automatically versus how many are manual exception cases.",
        bullets: [
            "Use the card metrics to compare ownership load.",
            "Look for any mentor whose manual cases feel unusually high.",
        ],
    },
    "analytics": {
        pageType: "admin",
        adminTab: "analytics",
        title: "Read the charts from top to bottom",
        description: "Stay in Analytics Lab and scan the summary, success-by-type, trend, and movement panels in order.",
        bullets: [
            "Check whether progress data is populated and believable.",
            "Look for any chart that feels incomplete, confusing, or empty by mistake.",
        ],
    },
    "decision-simulation": {
        pageType: "admin",
        adminTab: "students",
        title: "Choose one student from the roster for the wrap-up",
        description: "Use the roster to open one real case. This final guided step should feel like a realistic principal decision review, not just another list scan.",
        bullets: [
            "Pick one student with active intervention history.",
            "Use the profile and latest progress to decide what should happen next.",
        ],
        studentAction: "view",
    },
};

export const getPilotStepKey = (search = "") => {
    try {
        return new URLSearchParams(search).get("pilotStep") || "";
    } catch {
        return "";
    }
};

export const appendPilotStepRoute = (route = "", stepId = "") => {
    if (!route || !stepId) return route;

    const [pathname, rawQuery = ""] = route.split("?");
    const params = new URLSearchParams(rawQuery);
    params.set("pilotStep", stepId);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
};

export const resolvePilotStepGuide = (search = "") => {
    const stepId = getPilotStepKey(search);
    if (!stepId) return null;

    const guide = PILOT_STEP_GUIDES[stepId];
    if (!guide) return null;

    return {
        stepId,
        ...guide,
    };
};
