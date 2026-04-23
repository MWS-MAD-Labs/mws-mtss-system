import { getMtssAccessProfile } from "@/utils/mtssAccess";
import {
    appendPilotTeacherPreviewRoute,
} from "../utils/pilotTeacherPreview";
import { appendPilotStepRoute } from "../utils/pilotStepGuidance";

export const PILOT_PROGRESS_STORAGE_KEY = "mtss:pilot-testing:progress";

export const principalBriefingChecklist = [
    {
        id: "navigation-first",
        title: "Start from the MTSS home flow",
        points: [
            "Use Start step to open MTSS in a new tab, then move through the product from the normal landing page instead of being dropped directly into deep pages.",
            "Admin review starts from /mtss/admin?tab=overview, then principals navigate to the needed tab on their own.",
            "Teacher-experience steps start from the Teacher Dashboard so principals understand the real navigation teachers will use.",
        ],
    },
    {
        id: "ownership-model",
        title: "Explain the ownership model clearly",
        points: [
            "Homeroom teachers are automatically linked to the students in their own class.",
            "Manual mentor assignment is only for subject-specific mentoring or another special case where the owner is not the homeroom teacher.",
            "Principals should be able to explain why clear ownership matters before any progress update is submitted.",
        ],
    },
    {
        id: "plan-structure",
        title: "Teach the plan structure in concrete terms",
        points: [
            "A complete intervention plan must include student, subject or type, tier, goal, baseline, target, start date, monitoring frequency, and monitoring method.",
            "The workflow is quantitative for every unit, including Kindergarten.",
            "Editing a plan should refine the active plan, while progress updates should document what happened over time without erasing the plan history.",
        ],
    },
    {
        id: "minimum-workload",
        title: "Set the minimum pilot workload",
        points: [
            "Use the agreed pilot teacher account for the unit: Kindergarten = Tr. Yohana, Elementary = Tr. Tria, Junior High = Tr. Nando.",
            "Create 5 intervention plans across 5 different students from the pilot class, with varied subjects and Tier 2 or Tier 3 combinations.",
            "Each pilot intervention must end up with at least 3 dated progress updates, spaced one week apart.",
        ],
    },
];

