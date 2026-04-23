import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
    ArrowRight,
    Bot,
    CheckCircle2,
    ClipboardCheck,
    Copy,
    Download,
    Flag,
    Gauge,
    Lightbulb,
    ListChecks,
    MessageSquareText,
    RotateCcw,
    Sparkles,
    Target,
    TimerReset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn, sanitizeLight } from "@/lib/utils";
import { upsertPilotFeedbackSession } from "@/services/mtssService";
import {
    appendPilotTeacherPreviewRoute,
    resolvePilotTeacherRunbook,
} from "./utils/pilotTeacherPreview";
import { appendPilotStepRoute } from "./utils/pilotStepGuidance";
import {
    PILOT_PROGRESS_STORAGE_KEY,
    aiTipsAndTricks,
    buildPilotStartRoute,
    createEmptyFinalFeedback,
    createEmptyStepFeedback,
    pilotFeatureCoverage,
    principalBriefingChecklist,
    pilotSteps,
    ratingOptions,
    readinessOptions,
    severityOptions,
    stepCompletionOptions,
} from "./data/pilotTestingScenario";

const buildPilotStorageKey = (user) => {
    const email = String(user?.email || "anonymous").trim().toLowerCase();
    return `${PILOT_PROGRESS_STORAGE_KEY}:${email || "anonymous"}`;
};

const MAX_PILOT_ACTIVITY_EVENTS = 20;

const createEmptyLiveContext = () => ({
    currentStepId: "",
    currentStepTitle: "",
    currentModal: "",
    currentAction: "",
    currentRoute: "",
    lastActionAt: null,
});

