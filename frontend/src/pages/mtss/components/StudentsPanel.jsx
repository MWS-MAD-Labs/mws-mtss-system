import { memo, useMemo, useState, useCallback, useDeferredValue } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import PilotTaskHintBanner from "./PilotTaskHintBanner";
import StudentsTable from "./StudentsTable";
import QuickUpdateModal from "./QuickUpdateModal";
import { updateMentorAssignment, uploadEvidence } from "@/services/mtssService";
import { canUserSubmitProgressForAssignment } from "../utils/editPlanAccess";
import { ensureStudentInterventions, getMostCriticalForDisplay } from "../utils/interventionUtils";
import { FilterBar, RosterHeader, LoadMore, STUDENTS_PANEL_BATCH } from "./StudentsPanelParts";
import useMtssPersistentState from "../hooks/useMtssPersistentState";

const DEFAULT_VIEW_STATE = {
    activeTier: "All",
    query: "",
    visibleCount: STUDENTS_PANEL_BATCH,
};

const StudentsPanel = memo(({ students, TierPill, ProgressBadge, onRefresh, onEditPlan, canEditPlanForStudent, pilotGuide = null }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [modalState, setModalState] = useState({ type: null, student: null });
    const [savingUpdate, setSavingUpdate] = useState(false);
    const storageKey = `mtss:students-panel:${location.pathname}`;
    const [viewState, setViewState] = useMtssPersistentState(storageKey, DEFAULT_VIEW_STATE);
    const activeTier = typeof viewState?.activeTier === "string" ? viewState.activeTier : "All";
    const query = typeof viewState?.query === "string" ? viewState.query : "";
    const visibleCount = Math.max(Number(viewState?.visibleCount) || STUDENTS_PANEL_BATCH, STUDENTS_PANEL_BATCH);

    const deferredQuery = useDeferredValue(query.trim().toLowerCase());

    const filteredStudents = useMemo(() =>
        students.filter((student) => {
            const interventions = ensureStudentInterventions(student.interventions);
            const criticalInfo = getMostCriticalForDisplay(interventions, student.profile, student);
            const tierLabel = criticalInfo?.tier || student.tier;
            const matchesTier = activeTier === "All" || tierLabel === activeTier;
            if (!deferredQuery) return matchesTier;
            const chipLabels = interventions.map((entry) => entry.label).join(" ");
            const searchPool = `${student.name} ${student.type || ""} ${student.grade || ""} ${student.className || ""} ${criticalInfo?.label || ""} ${chipLabels}`.toLowerCase();
            return matchesTier && searchPool.includes(deferredQuery);
        }),
    [students, activeTier, deferredQuery]);

    const visibleStudents = useMemo(
        () => filteredStudents.slice(0, Math.min(visibleCount, filteredStudents.length)),
        [filteredStudents, visibleCount],
    );

    const setActiveTier = useCallback((value) => {
        setViewState((prev) => ({
            ...(prev || {}),
            activeTier: value,
            visibleCount: STUDENTS_PANEL_BATCH,
        }));
    }, [setViewState]);

    const setQuery = useCallback((value) => {
        setViewState((prev) => ({
            ...(prev || {}),
            query: value,
            visibleCount: STUDENTS_PANEL_BATCH,
        }));
    }, [setViewState]);

    const setVisibleCount = useCallback((updater) => {
        setViewState((prev) => {
            const currentValue = Math.max(Number(prev?.visibleCount) || STUDENTS_PANEL_BATCH, STUDENTS_PANEL_BATCH);
            const nextValue = typeof updater === "function" ? updater(currentValue) : updater;
            return {
                ...(prev || {}),
                visibleCount: Math.max(Number(nextValue) || STUDENTS_PANEL_BATCH, STUDENTS_PANEL_BATCH),
            };
        });
    }, [setViewState]);

    const handleView = useCallback(
        (student) => {
            if (!student?.slug) return;
            navigate(`/mtss/student/${student.slug}`, {
                state: {
                    from: {
                        pathname: location.pathname,
                        search: location.search,
                    },
                },
            });
        },
        [location.pathname, location.search, navigate],
    );

    const handleOpen = useCallback((type, student) => setModalState({ type, student }), []);
    const handleClose = useCallback(() => setModalState({ type: null, student: null }), []);

    const handleQuickSubmit = useCallback(
        async (student, formState, evidenceFiles = []) => {
            const assignmentId = formState?.assignmentId || student?.assignmentId;
            if (!assignmentId) {
                toast({
                    title: "No active intervention",
                    description: `${student?.name || "Student"} isn't linked to an active intervention yet.`,
                    variant: "destructive",
                });
                return;
            }
            const selectedOption = Array.isArray(student?.assignmentOptions)
                ? student.assignmentOptions.find((option) => option?.assignmentId === assignmentId)
                : null;
            if (!canUserSubmitProgressForAssignment(selectedOption)) {
                toast({
                    title: "Progress permission denied",
                    description: "You can only submit progress for subjects assigned to you.",
                    variant: "destructive",
                });
                return;
            }
            setSavingUpdate(true);
            try {
                let evidencePayload;
                if (evidenceFiles.length > 0) {
                    const rawFiles = evidenceFiles.map((f) => f.file);
                    const uploadResult = await uploadEvidence(rawFiles);
                    evidencePayload = uploadResult?.data?.evidence;
                }

                const trimmedNotes = formState.notes?.trim() || "";
                const parsedScoreValue = formState.scoreValue !== "" ? Number(formState.scoreValue) : undefined;

                await updateMentorAssignment(assignmentId, {
                    checkIns: [
                        {
                            date: formState.date,
                            summary: trimmedNotes || "Quick update",
                            nextSteps: trimmedNotes || undefined,
                            value: Number.isFinite(parsedScoreValue) ? parsedScoreValue : undefined,
                            unit: formState.scoreUnit,
                            performed: formState.performed === "yes",
                            skipReason: formState.performed !== "yes" ? (formState.skipReason || undefined) : undefined,
                            skipReasonNote: formState.performed !== "yes" && formState.skipReason === "other" ? (formState.skipReasonNote || undefined) : undefined,
                            celebration: formState.badge || undefined,
                            evidence: evidencePayload?.length ? evidencePayload : undefined,
                        },
                    ],
                });
                toast({
                    title: "Progress update saved",
                    description: `${student.name}'s update was recorded!`,
                });
                handleClose();
                onRefresh?.();
            } catch (error) {
                toast({
                    title: "Failed to save update",
                    description: error?.response?.data?.message || error.message || "Please try again in a moment.",
                    variant: "destructive",
                });
            } finally {
                setSavingUpdate(false);
            }
        },
        [toast, handleClose, onRefresh],
    );

    return (
        <div className="space-y-6 mtss-theme">
            {pilotGuide && (
                <PilotTaskHintBanner guide={pilotGuide} actionLabel="Click this next inside the teacher roster" />
            )}

            <FilterBar activeTier={activeTier} setActiveTier={setActiveTier} query={query} setQuery={setQuery} />

            <section
                className="rounded-[32px] border border-white/40 bg-white/95 dark:bg-slate-900/40 p-6 space-y-4 shadow-[0_14px_48px_rgba(15,23,42,0.14)]"
                data-aos="fade-up"
                data-aos-delay="80"
            >
                <RosterHeader visible={visibleStudents.length} total={filteredStudents.length} />

                <div data-aos="fade-up" data-aos-delay="120">
                        <StudentsTable
                            students={visibleStudents}
                            TierPill={TierPill}
                            ProgressBadge={ProgressBadge}
                            showActions
                            pilotHintAction={pilotGuide?.studentAction || null}
                            onView={handleView}
                            onUpdate={(student) => handleOpen("update", student)}
                        onEditPlan={onEditPlan}
                        canEditPlanForStudent={canEditPlanForStudent}
                    />
                </div>

                <LoadMore
                    visible={visibleStudents.length}
                    total={filteredStudents.length}
                    onLoadMore={() => setVisibleCount((prev) => Math.min(filteredStudents.length, prev + STUDENTS_PANEL_BATCH))}
                />
            </section>

            {modalState.type === "update" && (
                <QuickUpdateModal
                    student={modalState.student}
                    onClose={handleClose}
                    onSubmit={handleQuickSubmit}
                    submitting={savingUpdate}
                />
            )}
        </div>
    );
});

StudentsPanel.displayName = "StudentsPanel";
export default StudentsPanel;