export const pilotSteps = [
    {
        id: "start-context",
        order: 0,
        title: "Start & Context",
        duration: "3 min",
        routeKey: "hub",
        primaryActionLabel: "Open briefing hub",
        routeGuidance:
            "The main button keeps you on the pilot hub. Use the route chips only if you want to pre-open the admin dashboard or teacher dashboard in another tab before starting the walkthrough.",
        goal: "Understand the pilot rules, how feedback works, and which teacher account should be used for the unit.",
        principalTask:
            "Approach the pilot as both a reviewer and a trainer. Every step should help the principal decide whether the workflow is clear enough to teach back to teachers without product-team assistance.",
        pageHints: ["/mtss/pilot-testing", "/mtss/admin?tab=overview", "/mtss/teacher?tab=dashboard"],
        actions: [
            "Read the time box, submission rules, and the teacher-account instruction for your unit before opening MTSS.",
            "Note that Start step opens MTSS in a new tab so this guide stays available in the current tab.",
            "Note that final feedback unlocks only after step feedback has been submitted for every guided step.",
        ],
        technicalFocus: [
            "The principal should understand the difference between admin review pages and teacher working pages.",
            "The system should feel self-guided enough that a tester can move step by step without needing live support.",
        ],
        teacherTalkingPoints: [
            "Teachers mainly work from the Teacher Dashboard, while principals review the wider picture from the Admin Dashboard.",
            "Every unit uses the same quantitative MTSS logic: baseline, target, progress updates, and evidence.",
            "Step feedback is submitted throughout the pilot, not only at the end.",
        ],
        expectedOutcome:
            "The principal understands the pilot structure, the correct teacher account for the unit, and the rule that each step becomes complete automatically after step feedback is saved.",
        featureKeys: ["guided-pilot-briefing", "testing-flow-clarity", "new-tab-guidance", "feedback-rules"],
    },
    {
        id: "dashboard-overview",
        order: 1,
        title: "Admin Dashboard Overview",
        duration: "5 min",
        routeKey: "overview",
        primaryActionLabel: "Open admin dashboard",
        routeGuidance:
            "The main button opens the admin dashboard landing page for this unit. Stay on System Overview first and review that screen before moving anywhere else.",
        goal: "Validate whether the overview gives a truthful summary of tiers, intervention load, and the newest activity.",
        principalTask:
            "Use the overview to answer a teacher lead's first questions: how many students are visible, which tier is most urgent, and whether active intervention work is happening right now.",
        pageHints: ["/mtss/admin?tab=overview"],
        actions: [
            "Open MTSS Admin Dashboard and stay on System Overview first.",
            "Review summary cards, tier distribution, intervention types, recent activity, and mentor spotlight.",
            "Check the logic carefully: if every visible student is still Tier 1, there should be no active intervention types shown.",
            "Decide what feels most urgent based on the overview alone.",
        ],
        technicalFocus: [
            "Tier and intervention cards should reflect real active intervention data, not placeholder counts.",
            "The overview should let principals spot inconsistencies quickly without opening each student one by one.",
        ],
        teacherTalkingPoints: [
            "The overview is for monitoring the system, not for entering intervention plans.",
            "Consistent teacher updates are what make the overview trustworthy for leadership review.",
        ],
        expectedOutcome:
            "The principal can read the system summary quickly and confirm that Tier 1-only views do not falsely display intervention activity.",
        featureKeys: ["overview-cards", "tier-summary", "recent-activity", "system-snapshot", "mentor-spotlight", "intervention-integrity"],
    },
    {
        id: "mentor-assignment",
        order: 2,
        title: "Mentor Assignment & Management",
        duration: "6 min",
        routeKey: "mentors",
        startRouteKey: "mentors",
        primaryActionLabel: "Open Manage Mentors",
        routeGuidance:
            "The main button opens the Manage Mentors tab for this step so principals land on the ownership and assignment workflow directly.",
        goal: "Test ownership review and the special-case mentor assignment flow without skipping the natural navigation path.",
        principalTask:
            "Confirm the principal can explain that class teachers already own their own class roster automatically, while manual mentor assignment is reserved for subject-specific or exceptional ownership changes.",
        pageHints: ["/mtss/admin?tab=overview", "/mtss/admin?tab=mentors", "/mtss/admin/assign/:mentorId"],
        actions: [
            "Use the main button to open the Manage Mentors tab.",
            "Review the roster and confirm that class teachers are already connected to their usual class ownership automatically.",
            "Open one mentor assignment page only to test the manual flow for a subject-specific or special-case handoff.",
            "If you assign a student manually, return to the roster and confirm the change appears immediately.",
        ],
        technicalFocus: [
            "The page should clearly separate automatic classroom ownership from manual exception handling.",
            "The roster should show enough ownership context that principals do not confuse homeroom coverage with special-case mentoring.",
        ],
        teacherTalkingPoints: [
            "Teachers do not need to assign every student manually when they already own the class.",
            "Manual mentor assignment is only needed when the support owner is someone outside the normal homeroom structure.",
        ],
        expectedOutcome:
            "The principal understands the automatic classroom ownership model and can still test the manual mentor-assignment workflow for exceptions.",
        featureKeys: ["mentor-roster", "mentor-assignment", "student-selection", "assignment-confirmation", "automatic-class-ownership", "special-case-mentoring"],
    },
    {
        id: "students-filters",
        order: 3,
        title: "Students List & Filters",
        duration: "5 min",
        routeKey: "students",
        startRouteKey: "students",
        primaryActionLabel: "Open All Students",
        routeGuidance:
            "The main button opens the All Students tab for this step so principals can start testing filters and search immediately.",
        goal: "Check whether the roster, search, and filters help principals find the right students quickly from the normal admin flow.",
        principalTask:
            "Test whether the principal can guide a teacher lead toward the exact student list they need, using grade, tier, subject, and mentor context without getting lost.",
        pageHints: ["/mtss/admin?tab=overview", "/mtss/admin?tab=students"],
        actions: [
            "Use the main button to open the All Students tab.",
            "Try at least two filter combinations using grade, tier, intervention type, and mentor.",
            "Search for one specific student by name and confirm the result stays consistent with the active filters.",
            "Check whether the list remains understandable when more students are loaded.",
        ],
        technicalFocus: [
            "Filters should not reset unexpectedly while the principal is narrowing the roster.",
            "Search, paging, and filter state should stay in sync so the principal always knows what is being viewed.",
        ],
        teacherTalkingPoints: [
            "This list is useful when principals coach teams on which students need review first.",
            "A clean roster helps teacher leads focus on real intervention cases, not just general student lists.",
        ],
        expectedOutcome:
            "The principal can locate targeted students confidently and the roster behaves predictably with layered filters.",
        featureKeys: ["students-roster", "grade-filter", "tier-filter", "type-filter", "mentor-filter", "search", "pagination"],
    },
    {
        id: "create-intervention",
        order: 4,
        title: "Create Intervention Plan",
        duration: "8 min",
        routeKey: "teacher-dashboard",
        startRouteKey: "teacher-create",
        primaryActionLabel: "Open teacher dashboard preview",
        routeGuidance:
            "The main button opens the unit teacher dashboard preview first so principals can follow the real teacher path from the normal teacher landing page.",
        requiresTeacherPersona: true,
        goal: "Walk through the full teacher workflow for creating intervention plans from the real teacher starting point.",
        principalTask:
            "Use the agreed teacher account for the unit and verify that a teacher can move from Teacher Dashboard to Create Intervention without confusion, then complete a full quantitative plan accurately.",
        pageHints: ["/mtss/teacher?tab=dashboard", "/mtss/teacher?tab=create"],
        actions: [
            "Use the main button to open the unit teacher dashboard preview, then click Create Intervention from the teacher navigation.",
            "Create 5 intervention plans across 5 different students from the unit pilot class, with varied subjects and a mix of Tier 2 and Tier 3 plans.",
            "For each plan, complete student, subject or type, tier, strategy, goal, baseline, target, monitoring frequency, monitoring method, and start date.",
            "Confirm the same quantitative structure works in exactly the same way for Kindergarten, Elementary, and Junior High.",
        ],
        technicalFocus: [
            "Baseline and target should be measurable values, not narrative statements.",
            "Teachers need to understand that the strategy explains the support method, while the goal describes the gap being closed.",
            "The create flow should make it obvious which fields are required before the plan can be saved.",
        ],
        teacherTalkingPoints: [
            "Start from Teacher Dashboard, then move to Create Intervention when a new support plan is needed.",
            "The plan should explain the gap, the starting point, the target, and how progress will be measured.",
            "MTSS stays quantitative in every unit, including Kindergarten.",
        ],
        expectedOutcome:
            "Five pilot interventions can be created from the teacher workflow without ambiguity, using one consistent quantitative form across all units.",
        featureKeys: ["intervention-creation", "teacher-navigation", "student-selection", "type-selection", "tier-configuration", "goal-setting", "monitoring-setup", "cross-unit-consistency"],
    },
    {
        id: "edit-intervention",
        order: 5,
        title: "Edit Intervention Plan",
        duration: "5 min",
        routeKey: "teacher-dashboard",
        startRouteKey: "teacher-students",
        primaryActionLabel: "Open teacher dashboard preview",
        routeGuidance:
            "The main button opens the teacher dashboard preview so the principal can move like a teacher from the normal starting page.",
        requiresTeacherPersona: true,
        goal: "Verify that teachers can revise active plans without breaking plan history or confusing the original intent of the intervention.",
        principalTask:
            "Make sure the principal can explain when a teacher should edit the active plan instead of creating a new one or jumping straight into a progress update.",
        pageHints: ["/mtss/teacher?tab=dashboard", "/mtss/teacher?tab=students", "/mtss/teacher?tab=edit"],
        actions: [
            "Use the main button to open the teacher dashboard preview, then click My Students.",
            "Open at least 2 active pilot interventions and choose Edit Plan.",
            "Adjust plan details such as target, monitoring frequency, monitoring method, or strategy note.",
            "Save the changes and verify the plan still keeps its existing progress history.",
        ],
        technicalFocus: [
            "Editing a plan should refine the existing intervention rather than erase or duplicate it.",
            "Teachers should be able to recognize which fields are safe to change during a review cycle.",
        ],
        teacherTalkingPoints: [
            "Use Edit Plan when the support approach or target needs revision after review.",
            "Do not create a brand-new intervention if the original plan simply needs adjustment.",
        ],
        expectedOutcome:
            "The principal can edit active plans from the teacher workflow and confirm that plan history and progress records remain intact.",
        featureKeys: ["intervention-editing", "plan-modification", "change-log", "edit-confirmation", "audit-trail"],
    },
    {
        id: "submit-progress",
        order: 6,
        title: "Submit Progress & Quick Update",
        duration: "7 min",
        routeKey: "teacher-dashboard",
        startRouteKey: "teacher-students",
        primaryActionLabel: "Open teacher dashboard preview",
        routeGuidance:
            "The main button opens the teacher dashboard preview first because teachers usually reach progress work from there.",
        requiresTeacherPersona: true,
        goal: "Test both fast and detailed progress logging, with enough repeated updates to prove the intervention history is usable.",
        principalTask:
            "Confirm that the principal can teach teachers how to keep intervention history current through both Quick Update and the fuller progress form.",
        pageHints: ["/mtss/teacher?tab=dashboard", "/mtss/teacher?tab=students"],
        actions: [
            "Use the main button to open the teacher dashboard preview, then go to My Students and open the pilot interventions for the unit class.",
            "For every pilot intervention, make sure there are at least 3 progress updates total with different dates spaced one week apart. Add missing updates if needed.",
            "Use Quick Update for at least one of the weekly entries and use the full progress form for at least one other entry.",
            "Check that every saved update lands in the correct intervention history and date order.",
        ],
        technicalFocus: [
            "Quick Update should cover fast logging, while the full form should support more complete documentation.",
            "The history should show correct dates, values, notes, and performed or skipped status without duplication.",
        ],
        teacherTalkingPoints: [
            "Quick Update is for fast logging; the full form is for clearer documentation when more context is needed.",
            "Progress updates should always stay aligned with the plan's baseline, target, and monitoring method.",
        ],
        expectedOutcome:
            "Each pilot intervention shows a believable timeline with at least 3 weekly progress entries, and the principal understands when to use fast versus detailed logging.",
        featureKeys: ["progress-submission", "quick-update-modal", "score-entry", "progress-history", "weekly-update-cadence", "cross-unit-consistency"],
    },
    {
        id: "evidence-growth",
        order: 7,
        title: "Evidence Upload & Growth Journey",
        duration: "5 min",
        routeKey: "teacher-dashboard",
        startRouteKey: "teacher-students",
        primaryActionLabel: "Open teacher dashboard preview",
        routeGuidance:
            "The main button opens the teacher dashboard preview because this step should begin from the same workspace teachers normally use.",
        requiresTeacherPersona: true,
        goal: "Check whether teachers can attach supporting evidence and review a meaningful growth timeline from the intervention history.",
        principalTask:
            "Test whether the principal can explain how evidence and the growth journey strengthen progress conversations with teachers and parents.",
        pageHints: ["/mtss/teacher?tab=dashboard", "/mtss/teacher?tab=students", "/mtss/student/:slug"],
        actions: [
            "Use the main button to open the teacher dashboard preview, then open My Students and select one pilot intervention that already has progress history.",
            "Upload at least one evidence file to a recent check-in.",
            "Confirm the uploaded file appears in the evidence viewer.",
            "Open the student's Growth Journey and check whether the timeline reflects baseline, current progress, and target clearly.",
        ],
        technicalFocus: [
            "Evidence should attach to the correct progress entry and remain easy to review afterward.",
            "The growth journey should feel like a timeline of change, not just a list of disconnected updates.",
        ],
        teacherTalkingPoints: [
            "Evidence adds credibility when teachers explain progress to principals or parents.",
            "The Growth Journey helps show whether the learning gap is actually closing over time.",
        ],
        expectedOutcome:
            "Evidence can be attached cleanly and the Growth Journey makes the intervention story easier to understand over time.",
        featureKeys: ["evidence-upload", "evidence-viewer", "evidence-lightbox", "growth-journey", "growth-history", "progress-timeline"],
    },
    {
        id: "student-detail",
        order: 8,
        title: "Student Profile & Detail View",
        duration: "5 min",
        routeKey: "students",
        startRouteKey: "students",
        primaryActionLabel: "Open All Students",
        routeGuidance:
            "The main button opens the All Students tab because the student profile should be reached from roster context for this step.",
        goal: "Confirm that one student page provides enough context for follow-up coaching and decision making.",
        principalTask:
            "Review whether one student profile contains enough context for a principal to understand the case without needing a technical teammate to interpret it.",
        pageHints: ["/mtss/admin?tab=overview", "/mtss/admin?tab=students", "/mtss/student/:slug"],
        actions: [
            "Use the main button to open the All Students tab and select one student from the pilot class.",
            "Review the student's tier, intervention summary, assigned mentor, latest update, and next action indicator.",
            "Check whether the profile tells a coherent story from plan creation through progress history.",
        ],
        technicalFocus: [
            "Student detail should make status, ownership, and next follow-up action easy to find quickly.",
            "The jump from roster to profile should preserve enough context that the principal knows why the student was opened.",
        ],
        teacherTalkingPoints: [
            "The student profile is the clearest place to review one student's MTSS story end to end.",
            "Teachers need clean plans and progress data so the profile remains useful during follow-up meetings.",
        ],
        expectedOutcome:
            "The principal can describe the student's current support, latest progress, and likely next step from the profile alone.",
        featureKeys: ["student-profile", "intervention-summary", "progress-visibility", "last-update", "next-update", "profile-completeness"],
    },
    {
        id: "ai-assistant-insights",
        order: 9,
        title: "AI Assistant & Smart Insights",
        duration: "7 min",
        routeKey: "teacher-dashboard",
        startRouteKey: "teacher-dashboard",
        primaryActionLabel: "Open teacher dashboard preview",
        routeGuidance:
            "The main button opens the teacher dashboard preview first because this step should start from teacher-facing alerts or insights on the normal teacher landing page.",
        requiresTeacherPersona: true,
        goal: "Check whether AI features are practical enough to support teacher workflow, not just interesting to look at.",
        principalTask:
            "Test the AI Assistant as a trainer: would a teacher understand how to ask useful questions, and do the responses help with real MTSS follow-up?",
        pageHints: ["/mtss/teacher?tab=dashboard", "/ai-assistant"],
        actions: [
            "Use the main button to open the teacher dashboard preview and review any AI alert or smart insight that appears for a pilot student.",
            "Open AI Assistant and ask at least one plan-related question and one progress-related question.",
            "Judge whether the responses are specific enough to support next-step decisions instead of generic advice.",
        ],
        technicalFocus: [
            "The AI output should be understandable to teachers without heavy technical wording.",
            "Insights should help teachers plan, revise, or follow up on interventions faster.",
        ],
        teacherTalkingPoints: [
            "The AI Assistant works best when questions are specific to one student, one plan, or one trend.",
            "AI supports teacher judgment but does not replace it.",
        ],
        expectedOutcome:
            "The principal sees clear value in AI for insight and guidance, and can explain how teachers should use it responsibly.",
        featureKeys: ["ai-alerts", "alert-severity", "pattern-detection", "ai-chat-assistant", "ai-recommendations", "student-insights"],
    },
    {
        id: "mentor-visibility",
        order: 10,
        title: "Mentor Visibility & Coverage",
        duration: "4 min",
        routeKey: "mentors",
        startRouteKey: "mentors",
        primaryActionLabel: "Open Manage Mentors",
        routeGuidance:
            "The main button opens the Manage Mentors tab because this step focuses on workload and ownership visibility.",
        goal: "Confirm that principals can read workload and coverage clearly enough to make staffing decisions.",
        principalTask:
            "Check whether the principal can explain who owns which students, where workload may be uneven, and where a special-case reassignment might be needed.",
        pageHints: ["/mtss/admin?tab=overview", "/mtss/admin?tab=mentors"],
        actions: [
            "Use the main button to open the Manage Mentors tab.",
            "Review overall workload distribution and look for unclear ownership or overload.",
            "Confirm that the mentor page is useful for exception handling, not a page teachers must use every day.",
        ],
        technicalFocus: [
            "The roster should make workload and ownership visible without extra clicks.",
            "Automatic class ownership and manual exception handling should stay conceptually separate.",
        ],
        teacherTalkingPoints: [
            "Unclear ownership leads to inconsistent progress updates and missed follow-up.",
            "Principals use this page to review balance and special-case support, not to rebuild class ownership manually.",
        ],
        expectedOutcome:
            "The principal can see coverage clearly and distinguish normal class ownership from special-case mentor reassignment.",
        featureKeys: ["mentor-roster", "ownership-visibility", "coverage-gaps", "workload-balance", "follow-up-clarity"],
    },
    {
        id: "analytics-trends",
        order: 11,
        title: "Analytics & Trends",
        duration: "5 min",
        routeKey: "analytics",
        startRouteKey: "analytics",
        primaryActionLabel: "Open Analytics Lab",
        routeGuidance:
            "The main button opens the Analytics Lab tab for this step so principals can review charts and trend quality directly.",
        goal: "Review whether analytics are complete, useful, and clean enough for leadership-level decision making.",
        principalTask:
            "Use analytics to decide whether the system provides enough signal for principal conversations about intervention effectiveness and student movement.",
        pageHints: ["/mtss/admin?tab=overview", "/mtss/admin?tab=analytics"],
        actions: [
            "Use the main button to open the Analytics Lab tab.",
            "Review success rate by intervention type, student progress trend, focus-area highlights, and movement summary.",
            "Check specifically that student progress is not blank when the pilot class already has progress updates.",
            "Note which analytic is most actionable and which part still needs UI cleanup or clearer explanation.",
        ],
        technicalFocus: [
            "Analytics should be based on real intervention plans and progress history, not placeholder values.",
            "Labels and charts should feel readable enough for principal conversations without technical translation.",
        ],
        teacherTalkingPoints: [
            "Analytics are useful only when teachers enter consistent plans and progress updates.",
            "Principals use analytics for pattern reading and follow-up priorities, not to replace student-by-student review.",
        ],
        expectedOutcome:
            "The principal can identify at least one actionable trend and confirm whether the analytics feel complete enough for leadership use.",
        featureKeys: ["analytics-lab", "intervention-success-rate", "student-progress-trend", "tier-movement", "strategy-effectiveness", "chart-clarity"],
    },
    {
        id: "decision-simulation",
        order: 12,
        title: "Decision Simulation & Wrap-Up",
        duration: "5 min",
        routeKey: "students",
        startRouteKey: "students",
        primaryActionLabel: "Open All Students",
        routeGuidance:
            "The main button opens the All Students tab so principals can choose one case quickly for the wrap-up decision.",
        goal: "Simulate a real follow-up decision and verify that the system provides enough evidence to support it.",
        principalTask:
            "Conclude whether the principal feels ready to explain the teacher workflow and make a concrete MTSS follow-up decision using only what the system shows.",
        pageHints: ["/mtss/admin?tab=overview", "/mtss/admin?tab=students", "/mtss/pilot-testing"],
        actions: [
            "Choose one student who seems most in need of review based on the overview, profile, progress history, and analytics.",
            "State the next action you would take: keep the plan, revise the plan, escalate support, reassign ownership, or schedule a meeting.",
            "Return to the Pilot Testing Hub and submit step feedback so the wrap-up can count as completed.",
        ],
        technicalFocus: [
            "The system should provide enough evidence to justify a follow-up action clearly.",
            "If the decision still feels weak or guess-based, that gap should be captured in the feedback.",
        ],
        teacherTalkingPoints: [
            "Clean plan data and consistent weekly updates are what make leadership decisions possible.",
            "MTSS is not only for data entry; it should help teams make better support decisions.",
        ],
        expectedOutcome:
            "The principal can explain one concrete action to take next and can justify it with MTSS data rather than guesswork.",
        featureKeys: ["decision-support", "actionability", "leadership-readiness", "data-driven-decisions"],
    },
];