const createPilotSessionKey = (user) => {
    const emailSeed = String(user?.email || "principal")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 40) || "principal";

    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `${emailSeed}-${crypto.randomUUID()}`;
    }

    return `${emailSeed}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const readStoredPilotState = (user) => {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const scopedRaw = window.localStorage.getItem(buildPilotStorageKey(user));
        if (scopedRaw) {
            return JSON.parse(scopedRaw);
        }

        const legacyRaw = window.localStorage.getItem(PILOT_PROGRESS_STORAGE_KEY);
        if (!legacyRaw) {
            return null;
        }

        const parsedLegacy = JSON.parse(legacyRaw);
        const legacyEmail = String(parsedLegacy?.tester?.email || "").trim().toLowerCase();
        const currentEmail = String(user?.email || "").trim().toLowerCase();
        if (!legacyEmail || !currentEmail || legacyEmail === currentEmail) {
            return parsedLegacy;
        }
        return null;
    } catch {
        return null;
    }
};

const clampRating = (value, fallback = 4) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(1, Math.min(5, parsed)) : fallback;
};

const sanitizeFeedbackDraft = (draft = {}) => ({
    completionStatus: stepCompletionOptions.some((option) => option.value === draft.completionStatus)
        ? draft.completionStatus
        : "yes",
    easeOfUse: clampRating(draft.easeOfUse, 4),
    clarity: clampRating(draft.clarity, 4),
    performance: clampRating(draft.performance, 4),
    helpfulNotes: sanitizeLight(draft.helpfulNotes || "", 1200),
    confusingNotes: sanitizeLight(draft.confusingNotes || "", 1200),
    partialReason: sanitizeLight(draft.partialReason || "", 1200),
    bugFound: Boolean(draft.bugFound),
    bugSummary: sanitizeLight(draft.bugSummary || "", 1200),
    expectedResult: sanitizeLight(draft.expectedResult || "", 1200),
    reproductionSteps: sanitizeLight(draft.reproductionSteps || "", 1200),
    bugSeverity: severityOptions.some((option) => option.value === draft.bugSeverity) ? draft.bugSeverity : "medium",
    screenshotLink: sanitizeLight(draft.screenshotLink || "", 800),
});

const sanitizeFinalDraft = (draft = {}) => ({
    overallConfidence: clampRating(draft.overallConfidence, 4),
    mostUsefulFeature: sanitizeLight(draft.mostUsefulFeature || "", 1200),
    mostConfusingFeature: sanitizeLight(draft.mostConfusingFeature || "", 1200),
    slowestPart: sanitizeLight(draft.slowestPart || "", 1200),
    missingFeature: sanitizeLight(draft.missingFeature || "", 1200),
    readiness: readinessOptions.some((option) => option.value === draft.readiness) ? draft.readiness : "not-yet",
    topImprovements: sanitizeLight(draft.topImprovements || "", 1600),
    additionalComments: sanitizeLight(draft.additionalComments || "", 1600),
});

const sanitizeLiveContext = (value = {}) => ({
    currentStepId: sanitizeLight(value.currentStepId || "", 80),
    currentStepTitle: sanitizeLight(value.currentStepTitle || "", 200),
    currentModal: sanitizeLight(value.currentModal || "", 80),
    currentAction: sanitizeLight(value.currentAction || "", 200),
    currentRoute: sanitizeLight(value.currentRoute || "", 300),
    lastActionAt: value.lastActionAt || null,
});

const sanitizeActivityTrail = (items = []) =>
    (Array.isArray(items) ? items : [])
        .slice(0, MAX_PILOT_ACTIVITY_EVENTS)
        .map((entry) => ({
            type: sanitizeLight(entry?.type || "", 80),
            label: sanitizeLight(entry?.label || "", 200),
            stepId: sanitizeLight(entry?.stepId || "", 80),
            stepTitle: sanitizeLight(entry?.stepTitle || "", 200),
            route: sanitizeLight(entry?.route || "", 300),
            at: entry?.at || null,
        }))
        .filter((entry) => entry.type || entry.label || entry.stepId || entry.route);

const hasSavedStepFeedback = (stepId, state = {}) => Boolean(state?.completedSteps?.[stepId]);

const hydratePilotState = (user) => {
    const stored = readStoredPilotState(user);
    const feedbackByStep = Object.fromEntries(
        pilotSteps.map((step) => [
            step.id,
            sanitizeFeedbackDraft(stored?.feedbackByStep?.[step.id] || createEmptyStepFeedback()),
        ]),
    );

    return {
        sessionKey: stored?.sessionKey || createPilotSessionKey(user),
        completedSteps: stored?.completedSteps || {},
        feedbackByStep,
        finalFeedback: sanitizeFinalDraft(stored?.finalFeedback || createEmptyFinalFeedback()),
        finalFeedbackSavedAt: stored?.finalFeedbackSavedAt || null,
        liveContext: sanitizeLiveContext(stored?.liveContext || createEmptyLiveContext()),
        activityTrail: sanitizeActivityTrail(stored?.activityTrail || []),
        tester: {
            name: user?.name || user?.nickname || "",
            email: user?.email || "",
            role: user?.role || "",
            unit: user?.unit || user?.department || "",
        },
        lastUpdatedAt: stored?.lastUpdatedAt || null,
    };
};

const savePilotState = (user, state) => {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.localStorage.setItem(
            buildPilotStorageKey(user),
            JSON.stringify(state),
        );
    } catch {
        // Ignore storage errors for lightweight pilot tracking.
    }
};

const withTimestamp = (state) => ({
    ...state,
    lastUpdatedAt: new Date().toISOString(),
});

const hasMeaningfulPilotState = (state = {}) => {
    const hasCompletedSteps = Object.values(state.completedSteps || {}).some(Boolean);
    const hasStepNotes = Object.values(state.feedbackByStep || {}).some((entry) =>
        Boolean(entry?.helpfulNotes || entry?.confusingNotes || entry?.partialReason || entry?.bugFound),
    );
    const hasFinalNotes = Boolean(
        state.finalFeedback?.mostUsefulFeature
        || state.finalFeedback?.mostConfusingFeature
        || state.finalFeedback?.slowestPart
        || state.finalFeedback?.missingFeature
        || state.finalFeedback?.topImprovements
        || state.finalFeedback?.additionalComments
        || state.finalFeedbackSavedAt,
    );

    return Boolean(state.lastUpdatedAt || hasCompletedSteps || hasStepNotes || hasFinalNotes);
};

const formatRole = (value = "") =>
    value
        .toString()
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const formatFeatureKey = (value = "") =>
    value
        .toString()
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const ratingLabels = {
    1: "Very hard",
    2: "Needs work",
    3: "Okay",
    4: "Clear",
    5: "Excellent",
};

const completionLabels = {
    yes: "Done",
    partial: "Partial",
    no: "Not done",
};

const readinessLabels = {
    yes: "Yes",
    almost: "Almost",
    "not-yet": "Not yet",
};

const formatConfidenceScore = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Number.isInteger(parsed) ? `${parsed}` : parsed.toFixed(1);
};

const computeDerivedConfidence = (feedbackEntries = []) => {
    if (!Array.isArray(feedbackEntries) || feedbackEntries.length === 0) return null;

    const totals = feedbackEntries.reduce(
        (accumulator, entry) => {
            accumulator.ease += clampRating(entry?.easeOfUse, 0);
            accumulator.clarity += clampRating(entry?.clarity, 0);
            accumulator.performance += clampRating(entry?.performance, 0);
            return accumulator;
        },
        { ease: 0, clarity: 0, performance: 0 },
    );

    const divisor = feedbackEntries.length;
    const averagedValue = (totals.ease + totals.clarity + totals.performance) / (divisor * 3);
    return Math.round(averagedValue * 10) / 10;
};

const buildConfidenceSummary = ({
    completedCount = 0,
    totalSteps = 0,
    derivedConfidence = null,
    finalFeedback = {},
    finalFeedbackSavedAt = null,
}) => {
    if (completedCount === 0) {
        return {
            displayValue: "Pending",
            helper: "Save at least one step feedback first.",
            tone: "default",
        };
    }

    if (finalFeedbackSavedAt) {
        return {
            displayValue: `${finalFeedback.overallConfidence}/5`,
            helper: `${ratingLabels[finalFeedback.overallConfidence] || "Final rating"} from the saved wrap-up.`,
            tone:
                finalFeedback.overallConfidence >= 4
                    ? "positive"
                    : finalFeedback.overallConfidence >= 3
                        ? "warning"
                        : "danger",
        };
    }

    const provisionalLabel = formatConfidenceScore(derivedConfidence);
    const remaining = Math.max(totalSteps - completedCount, 0);

    return {
        displayValue: provisionalLabel ? `${provisionalLabel}/5` : "Pending",
        helper:
            remaining > 0
                ? `Provisional score from ${completedCount} saved ${completedCount === 1 ? "step" : "steps"}. ${remaining} more ${remaining === 1 ? "step remains" : "steps remain"} before the final rating.`
                : "All step feedback is saved. Confirm the final confidence in the wrap-up form.",
        tone:
            derivedConfidence >= 4
                ? "positive"
                : derivedConfidence >= 3
                    ? "warning"
                    : "danger",
    };
};

const DialogSection = ({ eyebrow, title, description, children }) => (
    <section className="space-y-3 rounded-[24px] border border-white/45 bg-white/72 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
        {eyebrow && (
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/55">{eyebrow}</p>
        )}
        {title && <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>}
        {description && <p className="text-sm leading-relaxed text-slate-600 dark:text-white/70">{description}</p>}
        {children}
    </section>
);

const SnapshotMetric = ({ label, value, tone = "default" }) => {
    const toneClass =
        tone === "positive"
            ? "text-emerald-600 dark:text-emerald-300"
            : tone === "warning"
                ? "text-amber-600 dark:text-amber-300"
                : tone === "danger"
                    ? "text-rose-600 dark:text-rose-300"
                    : "text-slate-900 dark:text-white";

    return (
        <div className="rounded-2xl border border-white/45 bg-white/80 px-3 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-white/55">{label}</p>
            <p className={cn("mt-2 text-base font-black", toneClass)}>{value}</p>
        </div>
    );
};

const getUnsavedStepSnapshot = () => ({
    statusLabel: "Not started",
    statusTone: "default",
    bugLabel: "No report yet",
    bugTone: "default",
    easeLabel: "Not rated",
    clarityLabel: "Not rated",
});

const getSavedStepSnapshot = (feedback = {}) => ({
    statusLabel: completionLabels[feedback.completionStatus] || feedback.completionStatus || "Done",
    statusTone:
        feedback.completionStatus === "yes"
            ? "positive"
            : feedback.completionStatus === "partial"
                ? "warning"
                : "danger",
    bugLabel: feedback.bugFound ? "Reported" : "None",
    bugTone: feedback.bugFound ? "danger" : "positive",
    easeLabel: `${feedback.easeOfUse}/5`,
    clarityLabel: `${feedback.clarity}/5`,
});

const DialogInfoCard = ({ label, value }) => (
    <div className="rounded-2xl border border-white/45 bg-white/80 px-4 py-4 dark:border-white/10 dark:bg-white/5">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-white/55">{label}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-white/75">{value}</p>
    </div>
);

const STEP_CARD_TONES = {
    soft: "from-white via-[#f8fafc] to-[#fefce8] dark:from-white/5 dark:via-white/10 dark:to-white/5",
    sky: "from-[#eff6ff] via-white to-[#ecfeff] dark:from-sky-500/10 dark:via-white/10 dark:to-cyan-500/10",
    peach: "from-[#fff7ed] via-white to-[#fdf2f8] dark:from-orange-500/10 dark:via-white/10 dark:to-pink-500/10",
    mint: "from-[#ecfdf5] via-white to-[#eff6ff] dark:from-emerald-500/10 dark:via-white/10 dark:to-sky-500/10",
    violet: "from-[#f5f3ff] via-white to-[#fdf4ff] dark:from-violet-500/10 dark:via-white/10 dark:to-fuchsia-500/10",
};

const StepDetailCard = ({ icon: Icon, title, description, items = [], tone = "soft" }) => (
    <div
        className={cn(
            "rounded-[24px] border border-white/45 bg-gradient-to-br p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10",
            STEP_CARD_TONES[tone] || STEP_CARD_TONES.soft,
        )}
    >
        <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-2 text-white shadow-sm dark:bg-white/10 dark:text-white">
                <Icon className="h-4 w-4" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-700 dark:text-white/80">{title}</p>
        </div>

        {description ? (
            <p className="mt-3 text-[13px] leading-6 text-slate-700 dark:text-white/75">{description}</p>
        ) : null}

        {items.length ? (
            <ul className="mt-3 space-y-2.5 text-[13px] leading-6 text-slate-700 dark:text-white/75">
                {items.map((item) => (
                    <li key={item} className="flex gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900 dark:bg-white" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        ) : null}
    </div>
);

const StepRatingField = ({ label, value, onChange }) => (
    <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700 dark:text-white">{label}</Label>
        <div className="grid grid-cols-5 gap-2">
            {ratingOptions.map((option) => {
                const selected = option === value;
                return (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onChange(option)}
                        className={cn(
                            "rounded-2xl border px-3 py-2 text-sm font-semibold transition",
                            selected
                                ? "border-transparent bg-gradient-to-r from-[#fb7185] via-[#f59e0b] to-[#22c55e] text-white shadow-lg"
                                : "border-white/40 bg-white/80 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
                        )}
                    >
                        {option}
                    </button>
                );
            })}
        </div>
        <p className="text-xs text-slate-500 dark:text-white/60">{ratingLabels[value] || "Select a rating"}</p>
    </div>
);

const StepFeedbackDialog = ({
    open,
    onOpenChange,
    step,
    value,
    onChange,
    onSave,
}) => {
    if (!step) return null;

    return (
            <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto rounded-[28px] border-white/20 bg-white/95 dark:bg-slate-950/95">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">
                        Step {step.order} feedback
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-600 dark:text-white/70">
                        {step.title} — rate the step, note what helped, and log any issue you found. Saving this form marks the step as done automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <DialogSection
                        eyebrow="Step reminder"
                        title={step.title}
                        description="Use this summary to judge whether the step was clear, useful, and easy to explain back to teachers."
                    >
                        <div className="grid gap-3 md:grid-cols-3">
                            <DialogInfoCard label="Goal" value={step.goal} />
                            <DialogInfoCard label="Success check" value={step.expectedOutcome} />
                            <DialogInfoCard label="Save rule" value="Saving this form marks the step done." />
                        </div>
                    </DialogSection>

                    <DialogSection
                        eyebrow="Quick score"
                        title="How did this step feel?"
                        description="Give a quick completion result, then rate ease, clarity, and speed."
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor={`completion-status-${step.id}`} className="text-sm font-semibold text-slate-700 dark:text-white">
                                    Were you able to finish this step?
                                </Label>
                                <select
                                    id={`completion-status-${step.id}`}
                                    className="w-full rounded-2xl border border-white/40 bg-white/80 px-4 py-3 text-sm text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    value={value.completionStatus}
                                    onChange={(event) => onChange({ ...value, completionStatus: event.target.value })}
                                >
                                    {stepCompletionOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`bug-severity-${step.id}`} className="text-sm font-semibold text-slate-700 dark:text-white">
                                    Bug impact
                                </Label>
                                <select
                                    id={`bug-severity-${step.id}`}
                                    className="w-full rounded-2xl border border-white/40 bg-white/80 px-4 py-3 text-sm text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    value={value.bugSeverity}
                                    onChange={(event) => onChange({ ...value, bugSeverity: event.target.value })}
                                    disabled={!value.bugFound}
                                >
                                    {severityOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-3">
                            <StepRatingField
                                label="Ease"
                                value={value.easeOfUse}
                                onChange={(nextValue) => onChange({ ...value, easeOfUse: nextValue })}
                            />
                            <StepRatingField
                                label="Clarity"
                                value={value.clarity}
                                onChange={(nextValue) => onChange({ ...value, clarity: nextValue })}
                            />
                            <StepRatingField
                                label="Speed"
                                value={value.performance}
                                onChange={(nextValue) => onChange({ ...value, performance: nextValue })}
                            />
                        </div>
                    </DialogSection>

                    <DialogSection
                        eyebrow="What to tell the team"
                        title="What worked and what needs fixing?"
                        description="Keep the notes short and concrete. A few clear lines are better than long general comments."
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor={`helpful-${step.id}`} className="text-sm font-semibold text-slate-700 dark:text-white">
                                    What worked well?
                                </Label>
                                <Textarea
                                    id={`helpful-${step.id}`}
                                    value={value.helpfulNotes}
                                    onChange={(event) => onChange({ ...value, helpfulNotes: event.target.value })}
                                    className="min-h-[120px] rounded-2xl border-white/40 bg-white/80 dark:border-white/10 dark:bg-white/5"
                                    placeholder="Example: The student list made it easy to find Tier 2 cases quickly."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`confusing-${step.id}`} className="text-sm font-semibold text-slate-700 dark:text-white">
                                    What needs to be clearer?
                                </Label>
                                <Textarea
                                    id={`confusing-${step.id}`}
                                    value={value.confusingNotes}
                                    onChange={(event) => onChange({ ...value, confusingNotes: event.target.value })}
                                    className="min-h-[120px] rounded-2xl border-white/40 bg-white/80 dark:border-white/10 dark:bg-white/5"
                                    placeholder="Example: I could not tell which button to use first."
                                />
                            </div>
                        </div>
                    </DialogSection>

                    {(value.completionStatus === "partial" || value.completionStatus === "no") && (
                        <DialogSection
                            eyebrow="Completion gap"
                            title="What stopped the step?"
                            description="Only fill this in if the step could not be completed fully."
                        >
                            <div className="space-y-2">
                                <Label htmlFor={`partial-reason-${step.id}`} className="text-sm font-semibold text-slate-700 dark:text-white">
                                    Main blocker
                                </Label>
                                <Textarea
                                    id={`partial-reason-${step.id}`}
                                    value={value.partialReason}
                                    onChange={(event) => onChange({ ...value, partialReason: event.target.value })}
                                    className="min-h-[96px] rounded-2xl border-white/40 bg-white/80 dark:border-white/10 dark:bg-white/5"
                                    placeholder="Example: missing data, unclear flow, permission issue, or bug."
                                />
                            </div>
                        </DialogSection>
                    )}

                    <DialogSection
                        eyebrow="Bug log"
                        title="Did something break?"
                        description="Turn this on only when you found a real bug or broken behavior in the step."
                    >
                        <label className="flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-white">
                            <input
                                type="checkbox"
                                checked={value.bugFound}
                                onChange={(event) =>
                                    onChange({
                                        ...value,
                                        bugFound: event.target.checked,
                                    })
                                }
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            This step had a bug or broken flow
                        </label>

                        {value.bugFound && (
                            <div className="mt-4 grid gap-5 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor={`bug-summary-${step.id}`} className="text-sm font-semibold text-slate-700 dark:text-white">
                                        What broke?
                                    </Label>
                                    <Textarea
                                        id={`bug-summary-${step.id}`}
                                        value={value.bugSummary}
                                        onChange={(event) => onChange({ ...value, bugSummary: event.target.value })}
                                        className="min-h-[96px] rounded-2xl border-white/40 bg-white/80 dark:border-white/10 dark:bg-white/5"
                                        placeholder="Example: The page opened, but the chart stayed blank."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`expected-result-${step.id}`} className="text-sm font-semibold text-slate-700 dark:text-white">
                                        What should happen?
                                    </Label>
                                    <Textarea
                                        id={`expected-result-${step.id}`}
                                        value={value.expectedResult}
                                        onChange={(event) => onChange({ ...value, expectedResult: event.target.value })}
                                        className="min-h-[96px] rounded-2xl border-white/40 bg-white/80 dark:border-white/10 dark:bg-white/5"
                                        placeholder="Example: The chart should load student progress."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`reproduction-${step.id}`} className="text-sm font-semibold text-slate-700 dark:text-white">
                                        How can we reproduce it?
                                    </Label>
                                    <Textarea
                                        id={`reproduction-${step.id}`}
                                        value={value.reproductionSteps}
                                        onChange={(event) => onChange({ ...value, reproductionSteps: event.target.value })}
                                        className="min-h-[96px] rounded-2xl border-white/40 bg-white/80 dark:border-white/10 dark:bg-white/5"
                                        placeholder="List the short steps that triggered the issue."
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor={`bug-shot-${step.id}`} className="text-sm font-semibold text-slate-700 dark:text-white">
                                        Screenshot or video link
                                    </Label>
                                    <Input
                                        id={`bug-shot-${step.id}`}
                                        value={value.screenshotLink}
                                        onChange={(event) => onChange({ ...value, screenshotLink: event.target.value })}
                                        className="rounded-2xl border-white/40 bg-white/80 dark:border-white/10 dark:bg-white/5"
                                        placeholder="Paste a drive link if you captured the issue."
                                    />
                                </div>
                            </div>
                        )}
                    </DialogSection>
                </div>

                <DialogFooter className="gap-2 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button variant="gradient" onClick={onSave}>
                        Save and mark step done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const FinalFeedbackDialog = ({ open, onOpenChange, value, onChange, onSave, blocked, remainingCount, derivedOverallConfidence = null }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto rounded-[28px] border-white/20 bg-white/95 dark:bg-slate-950/95">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Final pilot feedback</DialogTitle>
                <DialogDescription className="text-sm text-slate-600 dark:text-white/70">
                    {blocked
                        ? `${remainingCount} guided ${remainingCount === 1 ? "step still needs" : "steps still need"} saved feedback before final feedback can be submitted.`
                        : "Wrap up rollout readiness, strongest points, and the top fixes before wider use."}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
                <DialogSection
                    eyebrow="Overall verdict"
                    title="How ready does MTSS feel overall?"
                    description={
                        Number.isFinite(derivedOverallConfidence)
                            ? `Use this final form to confirm the rollout view. Suggested confidence from saved step ratings: ${formatConfidenceScore(derivedOverallConfidence)}/5.`
                            : "Use this final form to give a short rollout view after all guided steps are done."
                    }
                >
                    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                        <StepRatingField
                            label="Overall confidence"
                            value={value.overallConfidence}
                            onChange={(nextValue) => onChange({ ...value, overallConfidence: nextValue })}
                        />
                        <div className="space-y-2">
                            <Label htmlFor="readiness-select" className="text-sm font-semibold text-slate-700 dark:text-white">
                                Ready for wider principal use?
                            </Label>
                            <select
                                id="readiness-select"
                                className="w-full rounded-2xl border border-white/40 bg-white/80 px-4 py-3 text-sm text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                value={value.readiness}
                                onChange={(event) => onChange({ ...value, readiness: event.target.value })}
                            >
                                {readinessOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </DialogSection>

                <DialogSection
                    eyebrow="Fast wrap-up"
                    title="What stood out most?"
                    description="Keep this short. These are the lines leadership will read first."
                >
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="most-useful-feature" className="text-sm font-semibold text-slate-700 dark:text-white">
                                Most useful part
                            </Label>
                            <Textarea
                                id="most-useful-feature"
                                value={value.mostUsefulFeature}
                                onChange={(event) => onChange({ ...value, mostUsefulFeature: event.target.value })}
                                className="min-h-[108px] rounded-2xl border-white/40 bg-white/80 dark:border-white/10 dark:bg-white/5"
                                placeholder="What helped most during the pilot?"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="most-confusing-feature" className="text-sm font-semibold text-slate-700 dark:text-white">
                                Still unclear
                            </Label>
                            <Textarea
                                id="most-confusing-feature"
                                value={value.mostConfusingFeature}
                                onChange={(event) => onChange({ ...value, mostConfusingFeature: event.target.value })}
                                className="min-h-[108px] rounded-2xl border-white/40 bg-white/80 dark:border-white/10 dark:bg-white/5"
                                placeholder="What still needs simplification?"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slowest-part" className="text-sm font-semibold text-slate-700 dark:text-white">
                                Slowest part
                            </Label>
                            <Textarea
                                id="slowest-part"
                                value={value.slowestPart}
                                onChange={(event) => onChange({ ...value, slowestPart: event.target.value })}
                                className="min-h-[108px] rounded-2xl border-white/40 bg-white/80 dark:border-white/10 dark:bg-white/5"
                                placeholder="What felt slow or heavy?"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="missing-feature" className="text-sm font-semibold text-slate-700 dark:text-white">
                                Missing feature
                            </Label>
                            <Textarea
                                id="missing-feature"
                                value={value.missingFeature}
                                onChange={(event) => onChange({ ...value, missingFeature: event.target.value })}
                                className="min-h-[108px] rounded-2xl border-white/40 bg-white/80 dark:border-white/10 dark:bg-white/5"
                                placeholder="What is still missing?"
                            />
                        </div>
                    </div>
                </DialogSection>

                <DialogSection
                    eyebrow="Rollout priorities"
                    title="What should we fix next?"
                    description="List the most important changes before the pilot expands."
                >
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="top-improvements" className="text-sm font-semibold text-slate-700 dark:text-white">
                                Top 3 fixes before rollout
                            </Label>
                            <Textarea
                                id="top-improvements"
                                value={value.topImprovements}
                                onChange={(event) => onChange({ ...value, topImprovements: event.target.value })}
                                className="min-h-[120px] rounded-2xl border-white/40 bg-white/80 dark:border-white/10 dark:bg-white/5"
                                placeholder={"1. ...\n2. ...\n3. ..."}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="additional-comments" className="text-sm font-semibold text-slate-700 dark:text-white">
                                Anything else?
                            </Label>
                            <Textarea
                                id="additional-comments"
                                value={value.additionalComments}
                                onChange={(event) => onChange({ ...value, additionalComments: event.target.value })}
                                className="min-h-[120px] rounded-2xl border-white/40 bg-white/80 dark:border-white/10 dark:bg-white/5"
                                placeholder="Any final note before broader rollout?"
                            />
                        </div>
                    </div>
                </DialogSection>
            </div>

            <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                </Button>
                <Button variant="gradient" onClick={onSave} disabled={blocked}>
                    Save final feedback
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

const buildFeedbackExport = ({
    user,
    sessionKey,
    stepFeedback,
    finalFeedback,
    completedSteps,
    updatedAt,
    finalFeedbackSavedAt,
    liveContext,
    activityTrail,
    lastViewedRoute,
    source,
}) => ({
    exportedAt: new Date().toISOString(),
    sessionKey,
    scenarioKey: "mtss-principal-pilot",
    lastUpdatedAt: updatedAt,
    finalFeedbackSavedAt: finalFeedbackSavedAt || null,
    tester: {
        name: user?.name || user?.nickname || "",
        email: user?.email || "",
        role: user?.role || "",
        unit: user?.unit || user?.department || "",
    },
    completedSteps,
    liveContext: sanitizeLiveContext(liveContext),
    activityTrail: sanitizeActivityTrail(activityTrail),
    stepFeedback: pilotSteps.map((step) => ({
        id: step.id,
        title: step.title,
        order: step.order,
        duration: step.duration,
        completed: Boolean(completedSteps?.[step.id]),
        feedback: stepFeedback[step.id],
    })),
    finalFeedback,
    lastViewedRoute: lastViewedRoute || (typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/mtss/pilot-testing"),
    source: source || {
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    },
});

const buildMarkdownSummary = ({ user, sessionKey, stepFeedback, finalFeedback, completedSteps, updatedAt, finalFeedbackSavedAt }) => {
    const lines = [
        "# MTSS Principal Pilot Feedback Summary",
        "",
        `- Session key: ${sessionKey || "-"}`,
        `- Exported at: ${new Date().toLocaleString()}`,
        `- Last updated: ${updatedAt ? new Date(updatedAt).toLocaleString() : "Not saved yet"}`,
        `- Final feedback saved at: ${finalFeedbackSavedAt ? new Date(finalFeedbackSavedAt).toLocaleString() : "Not submitted yet"}`,
        `- Tester: ${user?.name || user?.nickname || "-"}`,
        `- Email: ${user?.email || "-"}`,
        `- Role: ${formatRole(user?.role || "-")}`,
        `- Unit: ${user?.unit || user?.department || "-"}`,
        "",
        "## Step Feedback",
        "",
    ];

    pilotSteps.forEach((step) => {
        const feedback = stepFeedback[step.id];
        lines.push(`### Step ${step.order} — ${step.title}`);
        lines.push(`- Completed in hub: ${completedSteps?.[step.id] ? "Yes" : "No"}`);
        lines.push(`- Completion status: ${feedback.completionStatus}`);
        lines.push(`- Ease of use: ${feedback.easeOfUse}/5`);
        lines.push(`- Clarity: ${feedback.clarity}/5`);
        lines.push(`- Performance: ${feedback.performance}/5`);
        lines.push(`- Helpful notes: ${feedback.helpfulNotes || "-"}`);
        lines.push(`- Confusing notes: ${feedback.confusingNotes || "-"}`);
        lines.push(`- Partial or failed reason: ${feedback.partialReason || "-"}`);
        lines.push(`- Bug found: ${feedback.bugFound ? "Yes" : "No"}`);
        if (feedback.bugFound) {
            lines.push(`- Bug severity: ${feedback.bugSeverity}`);
            lines.push(`- Bug summary: ${feedback.bugSummary || "-"}`);
            lines.push(`- Expected result: ${feedback.expectedResult || "-"}`);
            lines.push(`- Reproduction steps: ${feedback.reproductionSteps || "-"}`);
            lines.push(`- Screenshot link: ${feedback.screenshotLink || "-"}`);
        }
        lines.push("");
    });

    lines.push("## Final Feedback");
    lines.push("");
    lines.push(`- Overall confidence: ${finalFeedback.overallConfidence}/5`);
    lines.push(`- Most useful feature: ${finalFeedback.mostUsefulFeature || "-"}`);
    lines.push(`- Most confusing feature: ${finalFeedback.mostConfusingFeature || "-"}`);
    lines.push(`- Slowest part: ${finalFeedback.slowestPart || "-"}`);
    lines.push(`- Missing feature: ${finalFeedback.missingFeature || "-"}`);
    lines.push(`- Readiness: ${readinessLabels[finalFeedback.readiness] || finalFeedback.readiness}`);
    lines.push(`- Top improvements: ${finalFeedback.topImprovements || "-"}`);
    lines.push(`- Additional comments: ${finalFeedback.additionalComments || "-"}`);

    return lines.join("\n");
};

