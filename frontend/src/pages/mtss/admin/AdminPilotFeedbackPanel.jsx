import { memo, useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertTriangle,
    Bug,
    Clock3,
    MessageSquare,
    Search,
    Sparkles,
    Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import usePilotFeedbackDashboardData from "../hooks/usePilotFeedbackDashboardData";
import {
    PilotCoverageCard,
    PilotDecisionHub,
    PilotEmptyState,
    PilotFilterSelect,
    PilotIdentityCard,
    PilotInsightTile,
    PilotKpiBar,
    PilotLiveMonitor,
    PilotMetadataStrip,
    PilotPageHeader,
    PilotPanelSection,
    PilotPulseRibbon,
    PilotReadinessMiniChart,
    PilotSessionListItem,
    PilotStepFeedbackCard,
    PilotActivityTimeline,
} from "./components/PilotFeedbackPanelParts";
import {
    buildBugSeveritySummary,
    buildReadinessDistribution,
    buildReadinessTrendData,
    buildStepCoverage,
    COMPLETION_STATUS_LABELS,
    formatDateTime,
    formatRelativeTime,
    getSessionReadinessKey,
    getSessionReadinessLabel,
    READINESS_LABELS,
    STATUS_LABELS,
} from "./utils/pilotFeedbackPanelUtils";

const statusOptions = [
    { value: "all", label: "All status" },
    { value: "in_progress", label: "In progress" },
    { value: "completed", label: "Completed" },
];

const readinessOptions = [
    { value: "all", label: "All readiness" },
    { value: "yes", label: READINESS_LABELS.yes },
    { value: "almost", label: READINESS_LABELS.almost },
    { value: "not-yet", label: READINESS_LABELS["not-yet"] },
    { value: "draft", label: READINESS_LABELS.draft },
];

const bugOptions = [
    { value: "all", label: "All bugs" },
    { value: "bugged", label: "With bugs" },
    { value: "clean", label: "No bugs" },
];

const getPrincipalIdentityKey = (session = {}) => {
    const testerEmail = String(session?.tester?.email || "").trim().toLowerCase();
    if (testerEmail) {
        return `email:${testerEmail}`;
    }

    const testerUserId = String(session?.tester?.userId || "").trim();
    if (testerUserId) {
        return `user:${testerUserId}`;
    }

    const testerName = String(session?.tester?.name || "").trim().toLowerCase();
    const testerUnit = String(session?.tester?.unit || "").trim().toLowerCase();
    if (testerName || testerUnit) {
        return `fallback:${testerName}:${testerUnit}`;
    }

    return `session:${session?.sessionKey || "unknown-session"}`;
};

const collapseSessionsByPrincipal = (items = []) => {
    const seen = new Set();

    return items.filter((session) => {
        const principalKey = getPrincipalIdentityKey(session);
        if (seen.has(principalKey)) {
            return false;
        }

        seen.add(principalKey);
        return true;
    });
};

const AdminPilotFeedbackPanel = memo(() => {
    const { sessions, stats, loading, error, refresh, lastLiveEventAt } = usePilotFeedbackDashboardData({ enabled: true });
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [readinessFilter, setReadinessFilter] = useState("all");
    const [bugFilter, setBugFilter] = useState("all");
    const [selectedPrincipalKey, setSelectedPrincipalKey] = useState("");

    const principalSessions = useMemo(() => collapseSessionsByPrincipal(sessions), [sessions]);

    const filteredSessions = useMemo(() => {
        const loweredQuery = query.trim().toLowerCase();

        const matchingSessions = principalSessions.filter((session) => {
            const testerName = String(session?.tester?.name || "").toLowerCase();
            const testerEmail = String(session?.tester?.email || "").toLowerCase();
            const testerUnit = String(session?.tester?.unit || "").toLowerCase();
            const readinessKey = getSessionReadinessKey(session);
            const hasBug = Number(session?.bugCount || 0) > 0;

            const matchesQuery =
                !loweredQuery
                || testerName.includes(loweredQuery)
                || testerEmail.includes(loweredQuery)
                || testerUnit.includes(loweredQuery);
            const matchesStatus = statusFilter === "all" || session?.status === statusFilter;
            const matchesReadiness = readinessFilter === "all" || readinessKey === readinessFilter;
            const matchesBug = bugFilter === "all" || (bugFilter === "bugged" ? hasBug : !hasBug);

            return matchesQuery && matchesStatus && matchesReadiness && matchesBug;
        });
        return matchingSessions;
    }, [bugFilter, principalSessions, query, readinessFilter, statusFilter]);

    const selectedSession = useMemo(
        () => filteredSessions.find((entry) => getPrincipalIdentityKey(entry) === selectedPrincipalKey) || filteredSessions[0] || null,
        [filteredSessions, selectedPrincipalKey],
    );

    const stepCoverage = useMemo(() => buildStepCoverage(principalSessions), [principalSessions]);
    const readinessTrend = useMemo(() => buildReadinessTrendData(filteredSessions), [filteredSessions]);
    const readinessDistribution = useMemo(() => buildReadinessDistribution(principalSessions), [principalSessions]);
    const selectedBugSummary = useMemo(() => buildBugSeveritySummary(selectedSession), [selectedSession]);

    const coverageSummary = useMemo(() => ({
        totalSteps: stepCoverage.length,
        fullyCoveredSteps: stepCoverage.filter((entry) => entry.completionRate === 100).length,
    }), [stepCoverage]);

    useEffect(() => {
        if (!filteredSessions.length) {
            setSelectedPrincipalKey("");
            return;
        }

        if (!filteredSessions.some((entry) => getPrincipalIdentityKey(entry) === selectedPrincipalKey)) {
            setSelectedPrincipalKey(getPrincipalIdentityKey(filteredSessions[0]));
        }
    }, [filteredSessions, selectedPrincipalKey]);

    const selectedStatusLabel = STATUS_LABELS[selectedSession?.status] || "In progress";
    const selectedReadinessLabel = getSessionReadinessLabel(selectedSession);
    const selectedUpdatedAt = selectedSession?.updatedAt || selectedSession?.clientUpdatedAt;
    const selectedLatencyLabel = formatRelativeTime(selectedUpdatedAt);
    const selectedFinalSaved = Boolean(selectedSession?.finalFeedbackSavedAt);
    const selectedCompletionRate = Number(selectedSession?.completionRate || 0);
    const selectedConfidenceLabel = selectedFinalSaved
        ? `${selectedSession?.finalFeedback?.overallConfidence || 0}/5`
        : "Draft";
    const selectedFinalSavedLabel = formatDateTime(selectedSession?.finalFeedbackSavedAt);

    const reviewPriorityNote = selectedBugSummary?.highestSeverity
        ? `Start with the ${selectedBugSummary.highestSeverity} severity bug, then verify the recommendation aligns with the evidence.`
        : selectedFinalSaved
            ? "Session is clean. Confirm the recommendation reads consistently with each guided step."
            : "No bug reported, but the principal still owes a final recommendation before rollout decisions are locked.";

    return (
        <div className="space-y-6">
            <PilotPageHeader
                lastLiveEventAt={lastLiveEventAt}
                onRefresh={refresh}
                sessionCount={stats?.totalSessions}
                principalCount={stats?.principalCount}
            />

            <PilotKpiBar stats={stats} />

            <PilotPulseRibbon
                stats={stats}
                coverageSummary={coverageSummary}
                readinessDistribution={readinessDistribution}
            />

            <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)] 2xl:grid-cols-[24rem_minmax(0,1fr)] 2xl:items-start">
                <div className="space-y-6 xl:sticky xl:top-6">
                    <PilotPanelSection
                        eyebrow="Session navigator"
                        title="Pick the latest principal snapshot"
                        description="Search, filter, and open the newest pilot feedback for each principal while older sessions stay preserved in history."
                        action={(
                            <Badge variant="outline" className="rounded-full border-slate-300 bg-white/85 dark:border-white/15 dark:bg-white/10">
                                {filteredSessions.length}/{principalSessions.length}
                            </Badge>
                        )}
                    >
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    className="h-11 rounded-2xl border-white/45 bg-white/86 pl-9 shadow-sm dark:border-white/10 dark:bg-white/10"
                                    placeholder="Search principal, email, or unit"
                                />
                            </div>
                            <div className="grid gap-2 sm:grid-cols-3">
                                <PilotFilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
                                <PilotFilterSelect value={readinessFilter} onChange={setReadinessFilter} options={readinessOptions} />
                                <PilotFilterSelect value={bugFilter} onChange={setBugFilter} options={bugOptions} />
                            </div>
                        </div>

                        <div className="mt-5">
                            {loading ? (
                                <PilotEmptyState
                                    title="Loading pilot feedback sessions..."
                                    description="The navigator is preparing the latest principal feedback."
                                />
                            ) : error ? (
                                <div className="rounded-[28px] border border-rose-200 bg-rose-50/85 p-5 dark:border-rose-400/30 dark:bg-rose-500/10">
                                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">{error}</p>
                                    <Button variant="glass" className="mt-3 rounded-2xl" onClick={refresh}>
                                        Retry
                                    </Button>
                                </div>
                            ) : filteredSessions.length ? (
                                <div className="space-y-3 max-h-[64rem] overflow-y-auto pr-1">
                                    {filteredSessions.map((session) => (
                                        <PilotSessionListItem
                                            key={getPrincipalIdentityKey(session)}
                                            session={session}
                                            active={getPrincipalIdentityKey(session) === getPrincipalIdentityKey(selectedSession)}
                                            onSelect={() => setSelectedPrincipalKey(getPrincipalIdentityKey(session))}
                                            readinessLabel={getSessionReadinessLabel(session)}
                                            statusLabel={STATUS_LABELS[session?.status] || "In progress"}
                                            formattedUpdatedAt={formatDateTime(session?.updatedAt || session?.clientUpdatedAt)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <PilotEmptyState
                                    title="No sessions match these filters"
                                    description="Clear one or more filters to widen the feedback list."
                                />
                            )}
                        </div>
                    </PilotPanelSection>
                </div>

                <div className="space-y-6">
                    {selectedSession ? (
                        <>
                            <PilotIdentityCard
                                session={selectedSession}
                                statusLabel={selectedStatusLabel}
                                readinessLabel={selectedReadinessLabel}
                                lastUpdatedLabel={selectedLatencyLabel}
                                bugSummary={selectedBugSummary}
                                completionRate={selectedCompletionRate}
                                confidenceLabel={selectedConfidenceLabel}
                                finalSaved={selectedFinalSaved}
                            />

                            <PilotDecisionHub
                                readinessLabel={selectedReadinessLabel}
                                confidenceLabel={selectedConfidenceLabel}
                                finalSaved={selectedFinalSaved}
                                bugSummary={selectedBugSummary}
                                reviewPriorityNote={reviewPriorityNote}
                                finalSavedAtLabel={selectedFinalSavedLabel}
                            />

                            <PilotPanelSection
                                eyebrow="Live monitor"
                                title="Exactly what the principal is doing now"
                                description="Real-time operational view: current step, open dialog, route in focus, and the latest action captured from the pilot hub."
                            >
                                <PilotLiveMonitor session={selectedSession} />
                            </PilotPanelSection>

                            <PilotPanelSection
                                eyebrow="Confidence trend"
                                title="How rollout confidence is trending"
                                description="Recent final feedback entries plotted side by side, colored by readiness verdict."
                            >
                                <PilotReadinessMiniChart data={readinessTrend} />
                            </PilotPanelSection>

                            <PilotPanelSection
                                eyebrow="Insight deck"
                                title="What the principal flagged as useful, confusing, slow, or missing"
                                description="A compact briefing board you can scan before talking to teachers or the product team."
                            >
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    <PilotInsightTile
                                        eyebrow="Most useful"
                                        title="Feature that helped the most"
                                        value={selectedSession?.finalFeedback?.mostUsefulFeature}
                                        icon={Sparkles}
                                        tone="success"
                                    />
                                    <PilotInsightTile
                                        eyebrow="Most confusing"
                                        title="Feature that created confusion"
                                        value={selectedSession?.finalFeedback?.mostConfusingFeature}
                                        icon={AlertTriangle}
                                        tone="warning"
                                    />
                                    <PilotInsightTile
                                        eyebrow="Slowest part"
                                        title="Where the flow felt slow"
                                        value={selectedSession?.finalFeedback?.slowestPart}
                                        icon={Clock3}
                                        tone="warning"
                                    />
                                    <PilotInsightTile
                                        eyebrow="Missing feature"
                                        title="Capability still missing"
                                        value={selectedSession?.finalFeedback?.missingFeature}
                                        icon={Bug}
                                        tone="danger"
                                    />
                                    <PilotInsightTile
                                        eyebrow="Improvement plan"
                                        title="Top priorities before wider rollout"
                                        value={selectedSession?.finalFeedback?.topImprovements}
                                        icon={Wrench}
                                        tone="info"
                                        multiline
                                    />
                                    <PilotInsightTile
                                        eyebrow="Open notes"
                                        title="Additional commentary from the principal"
                                        value={selectedSession?.finalFeedback?.additionalComments}
                                        icon={MessageSquare}
                                        tone="default"
                                        multiline
                                    />
                                </div>
                            </PilotPanelSection>

                            <PilotPanelSection
                                eyebrow="Sync trail"
                                title="Identifiers and audit timestamps"
                                description="Operational details kept separate from the narrative so the page stays detailed without becoming noisy."
                            >
                                <PilotMetadataStrip
                                    session={selectedSession}
                                    finalSavedAtLabel={selectedFinalSavedLabel}
                                    sessionKey={selectedSession?.sessionKey}
                                    completionLabel={`${selectedSession?.completedStepCount || 0}/${selectedSession?.stepCount || 0}`}
                                />
                            </PilotPanelSection>

                            <PilotPanelSection
                                eyebrow="Recent activity"
                                title="Latest pilot actions from this principal"
                                description="A short activity trail captured while the principal opens steps, writes feedback, and saves the pilot wrap-up."
                            >
                                <PilotActivityTimeline items={selectedSession?.activityTrail || []} />
                            </PilotPanelSection>

                            <PilotPanelSection
                                eyebrow="Step-by-step evidence"
                                title="Guided step ratings, friction notes, and bug reports"
                                description="Open each step to inspect ease/clarity/speed scores, partial completion reasons, and reproduction details."
                                action={(
                                    <Badge variant="outline" className="rounded-full border-slate-300 bg-white/85 dark:border-white/15 dark:bg-white/10">
                                        {selectedSession?.stepFeedback?.length || 0} guided steps
                                    </Badge>
                                )}
                            >
                                <div className="space-y-4">
                                    {(selectedSession?.stepFeedback || []).map((step) => (
                                        <PilotStepFeedbackCard
                                            key={step.stepId}
                                            step={step}
                                            completionStatusLabel={COMPLETION_STATUS_LABELS[step.completionStatus] || step.completionStatus}
                                        />
                                    ))}
                                </div>
                            </PilotPanelSection>
                        </>
                    ) : (
                        <PilotPanelSection
                            eyebrow="Selected session"
                            title="No principal session selected"
                            description="Choose a principal session from the navigator to open the full review dashboard."
                        >
                            <PilotEmptyState
                                title="Nothing selected yet"
                                description="Once a session is selected, this area will show the verdict, confidence, insight deck, and step-by-step evidence."
                            />
                        </PilotPanelSection>
                    )}
                </div>
            </div>

            <PilotPanelSection
                eyebrow="Pilot coverage map"
                title="Which guided steps the pilot has already exercised"
                description="A whole-pilot view: how many principals have produced evidence for each MTSS step in the walkthrough."
                action={(
                    <Badge variant="outline" className="rounded-full border-slate-300 bg-white/85 dark:border-white/15 dark:bg-white/10">
                        <Activity className="mr-1.5 h-3.5 w-3.5" />
                        {coverageSummary.fullyCoveredSteps}/{coverageSummary.totalSteps} steps fully covered
                    </Badge>
                )}
            >
                {stepCoverage.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {stepCoverage.map((entry) => (
                            <PilotCoverageCard
                                key={entry.stepId}
                                order={entry.order}
                                title={entry.title}
                                completed={entry.completed}
                                total={entry.total}
                                completionRate={entry.completionRate}
                            />
                        ))}
                    </div>
                ) : (
                    <PilotEmptyState
                        title="No coverage data yet"
                        description="Coverage will appear once principals begin saving pilot step feedback."
                    />
                )}
            </PilotPanelSection>
        </div>
    );
});

AdminPilotFeedbackPanel.displayName = "AdminPilotFeedbackPanel";

export default AdminPilotFeedbackPanel;