export const pilotFeatureCoverage = [
    { feature: "Guided pilot briefing and feedback rules", steps: ["Start & Context"] },
    { feature: "Overview cards and intervention integrity", steps: ["Admin Dashboard Overview"] },
    { feature: "Tier summary and recent activity", steps: ["Admin Dashboard Overview"] },
    { feature: "Automatic classroom ownership", steps: ["Mentor Assignment & Management", "Mentor Visibility & Coverage"] },
    { feature: "Manual mentor assignment for special cases", steps: ["Mentor Assignment & Management"] },
    { feature: "Students roster, filters, and search", steps: ["Students List & Filters"] },
    { feature: "Teacher navigation from dashboard", steps: ["Create Intervention Plan", "Edit Intervention Plan", "Submit Progress & Quick Update"] },
    { feature: "Intervention creation (quantitative)", steps: ["Create Intervention Plan"] },
    { feature: "Edit active plan without losing history", steps: ["Edit Intervention Plan"] },
    { feature: "Progress submission and quick update", steps: ["Submit Progress & Quick Update"] },
    { feature: "Weekly progress cadence", steps: ["Submit Progress & Quick Update"] },
    { feature: "Evidence upload and Growth Journey", steps: ["Evidence Upload & Growth Journey"] },
    { feature: "Student profile and follow-up context", steps: ["Student Profile & Detail View"] },
    { feature: "AI Assistant and smart insights", steps: ["AI Assistant & Smart Insights"] },
    { feature: "Analytics completeness and chart clarity", steps: ["Analytics & Trends"] },
    { feature: "Decision support and wrap-up readiness", steps: ["Decision Simulation & Wrap-Up"] },
    { feature: "Overall usability and rollout readiness", steps: ["Final Feedback"] },
];

