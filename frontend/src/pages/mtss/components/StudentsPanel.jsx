import { memo, useMemo, useState, useCallback, useDeferredValue, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import PilotTaskHintBanner from "./PilotTaskHintBanner";
import StudentsTable from "./StudentsTable";
import QuickUpdateModal from "./QuickUpdateModal";
import { updateMentorAssignment, uploadEvidenceAttachments } from "@/services/mtssService";
import { canUserSubmitProgressForAssignment } from "../utils/editPlanAccess";
import { ensureStudentInterventions, getMostCriticalForDisplay } from "../utils/interventionUtils";
import { FilterBar, RosterHeader, LoadMore, STUDENTS_PANEL_BATCH } from "./StudentsPanelParts";
import useMtssPersistentState from "../hooks/useMtssPersistentState";

const DEFAULT_VIEW_STATE = {
    activeTier: "All",
    query: "",
    visibleCount: STUDENTS_PANEL_BATCH,
};

const getStudentRowId = (student = {}) =>
    student.id || student._id || student.supportUnit?.assignmentId || student.baseStudentId || student.slug || student.name;

const getBaseStudentId = (student = {}) =>
    student.baseStudentId || student._id || student.id || student.slug || student.name;

const dedupeBy = (items = [], keyFn) => {
    const seen = new Set();
    return items.filter((item, index) => {
        const key = keyFn(item, index);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const groupStudentsForRoster = (students = []) => {
    const grouped = new Map();

    students.forEach((student) => {
        const baseId = getBaseStudentId(student) || getStudentRowId(student);
        if (!baseId) return;
        if (!grouped.has(baseId)) {
            grouped.set(baseId, {
                ...student,
                id: baseId,
                baseStudentId: baseId,
                supportUnitRows: [],
                assignmentOptions: [],
                interventions: [],
            });
        }

        const entry = grouped.get(baseId);
        entry.supportUnitRows.push(student);
        entry.assignmentOptions.push(...(Array.isArray(student.assignmentOptions) ? student.assignmentOptions : []));
        entry.interventions.push(...(Array.isArray(student.interventions) ? student.interventions : []));
    });

    return Array.from(grouped.values()).map((student) => ({
        ...student,
        supportUnitCount: student.supportUnitRows.length,
        assignmentOptions: dedupeBy(
            student.assignmentOptions,
            (option, index) => `${option.assignmentId || index}:${option.focus || option.subject || option.focusArea || index}`,
        ),
        interventions: dedupeBy(
            student.interventions,
            (intervention, index) => `${intervention.id || index}:${intervention.label || intervention.type || index}`,
        ),
    }));
};

const StudentsPanel = memo(({ students, TierPill, ProgressBadge, onRefresh, onEditPlan, canEditPlanForStudent, pilotGuide = null }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [modalState, setModalState] = useState({ type: null, student: null });
    const [savingUpdate, setSavingUpdate] = useState(false);
    const storageKey = `mtss:students-panel:${location.pathname}`;
    // Capture ?search= URL param once at mount — stable ref, not re-created on re-render
    const urlSearchRef = useRef(new URLSearchParams(location.search).get('search') || '');
    // Keep DEFAULT_VIEW_STATE as initial value (stable module-level constant)
    // so useMtssPersistentState's deps never change → its restore-effect only runs once
    const [viewState, setViewState] = useMtssPersistentState(storageKey, DEFAULT_VIEW_STATE);
    const activeTier = typeof viewState?.activeTier === "string" ? viewState.activeTier : "All";
    const query = typeof viewState?.query === "string" ? viewState.query : "";
    const visibleCount = Math.max(Number(viewState?.visibleCount) || STUDENTS_PANEL_BATCH, STUDENTS_PANEL_BATCH);

    const deferredQuery = useDeferredValue(query.trim().toLowerCase());
    const rosterStudents = useMemo(() => groupStudentsForRoster(students), [students]);

    const filteredStudents = useMemo(() =>
        rosterStudents.filter((student) => {
            const supportRows = Array.isArray(student.supportUnitRows) && student.supportUnitRows.length
                ? student.supportUnitRows
                : [student];
            const interventions = ensureStudentInterventions(student.interventions);
            const criticalInfo = getMostCriticalForDisplay(interventions, student.profile, student);
            const matchesTier = activeTier === "All" || supportRows.some((row) => {
                const rowInterventions = ensureStudentInterventions(row.interventions);
                const rowCritical = getMostCriticalForDisplay(rowInterventions, row.profile, row);
                return (rowCritical?.tier || row.tier) === activeTier;
            });
            if (!deferredQuery) return matchesTier;
            const chipLabels = interventions.map((entry) => entry.label).join(" ");
            const assignmentLabels = Array.isArray(student.assignmentOptions)
                ? student.assignmentOptions
                    .map((option) => `${option.focus || ""} ${(option.focusAreas || []).join(" ")} ${option.mentor || ""} ${option.pairingLabel || ""}`)
                    .join(" ")
                : "";
            const supportUnitLabels = supportRows
                .map((row) => `${row.supportUnit?.pairingLabel || row.pairingLabel || ""} ${row.supportUnit?.subject || ""} ${row.mentor || ""}`)
                .join(" ");
            const searchPool = `${student.name} ${student.type || ""} ${student.grade || ""} ${student.className || ""} ${supportUnitLabels} ${assignmentLabels} ${criticalInfo?.label || ""} ${chipLabels}`.toLowerCase();
            return matchesTier && searchPool.includes(deferredQuery);
        }),
    [rosterStudents, activeTier, deferredQuery]);

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

    // Override any sessionStorage-restored query with URL param (runs once: setQuery is stable)
    useEffect(() => {
        if (urlSearchRef.current) setQuery(urlSearchRef.current);
    }, [setQuery]);

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
                const evidencePayload = await uploadEvidenceAttachments(evidenceFiles);

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
                    description: evidencePayload?.length
                        ? `${student.name}'s update was recorded with ${evidencePayload.length} evidence file${evidencePayload.length === 1 ? "" : "s"}.`
                        : `${student.name}'s update was recorded!`,
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
                    key={modalState.student?._id}
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