const MTSSPilotTestingHubPage = memo(() => {
    const { toast } = useToast();
    const user = useSelector((state) => state.auth?.user);
    const [pilotState, setPilotState] = useState(() => hydratePilotState(user));
    const [activeStepId, setActiveStepId] = useState(null);
    const [finalFeedbackOpen, setFinalFeedbackOpen] = useState(false);
    const [syncState, setSyncState] = useState({
        status: "idle",
        lastSyncedAt: null,
        error: null,
    });

    const recordPilotEvent = useCallback((payload = {}) => {
        const timestamp = new Date().toISOString();
        const route = payload.route || (typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/mtss/pilot-testing");
        const appendToTrail = payload.appendToTrail !== false;

        setPilotState((prev) =>
            withTimestamp({
                ...prev,
                liveContext: {
                    ...prev.liveContext,
                    currentStepId: payload.currentStepId ?? prev.liveContext?.currentStepId ?? "",
                    currentStepTitle: payload.currentStepTitle ?? prev.liveContext?.currentStepTitle ?? "",
                    currentModal: payload.currentModal ?? prev.liveContext?.currentModal ?? "",
                    currentAction: payload.currentAction ?? prev.liveContext?.currentAction ?? "",
                    currentRoute: route,
                    lastActionAt: timestamp,
                },
                activityTrail: appendToTrail
                    ? [
                        {
                            type: payload.type || "interaction",
                            label: payload.label || "Pilot activity recorded",
                            stepId: payload.stepId || payload.currentStepId || prev.liveContext?.currentStepId || "",
                            stepTitle: payload.stepTitle || payload.currentStepTitle || prev.liveContext?.currentStepTitle || "",
                            route,
                            at: timestamp,
                        },
                        ...(Array.isArray(prev.activityTrail) ? prev.activityTrail : []),
                    ].slice(0, MAX_PILOT_ACTIVITY_EVENTS)
                    : prev.activityTrail,
            }),
        );
    }, []);

    useEffect(() => {
        setPilotState((previous) => {
            const nextState = hydratePilotState(user);
            const previousTesterEmail = String(previous?.tester?.email || "").trim().toLowerCase();
            const currentTesterEmail = String(user?.email || "").trim().toLowerCase();
            if (previousTesterEmail && currentTesterEmail && previousTesterEmail !== currentTesterEmail) {
                return nextState;
            }
            return {
                ...nextState,
                completedSteps: previous?.completedSteps || nextState.completedSteps,
                feedbackByStep: previous?.feedbackByStep || nextState.feedbackByStep,
                finalFeedback: previous?.finalFeedback || nextState.finalFeedback,
                finalFeedbackSavedAt: previous?.finalFeedbackSavedAt || nextState.finalFeedbackSavedAt,
                liveContext: previous?.liveContext || nextState.liveContext,
                activityTrail: previous?.activityTrail || nextState.activityTrail,
                lastUpdatedAt: previous?.lastUpdatedAt || nextState.lastUpdatedAt,
            };
        });
        setSyncState({
            status: "idle",
            lastSyncedAt: null,
            error: null,
        });
    }, [user]);

    useEffect(() => {
        savePilotState(user, pilotState);
    }, [pilotState, user]);

    useEffect(() => {
        recordPilotEvent({
            type: "hub-view",
            label: "Pilot Testing Hub viewed",
            currentAction: activeStepId ? "reviewing guided step" : "reviewing pilot hub",
            currentStepId: activeStep?.id || "",
            currentStepTitle: activeStep?.title || "",
            currentModal: finalFeedbackOpen ? "final-feedback" : activeStepId ? "step-feedback" : "",
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const completedCount = useMemo(
        () => pilotSteps.filter((step) => pilotState.completedSteps?.[step.id]).length,
        [pilotState.completedSteps],
    );
    const completionRate = Math.round((completedCount / pilotSteps.length) * 100);
    const activeStep = activeStepId ? pilotSteps.find((step) => step.id === activeStepId) : null;
    const feedbackCount = completedCount;
    const savedStepFeedbackEntries = useMemo(
        () => pilotSteps
            .filter((step) => pilotState.completedSteps?.[step.id])
            .map((step) => pilotState.feedbackByStep?.[step.id])
            .filter(Boolean),
        [pilotState.completedSteps, pilotState.feedbackByStep],
    );
    const derivedOverallConfidence = useMemo(
        () => computeDerivedConfidence(savedStepFeedbackEntries),
        [savedStepFeedbackEntries],
    );
    const confidenceSummary = useMemo(
        () => buildConfidenceSummary({
            completedCount,
            totalSteps: pilotSteps.length,
            derivedConfidence: derivedOverallConfidence,
            finalFeedback: pilotState.finalFeedback,
            finalFeedbackSavedAt: pilotState.finalFeedbackSavedAt,
        }),
        [completedCount, derivedOverallConfidence, pilotState.finalFeedback, pilotState.finalFeedbackSavedAt],
    );
    const teacherRunbook = useMemo(() => resolvePilotTeacherRunbook(user), [user]);
    const resolveHintRoute = useCallback(
        (page, step) => {
            if (!page || page.includes(":")) return null;
            const withStep = appendPilotStepRoute(page, step?.id);
            if (step?.requiresTeacherPersona) {
                return appendPilotTeacherPreviewRoute(withStep, user);
            }
            return withStep;
        },
        [user],
    );
    const remainingFeedbackCount = pilotSteps.length - completedCount;
    const allStepsReviewed = remainingFeedbackCount === 0;

    useEffect(() => {
        if (!user?.email || !pilotState?.sessionKey || !hasMeaningfulPilotState(pilotState)) {
            return undefined;
        }

        setSyncState((prev) => ({
            ...prev,
            status: prev.status === "synced" ? "synced" : "pending",
            error: null,
        }));

        const timeoutId = window.setTimeout(async () => {
            try {
                setSyncState((prev) => ({
                    ...prev,
                    status: "syncing",
                    error: null,
                }));

                const response = await upsertPilotFeedbackSession(
                    buildFeedbackExport({
                        user,
                        sessionKey: pilotState.sessionKey,
                        stepFeedback: pilotState.feedbackByStep,
                        finalFeedback: pilotState.finalFeedback,
                        completedSteps: pilotState.completedSteps,
                        updatedAt: pilotState.lastUpdatedAt,
                        finalFeedbackSavedAt: pilotState.finalFeedbackSavedAt,
                        liveContext: pilotState.liveContext,
                        activityTrail: pilotState.activityTrail,
                    }),
                );

                const lastSyncedAt = response?.session?.updatedAt
                    || response?.session?.clientUpdatedAt
                    || new Date().toISOString();

                setSyncState({
                    status: "synced",
                    lastSyncedAt,
                    error: null,
                });
            } catch (error) {
                setSyncState((prev) => ({
                    status: "error",
                    lastSyncedAt: prev.lastSyncedAt,
                    error: error?.response?.data?.message || error?.message || "Failed to sync pilot feedback.",
                }));
            }
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [pilotState, user]);

    const updateStepFeedback = useCallback((stepId, nextValue) => {
        setPilotState((prev) =>
            withTimestamp({
                ...prev,
                feedbackByStep: {
                    ...prev.feedbackByStep,
                    [stepId]: nextValue,
                },
            }),
        );
    }, []);

    const openPilotRoute = useCallback((route, description) => {
        if (route === "/mtss/pilot-testing") {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        window.open(route, "_blank", "noopener,noreferrer");
        toast({
            title: "Step opened in a new tab",
            description,
        });
    }, [toast]);

    const handleStartStep = useCallback((step) => {
        const route = buildPilotStartRoute(step, user);
        recordPilotEvent({
            type: "start-step",
            label: `Opened ${step.title}`,
            stepId: step.id,
            stepTitle: step.title,
            currentStepId: step.id,
            currentStepTitle: step.title,
            currentAction: `opened ${step.title.toLowerCase()}`,
            currentModal: "",
            route,
        });
        openPilotRoute(route, "The primary task page is now open. Keep this hub here, complete the task, then return to save step feedback.");
    }, [openPilotRoute, recordPilotEvent, user]);

    const handleOpenFinalFeedback = useCallback(() => {
        if (!allStepsReviewed) {
            toast({
                title: "Finish all step feedback first",
                description: `${remainingFeedbackCount} guided ${remainingFeedbackCount === 1 ? "step still needs" : "steps still need"} feedback before final feedback can be submitted.`,
                variant: "destructive",
            });
            return;
        }
        recordPilotEvent({
            type: "open-final-feedback",
            label: "Opened final feedback dialog",
            currentAction: "writing final feedback",
            currentModal: "final-feedback",
        });
        setFinalFeedbackOpen(true);
    }, [allStepsReviewed, recordPilotEvent, remainingFeedbackCount, toast]);

    const handleFinalDialogChange = useCallback((open) => {
        if (!open) {
            recordPilotEvent({
                type: "close-final-feedback",
                label: "Closed final feedback dialog",
                currentModal: "",
                currentAction: "reviewing pilot hub",
            });
            setFinalFeedbackOpen(false);
            return;
        }
        if (allStepsReviewed) {
            recordPilotEvent({
                type: "open-final-feedback",
                label: "Opened final feedback dialog",
                currentModal: "final-feedback",
                currentAction: "writing final feedback",
            });
            setFinalFeedbackOpen(true);
        }
    }, [allStepsReviewed, recordPilotEvent]);

    const handleSaveStepFeedback = useCallback(() => {
        if (!activeStep) return;

        setPilotState((prev) => {
            const draft = sanitizeFeedbackDraft(prev.feedbackByStep?.[activeStep.id]);
            return withTimestamp({
                ...prev,
                feedbackByStep: {
                    ...prev.feedbackByStep,
                    [activeStep.id]: draft,
                },
                completedSteps: {
                    ...prev.completedSteps,
                    [activeStep.id]: true,
                },
                liveContext: {
                    ...prev.liveContext,
                    currentStepId: activeStep.id,
                    currentStepTitle: activeStep.title,
                    currentModal: "",
                    currentAction: `saved feedback for ${activeStep.title.toLowerCase()}`,
                    currentRoute: typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/mtss/pilot-testing",
                    lastActionAt: new Date().toISOString(),
                },
                activityTrail: [
                    {
                        type: "save-step-feedback",
                        label: `Saved feedback for ${activeStep.title}`,
                        stepId: activeStep.id,
                        stepTitle: activeStep.title,
                        route: typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/mtss/pilot-testing",
                        at: new Date().toISOString(),
                    },
                    ...(Array.isArray(prev.activityTrail) ? prev.activityTrail : []),
                ].slice(0, MAX_PILOT_ACTIVITY_EVENTS),
            });
        });
        setActiveStepId(null);
        toast({
            title: "Step feedback saved",
            description: `${activeStep.title} is now recorded and counted as completed in the pilot hub.`,
        });
    }, [activeStep, toast]);

    useEffect(() => {
        if (pilotState.finalFeedbackSavedAt || !Number.isFinite(derivedOverallConfidence)) {
            return;
        }

        const suggestedRating = clampRating(Math.round(derivedOverallConfidence), 4);
        if (pilotState.finalFeedback?.overallConfidence === suggestedRating) {
            return;
        }

        setPilotState((prev) =>
            withTimestamp({
                ...prev,
                finalFeedback: {
                    ...prev.finalFeedback,
                    overallConfidence: suggestedRating,
                },
            }),
        );
    }, [derivedOverallConfidence, pilotState.finalFeedback?.overallConfidence, pilotState.finalFeedbackSavedAt]);

    const handleSaveFinalFeedback = useCallback(() => {
        if (!allStepsReviewed) {
            toast({
                title: "Step feedback is incomplete",
                description: "Final feedback stays locked until every guided step has saved feedback.",
                variant: "destructive",
            });
            return;
        }
        const savedAt = new Date().toISOString();
        setPilotState((prev) =>
            ({
                ...prev,
                finalFeedback: sanitizeFinalDraft(prev.finalFeedback),
                finalFeedbackSavedAt: savedAt,
                liveContext: {
                    ...prev.liveContext,
                    currentModal: "",
                    currentAction: "saved final feedback",
                    currentRoute: typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/mtss/pilot-testing",
                    lastActionAt: savedAt,
                },
                activityTrail: [
                    {
                        type: "save-final-feedback",
                        label: "Saved final feedback",
                        stepId: "",
                        stepTitle: "",
                        route: typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/mtss/pilot-testing",
                        at: savedAt,
                    },
                    ...(Array.isArray(prev.activityTrail) ? prev.activityTrail : []),
                ].slice(0, MAX_PILOT_ACTIVITY_EVENTS),
                lastUpdatedAt: savedAt,
            }),
        );
        setFinalFeedbackOpen(false);
        toast({
            title: "Final feedback saved",
            description: "Your pilot summary is saved and will sync to the review dashboard automatically.",
        });
    }, [allStepsReviewed, toast]);

    const handleCopySummary = useCallback(async () => {
        const summary = buildMarkdownSummary({
            user,
            sessionKey: pilotState.sessionKey,
            stepFeedback: pilotState.feedbackByStep,
            finalFeedback: pilotState.finalFeedback,
            completedSteps: pilotState.completedSteps,
            updatedAt: pilotState.lastUpdatedAt,
            finalFeedbackSavedAt: pilotState.finalFeedbackSavedAt,
        });

        try {
            await navigator.clipboard.writeText(summary);
            toast({
                title: "Summary copied",
                description: "The pilot feedback summary is now in your clipboard.",
            });
        } catch {
            toast({
                title: "Copy failed",
                description: "Please try again or use the JSON download instead.",
                variant: "destructive",
            });
        }
    }, [
        pilotState.completedSteps,
        pilotState.feedbackByStep,
        pilotState.finalFeedback,
        pilotState.lastUpdatedAt,
        pilotState.finalFeedbackSavedAt,
        pilotState.sessionKey,
        toast,
        user,
    ]);

    const handleDownloadJson = useCallback(() => {
        const payload = buildFeedbackExport({
            user,
            sessionKey: pilotState.sessionKey,
            stepFeedback: pilotState.feedbackByStep,
            finalFeedback: pilotState.finalFeedback,
            completedSteps: pilotState.completedSteps,
            updatedAt: pilotState.lastUpdatedAt,
            finalFeedbackSavedAt: pilotState.finalFeedbackSavedAt,
        });

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `mtss-pilot-feedback-${new Date().toISOString().slice(0, 10)}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
        toast({
            title: "JSON downloaded",
            description: "Pilot feedback export is ready to share with the MTSS team.",
        });
    }, [pilotState.completedSteps, pilotState.feedbackByStep, pilotState.finalFeedback, pilotState.lastUpdatedAt, pilotState.finalFeedbackSavedAt, pilotState.sessionKey, toast, user]);

    const handleResetPilot = useCallback(() => {
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(buildPilotStorageKey(user));
            window.localStorage.removeItem(PILOT_PROGRESS_STORAGE_KEY);
        }
        const nextState = hydratePilotState(user);
        setPilotState(nextState);
        setSyncState({
            status: "idle",
            lastSyncedAt: null,
            error: null,
        });
        toast({
            title: "Pilot progress reset",
            description: "All saved step feedback and final feedback drafts have been cleared.",
        });
    }, [toast, user]);

    return (
        <div className="mtss-theme mtss-animated-bg min-h-screen relative overflow-hidden text-foreground dark:text-white">
            <div className="mtss-bg-overlay" />
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-24 left-[5%] h-[26rem] w-[26rem] rounded-full bg-[#f472b6]/25 blur-[120px]" />
                <div className="absolute top-[10%] right-[8%] h-[24rem] w-[24rem] rounded-full bg-[#7c3aed]/25 blur-[120px]" />
                <div className="absolute bottom-[0%] left-[30%] h-[22rem] w-[22rem] rounded-full bg-[#22d3ee]/20 blur-[110px]" />
            </div>

            <div className="relative z-20 container-tight px-4 sm:px-6 py-8 lg:py-12 space-y-8">
                <section className="rounded-[36px] border border-white/35 bg-gradient-to-br from-[#fff7ed]/92 via-[#fdf4ff]/90 to-[#eff6ff]/92 p-6 shadow-[0_35px_120px_rgba(15,23,42,0.22)] dark:border-white/10 dark:from-[#180d2f]/92 dark:via-[#0f1730]/90 dark:to-[#08243b]/90">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-slate-700 shadow-lg dark:border-white/15 dark:bg-white/10 dark:text-white/85">
                                <ClipboardCheck className="h-4 w-4 text-rose-500" />
                                MTSS Pilot Testing Hub
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                                    Guided testing for principals,
                                    <span className="block bg-gradient-to-r from-[#ec4899] via-[#f59e0b] to-[#22c55e] bg-clip-text text-transparent">
                                        with structured feedback built in
                                    </span>
                                </h1>
                                <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-white/70 sm:text-base">
                                    Use this hub to run a comprehensive 50–60 minute MTSS pilot covering the full workflow — from mentor
                                    assignment and intervention creation to AI-powered insights and analytics. Each step tells principals
                                    what to test, where to go, what success looks like, and how to submit feedback.
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-[24px] border border-white/50 bg-white/80 p-4 shadow-lg dark:border-white/10 dark:bg-white/5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Time box</p>
                                    <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">50–60 min</p>
                                </div>
                                <div className="rounded-[24px] border border-white/50 bg-white/80 p-4 shadow-lg dark:border-white/10 dark:bg-white/5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Guided steps</p>
                                    <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{pilotSteps.length} checkpoints</p>
                                </div>
                                <div className="rounded-[24px] border border-white/50 bg-white/80 p-4 shadow-lg dark:border-white/10 dark:bg-white/5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Feedback mode</p>
                                    <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Per step, then final</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full max-w-md rounded-[32px] border border-white/55 bg-white/85 p-5 shadow-[0_25px_80px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">
                                        Pilot progress
                                    </p>
                                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                                        {completedCount} / {pilotSteps.length} step feedback saved
                                    </p>
                                </div>
                                <Badge className="rounded-full border-0 bg-gradient-to-r from-[#fb7185] via-[#f59e0b] to-[#22c55e] px-3 py-1 text-white">
                                    {completionRate}%
                                </Badge>
                            </div>

                            <Progress value={completionRate} className="mt-4 h-3 rounded-full bg-slate-200/70 dark:bg-white/10" />

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/50 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-white/55">Completed by feedback</p>
                                    <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{feedbackCount}</p>
                                </div>
                                <div className="rounded-2xl border border-white/50 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-white/55">Tester</p>
                                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{user?.name || user?.nickname || "Current user"}</p>
                                    <p className="text-xs text-slate-500 dark:text-white/55">{formatRole(user?.role || "principal")}</p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-white/50 bg-white/75 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <div>
                                        <p className="font-semibold text-slate-700 dark:text-white">
                                            Review sync:{" "}
                                            <span
                                                className={cn(
                                                    syncState.status === "error"
                                                        ? "text-rose-600 dark:text-rose-300"
                                                        : syncState.status === "synced"
                                                            ? "text-emerald-600 dark:text-emerald-300"
                                                            : "text-amber-600 dark:text-amber-300",
                                                )}
                                            >
                                                {syncState.status === "syncing"
                                                    ? "syncing now"
                                                    : syncState.status === "synced"
                                                        ? "live in admin review"
                                                        : syncState.status === "error"
                                                            ? "sync issue"
                                                            : "waiting for first change"}
                                            </span>
                                        </p>
                                        <p className="mt-1 text-slate-500 dark:text-white/55">
                                            {syncState.lastSyncedAt
                                                ? `Last synced: ${new Date(syncState.lastSyncedAt).toLocaleString()}`
                                                : "Your testing notes stay in this browser and sync automatically after changes."}
                                        </p>
                                    </div>
                                    {syncState.error ? (
                                        <span className="max-w-[18rem] text-right text-rose-600 dark:text-rose-300">{syncState.error}</span>
                                    ) : null}
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button variant="gradient" onClick={handleOpenFinalFeedback} disabled={!allStepsReviewed}>
                                    <MessageSquareText className="mr-2 h-4 w-4" />
                                    Final feedback
                                </Button>
                                <Button variant="glass" onClick={handleCopySummary}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy summary
                                </Button>
                                <Button variant="glass" onClick={handleDownloadJson}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download JSON
                                </Button>
                                <Button variant="outline" onClick={handleResetPilot}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                    <div className="rounded-[32px] border border-white/35 bg-white/85 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.15)] dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-gradient-to-br from-[#f97316] via-[#ec4899] to-[#6366f1] p-3 text-white shadow-lg">
                                <ListChecks className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">How principals should run the pilot</p>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Simple, guided, and hard to miss features</h2>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            {[
                                {
                                    icon: Target,
                                    title: "Follow the product flow",
                                    text: "Start from overview or teacher dashboard, then navigate naturally inside MTSS instead of relying on deep links.",
                                },
                                {
                                    icon: Gauge,
                                    title: "Save feedback to complete the step",
                                    text: "There is no manual mark-complete button. A step becomes complete automatically when its feedback form is saved.",
                                },
                                {
                                    icon: Sparkles,
                                    title: "Test in a new tab",
                                    text: "Start step opens MTSS in a new tab, so this guide stays visible while principals move through the product.",
                                },
                                {
                                    icon: TimerReset,
                                    title: "Unlock the wrap-up",
                                    text: "Final feedback stays locked until every guided step has saved feedback, making the submission sequence harder to break.",
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-[24px] border border-white/45 bg-gradient-to-br from-[#fff7ed]/70 via-white to-[#eff6ff]/70 p-5 dark:border-white/10 dark:from-white/5 dark:via-white/10 dark:to-white/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-2xl bg-slate-900 p-2 text-white dark:bg-white/10">
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-700 dark:text-white/85">{item.title}</h3>
                                    </div>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-white/70">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[32px] border border-white/35 bg-white/85 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.15)] dark:border-white/10 dark:bg-white/5">
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Feedback flow</p>
                        <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">When and how feedback should be submitted</h2>
                        <div className="mt-5 space-y-4">
                            {[
                                "Open a step from the Testing Hub. MTSS opens in a new tab so the guide remains available here.",
                                "Complete the activity inside MTSS, then return to this hub tab.",
                                "Save short step feedback. The save action automatically marks the step as completed.",
                                "Submit final feedback only after all guided steps show saved feedback.",
                                "Copy or download the summary to share with the MTSS rollout team.",
                            ].map((text, index) => (
                                <div key={text} className="flex gap-3 rounded-2xl border border-white/45 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#fb7185] to-[#22c55e] text-sm font-black text-white">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-white/70">{text}</p>
                                </div>
                        ))}
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[32px] border border-white/35 bg-gradient-to-br from-[#fff7ed]/90 via-white to-[#eff6ff]/90 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.15)] dark:border-white/10 dark:from-white/5 dark:via-white/10 dark:to-white/5">
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Teacher test account for this unit</p>
                        <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{teacherRunbook.displayName}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/70">
                            Use this teacher account during principal-as-teacher steps so the test matches how teachers will really work in the unit.
                        </p>
                        <div className="mt-5 grid gap-3">
                            {[
                                { label: "Teacher", value: `${teacherRunbook.fullName} (${teacherRunbook.email})` },
                                { label: "Unit", value: teacherRunbook.unit },
                                { label: "Pilot class", value: teacherRunbook.className },
                                { label: "Minimum workload", value: "Create 5 plans across 5 students, then make sure each plan has 3 weekly updates." },
                            ].map((item) => (
                                <div key={item.label} className="rounded-2xl border border-white/45 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-white/55">{item.label}</p>
                                    <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-800 dark:text-white">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[32px] border border-white/35 bg-white/85 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.15)] dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-gradient-to-br from-[#0ea5e9] via-[#6366f1] to-[#ec4899] p-3 text-white shadow-lg">
                                <ClipboardCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Principal briefing notes</p>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">What principals should be able to explain to teachers after this pilot</h2>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        {principalBriefingChecklist.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-[24px] border border-white/45 bg-gradient-to-br from-[#eff6ff]/80 via-white to-[#fff7ed]/70 p-5 dark:border-white/10 dark:from-white/5 dark:via-white/10 dark:to-white/5"
                            >
                                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-800 dark:text-white">
                                    {item.title}
                                </h3>
                                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700 dark:text-white/75">
                                    {item.points.map((point) => (
                                        <li key={point} className="flex gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900 dark:bg-white" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        </div>
                    </div>
                </section>

                <section className="space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Guided scenario document</p>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white">{pilotSteps.length}-step pilot checklist</h2>
                        </div>
                        <p className="max-w-2xl text-sm text-slate-600 dark:text-white/70">
                            Each card gives the test goal, the principal task, the action to perform, the expected outcome, and the coaching notes that principal can reuse when explaining the feature to teachers.
                        </p>
                    </div>

                    <div className="grid gap-5">
                        {pilotSteps.map((step) => {
                            const feedback = pilotState.feedbackByStep?.[step.id] || createEmptyStepFeedback();
                            const isCompleted = hasSavedStepFeedback(step.id, pilotState);
                            const snapshot = isCompleted ? getSavedStepSnapshot(feedback) : getUnsavedStepSnapshot();
                            const startRoute = buildPilotStartRoute(step, user);
                            const primaryActionLabel = step.primaryActionLabel || "Open step";

                            return (
                                <article
                                    key={step.id}
                                    className={cn(
                                        "rounded-[32px] border p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)] transition",
                                        isCompleted
                                            ? "border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/70 dark:border-emerald-400/30 dark:from-emerald-500/10 dark:via-white/5 dark:to-sky-500/10"
                                            : "border-white/35 bg-white/85 dark:border-white/10 dark:bg-white/5",
                                    )}
                                >
                                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f97316] via-[#ec4899] to-[#6366f1] text-sm font-black text-white shadow-lg">
                                                    {step.order}
                                                </span>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">{step.duration}</p>
                                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{step.title}</h3>
                                                </div>

                                                {isCompleted && (
                                                    <Badge className="rounded-full border-0 bg-emerald-500/90 px-3 py-1 text-white">
                                                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                                        Feedback saved
                                                    </Badge>
                                                )}
                                                {step.requiresTeacherPersona && (
                                                    <Badge variant="outline" className="rounded-full border-slate-300 bg-white/85 px-3 py-1 text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-white/75">
                                                        Teacher-flow step
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                                                <StepDetailCard icon={Target} title="Goal" description={step.goal} tone="soft" />
                                                <StepDetailCard icon={ListChecks} title="Actions" items={step.actions} tone="sky" />
                                                <StepDetailCard icon={CheckCircle2} title="Expected outcome" description={step.expectedOutcome} tone="mint" />
                                                <StepDetailCard icon={ClipboardCheck} title="Principal task" description={step.principalTask} tone="peach" />
                                                <StepDetailCard icon={Gauge} title="Technical focus" items={step.technicalFocus || []} tone="soft" />
                                                <StepDetailCard icon={Lightbulb} title="How to explain this to teachers" items={step.teacherTalkingPoints || []} tone="violet" />
                                            </div>

                                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                                                {Array.isArray(step.pageHints) && step.pageHints.length > 0 && (
                                                    <div className="rounded-[24px] border border-white/45 bg-white/80 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                                                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-white/55">Pages for this step</p>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {step.pageHints.map((page) => {
                                                                const hintRoute = resolveHintRoute(page, step);
                                                                const isReferenceOnly = !hintRoute;
                                                                return (
                                                                    <button
                                                                        key={page}
                                                                        type="button"
                                                                        disabled={isReferenceOnly}
                                                                        onClick={() =>
                                                                            hintRoute
                                                                                ? openPilotRoute(hintRoute, "The referenced page is open in a new tab for this testing step.")
                                                                                : undefined
                                                                        }
                                                                        className={cn(
                                                                            "rounded-full border px-3 py-1 text-[11px] font-semibold transition",
                                                                            isReferenceOnly
                                                                                ? "cursor-default border-slate-200 bg-slate-100/90 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white/35"
                                                                                : "border-sky-200 bg-sky-50/90 text-sky-700 hover:-translate-y-0.5 hover:bg-sky-100 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20",
                                                                        )}
                                                                    >
                                                                        {page}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-white/50">
                                                            Gray route chips are references only because they need a dynamic ID from the current session.
                                                        </p>
                                                    </div>
                                                )}

                                                {step.requiresTeacherPersona && (
                                                    <div className="rounded-[24px] border border-amber-200 bg-amber-50/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-amber-400/20 dark:bg-amber-500/10">
                                                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-white/55">Teacher account</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-white">
                                                            {teacherRunbook.fullName} · {teacherRunbook.email}
                                                        </p>
                                                        <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-white/70">
                                                            Use the {teacherRunbook.className} pilot class for create, edit, and progress-testing tasks in this unit.
                                                        </p>
                                                        <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-white/55">
                                                            Start step opens the teacher workflow preview in a new tab so this guide stays visible.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="rounded-[24px] border border-white/45 bg-white/74 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/5">
                                                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-white/55">Coverage tags</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {step.featureKeys.map((feature) => (
                                                        <span
                                                            key={feature}
                                                            className="rounded-full border border-white/50 bg-white/85 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
                                                        >
                                                            {formatFeatureKey(feature)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full max-w-sm space-y-4 rounded-[28px] border border-white/45 bg-white/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] xl:sticky xl:top-6 dark:border-white/10 dark:bg-white/5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-white/55">Step snapshot</p>
                                                    <p className="text-base font-black text-slate-900 dark:text-white">
                                                        {isCompleted ? "Feedback saved" : "Feedback not saved yet"}
                                                    </p>
                                                </div>
                                                <Flag className={cn("h-5 w-5 shrink-0", feedback.bugFound ? "text-rose-500" : "text-slate-300 dark:text-white/20")} />
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <SnapshotMetric
                                                    label="Status"
                                                    value={snapshot.statusLabel}
                                                    tone={snapshot.statusTone}
                                                />
                                                <SnapshotMetric
                                                    label="Bug"
                                                    value={snapshot.bugLabel}
                                                    tone={snapshot.bugTone}
                                                />
                                                <SnapshotMetric label="Ease" value={snapshot.easeLabel} />
                                                <SnapshotMetric label="Clarity" value={snapshot.clarityLabel} />
                                            </div>

                                            <div className="rounded-[24px] border border-white/45 bg-gradient-to-br from-[#f8fafc] via-white to-[#eff6ff]/85 p-4 dark:border-white/10 dark:from-white/5 dark:via-white/10 dark:to-white/5">
                                                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-white/55">Route plan</p>
                                                <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-white/65">
                                                    <p>
                                                        Start page: <span className="font-semibold text-slate-900 dark:text-white">{startRoute}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <Button variant="gradient" onClick={() => handleStartStep(step)}>
                                                    <ArrowRight className="mr-2 h-4 w-4" />
                                                    {primaryActionLabel}
                                                </Button>
                                                <Button
                                                    variant="glass"
                                                    onClick={() => {
                                                        recordPilotEvent({
                                                            type: "open-step-feedback",
                                                            label: `Opened step feedback for ${step.title}`,
                                                            stepId: step.id,
                                                            stepTitle: step.title,
                                                            currentStepId: step.id,
                                                            currentStepTitle: step.title,
                                                            currentModal: "step-feedback",
                                                            currentAction: `writing feedback for ${step.title.toLowerCase()}`,
                                                        });
                                                        setActiveStepId(step.id);
                                                    }}
                                                >
                                                    <MessageSquareText className="mr-2 h-4 w-4" />
                                                    Add step feedback
                                                </Button>
                                            </div>

                                            <div className="rounded-[24px] border border-dashed border-white/50 bg-white/55 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                                                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-white/55">How to use these buttons</p>
                                                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-white/65">
                                                    {step.routeGuidance ||
                                                        "Use the main button to open the starting dashboard, then continue to the target feature yourself inside MTSS."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-[32px] border border-white/35 bg-gradient-to-br from-[#eff6ff]/90 via-[#fdf4ff]/90 to-[#fff7ed]/90 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.15)] dark:border-white/10 dark:from-[#0f1730]/90 dark:via-[#180d2f]/90 dark:to-[#08243b]/90">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-gradient-to-br from-[#6366f1] via-[#ec4899] to-[#f97316] p-3 text-white shadow-lg">
                            <Bot className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">AI Assistant</p>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Tips & Tricks for Using the AI Assistant</h2>
                        </div>
                    </div>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-white/70">
                        The MTSS system includes AI-powered features designed to save time and surface insights that might be missed manually.
                        These tips will help you get the most out of each AI capability during the pilot and beyond.
                    </p>
                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {aiTipsAndTricks.map((tip) => (
                            <div
                                key={tip.id}
                                className="rounded-[24px] border border-white/45 bg-white/85 p-5 shadow-lg transition hover:shadow-xl dark:border-white/10 dark:bg-white/5"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#ec4899] p-2 text-white">
                                        <Lightbulb className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <h3 className="text-sm font-black text-slate-800 dark:text-white">{tip.title}</h3>
                                        <p className="text-xs leading-relaxed text-slate-600 dark:text-white/70">{tip.description}</p>
                                        <span className="inline-block rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-[10px] font-semibold text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                                            {tip.applicableTo}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[32px] border border-white/35 bg-white/85 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.15)] dark:border-white/10 dark:bg-white/5">
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Feature coverage mapping</p>
                        <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Feature ↔ step traceability</h2>
                        <div className="mt-5 overflow-hidden rounded-[24px] border border-white/45 dark:border-white/10">
                            <div className="grid grid-cols-[1.1fr_1fr] bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white">
                                <span>Feature</span>
                                <span>Validated in step</span>
                            </div>
                            <div className="divide-y divide-white/40 dark:divide-white/10">
                                {pilotFeatureCoverage.map((entry) => (
                                    <div key={entry.feature} className="grid grid-cols-[1.1fr_1fr] gap-4 bg-white/75 px-4 py-4 text-sm dark:bg-white/5">
                                        <p className="font-semibold text-slate-800 dark:text-white">{entry.feature}</p>
                                        <p className="text-slate-600 dark:text-white/70">{entry.steps.join(", ")}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[32px] border border-white/35 bg-white/85 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.15)] dark:border-white/10 dark:bg-white/5">
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Final wrap-up</p>
                        <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Close the pilot with structured insight</h2>
                        <div className="mt-5 space-y-4">
                            <div className="rounded-[24px] border border-white/45 bg-gradient-to-br from-[#eff6ff]/85 via-white to-[#fff7ed]/80 p-5 dark:border-white/10 dark:from-white/5 dark:via-white/10 dark:to-white/5">
                                <p className="text-sm leading-relaxed text-slate-700 dark:text-white/75">
                                    Final feedback unlocks only after every guided step has saved feedback. This wrap-up captures rollout readiness,
                                    the most useful feature, confusing points, missing capabilities, and the top improvement priorities.
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/45 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-white/55">Overall confidence</p>
                                    <p
                                        className={cn(
                                            "mt-1 text-2xl font-black",
                                            confidenceSummary.tone === "positive"
                                                ? "text-emerald-600 dark:text-emerald-300"
                                                : confidenceSummary.tone === "warning"
                                                    ? "text-amber-600 dark:text-amber-300"
                                                    : confidenceSummary.tone === "danger"
                                                        ? "text-rose-600 dark:text-rose-300"
                                                        : "text-slate-900 dark:text-white",
                                        )}
                                    >
                                        {confidenceSummary.displayValue}
                                    </p>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-white/55">
                                        {confidenceSummary.helper}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/45 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-white/55">Rollout readiness</p>
                                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                                        {readinessLabels[pilotState.finalFeedback.readiness]}
                                    </p>
                                </div>
                            </div>
                            {!allStepsReviewed && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/85 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                                    Final feedback is locked until the remaining {remainingFeedbackCount} guided {remainingFeedbackCount === 1 ? "step saves" : "steps save"} feedback.
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <Button variant="gradient" onClick={handleOpenFinalFeedback} disabled={!allStepsReviewed}>
                                    <MessageSquareText className="mr-2 h-4 w-4" />
                                    Open final feedback
                                </Button>
                                <Button variant="glass" onClick={handleCopySummary}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy final summary
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <StepFeedbackDialog
                open={Boolean(activeStepId)}
                onOpenChange={(open) => {
                    if (!open) {
                        recordPilotEvent({
                            type: "close-step-feedback",
                            label: `Closed step feedback for ${activeStep?.title || "current step"}`,
                            stepId: activeStep?.id || "",
                            stepTitle: activeStep?.title || "",
                            currentStepId: activeStep?.id || "",
                            currentStepTitle: activeStep?.title || "",
                            currentModal: "",
                            currentAction: "reviewing pilot hub",
                        });
                        setActiveStepId(null);
                    }
                }}
                step={activeStep}
                value={activeStep ? pilotState.feedbackByStep?.[activeStep.id] || createEmptyStepFeedback() : createEmptyStepFeedback()}
                onChange={(nextValue) => {
                    if (!activeStep) return;
                    recordPilotEvent({
                        type: "edit-step-feedback",
                        label: `Editing feedback for ${activeStep.title}`,
                        stepId: activeStep.id,
                        stepTitle: activeStep.title,
                        currentStepId: activeStep.id,
                        currentStepTitle: activeStep.title,
                        currentModal: "step-feedback",
                        currentAction: `editing feedback for ${activeStep.title.toLowerCase()}`,
                        appendToTrail: false,
                    });
                    updateStepFeedback(activeStep.id, nextValue);
                }}
                onSave={handleSaveStepFeedback}
            />

            <FinalFeedbackDialog
                open={finalFeedbackOpen}
                onOpenChange={handleFinalDialogChange}
                value={pilotState.finalFeedback}
                onChange={(nextValue) =>
                    {
                        recordPilotEvent({
                            type: "edit-final-feedback",
                            label: "Editing final feedback",
                            currentModal: "final-feedback",
                            currentAction: "editing final feedback",
                            appendToTrail: false,
                        });
                        setPilotState((prev) =>
                            withTimestamp({
                                ...prev,
                                finalFeedback: nextValue,
                            }),
                        );
                    }
                }
                onSave={handleSaveFinalFeedback}
                blocked={!allStepsReviewed}
                remainingCount={remainingFeedbackCount}
                derivedOverallConfidence={derivedOverallConfidence}
            />
        </div>
    );
});

MTSSPilotTestingHubPage.displayName = "MTSSPilotTestingHubPage";

export default MTSSPilotTestingHubPage;