export const aiTipsAndTricks = [
    {
        id: "ai-alerts-priority",
        title: "Prioritize AI alerts by urgency",
        description:
            "Review urgent and high-severity alerts first, especially when they point to declining progress or repeated support gaps. Confidence scores help you judge how strongly the system believes the pattern is real.",
        applicableTo: "Teacher Dashboard, AI Alerts",
    },
    {
        id: "ai-chat-specific-questions",
        title: "Ask narrow, student-specific questions",
        description:
            "Questions such as 'What should I adjust in this Tier 2 math plan?' or 'Summarize the last three weekly updates for this student' lead to more useful answers than broad prompts.",
        applicableTo: "AI Chat Assistant (/ai-assistant)",
    },
    {
        id: "ai-plan-review",
        title: "Use AI to review the plan before editing it",
        description:
            "Ask the assistant whether the baseline, target, and monitoring cadence feel realistic before you edit the plan. This is especially useful when progress has stalled.",
        applicableTo: "Teacher Dashboard, Edit Intervention",
    },
    {
        id: "ai-progress-summary",
        title: "Use AI to summarize progress history quickly",
        description:
            "When a plan already has three or more weekly updates, the AI can help summarize the trend and suggest whether to maintain, revise, or escalate support.",
        applicableTo: "Student Detail, Growth Journey, AI Assistant",
    },
    {
        id: "ai-admin-scan",
        title: "Use AI insight as a review accelerator, not a replacement",
        description:
            "Principals can use AI to speed up review, but the final decision still needs to be grounded in the plan data, progress history, and ownership context shown in MTSS.",
        applicableTo: "Admin Review, Teacher Coaching",
    },
];

export const stepCompletionOptions = [
    { value: "yes", label: "Yes — completed fully" },
    { value: "partial", label: "Partial — some parts were skipped" },
    { value: "no", label: "No — could not complete" },
];

export const severityOptions = [
    { value: "low", label: "Low — cosmetic or minor" },
    { value: "medium", label: "Medium — usability issue" },
    { value: "high", label: "High — blocks workflow" },
];

export const readinessOptions = [
    { value: "yes", label: "Yes — ready for wider rollout" },
    { value: "almost", label: "Almost — minor fixes needed first" },
    { value: "not-yet", label: "Not yet — significant issues to address" },
];

export const ratingOptions = [1, 2, 3, 4, 5];

export const buildPilotAdminBaseRoute = (user) => {
    const profile = getMtssAccessProfile(user);
    if (profile.accessLevel === "observer") {
        return "/mtss/observer";
    }

    return "/mtss/admin";
};

const buildPilotRouteFromKey = (routeKey, user, stepId = "") => {
    const adminBaseRoute = buildPilotAdminBaseRoute(user);
    const withStep = (route) => appendPilotStepRoute(route, stepId);
    const withTeacherPreview = (route) => withStep(appendPilotTeacherPreviewRoute(route, user));

    switch (routeKey) {
        case "hub":
            return withStep("/mtss/pilot-testing");
        case "overview":
            return withStep(`${adminBaseRoute}?tab=overview`);
        case "students":
            return withStep(`${adminBaseRoute}?tab=students`);
        case "mentors":
            return withStep(`${adminBaseRoute}?tab=mentors`);
        case "analytics":
            return withStep(`${adminBaseRoute}?tab=analytics`);
        case "teacher-dashboard":
            return withTeacherPreview("/mtss/teacher?tab=dashboard");
        case "teacher-students":
            return withTeacherPreview("/mtss/teacher?tab=students");
        case "teacher-create":
            return withTeacherPreview("/mtss/teacher?tab=create");
        case "teacher-edit":
            return withTeacherPreview("/mtss/teacher?tab=edit");
        case "ai-assistant":
            return withStep("/ai-assistant");
        default:
            return withStep("/mtss/pilot-testing");
    }
};

export const buildPilotStepRoute = (step, user) => buildPilotRouteFromKey(step?.routeKey, user, step?.id);

export const buildPilotStartRoute = (step, user) => buildPilotRouteFromKey(step?.startRouteKey || step?.routeKey, user, step?.id);

export const createEmptyStepFeedback = () => ({
    completionStatus: "yes",
    easeOfUse: 4,
    clarity: 4,
    performance: 4,
    helpfulNotes: "",
    confusingNotes: "",
    partialReason: "",
    bugFound: false,
    bugSummary: "",
    expectedResult: "",
    reproductionSteps: "",
    bugSeverity: "medium",
    screenshotLink: "",
});

export const createEmptyFinalFeedback = () => ({
    overallConfidence: 4,
    mostUsefulFeature: "",
    mostConfusingFeature: "",
    slowestPart: "",
    missingFeature: "",
    readiness: "not-yet",
    topImprovements: "",
    additionalComments: "",
});
