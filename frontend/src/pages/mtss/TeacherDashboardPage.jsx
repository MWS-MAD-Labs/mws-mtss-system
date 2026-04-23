import { memo, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fieldClasses, tabs } from "./data/teacherDashboardContent";
import { useTeacherDashboardState } from "./hooks/useTeacherDashboardState";
import useTeacherDashboardData from "./hooks/useTeacherDashboardData";
import TeacherHeroSection from "./teacher/TeacherHeroSection";
import { useToast } from "@/components/ui/use-toast";
import { useSelector } from "react-redux";
import PageLoader from "@/components/PageLoader";
import { fetchMtssMentors } from "@/services/mtssService";
import { useLocation, useNavigate } from "react-router-dom";
import QuickUpdateModal from "./components/QuickUpdateModal";
import PilotTaskHintBanner from "./components/PilotTaskHintBanner";
import TeacherDashboardPanels from "./components/TeacherDashboardPanels";
import TeacherDashboardStatus from "./components/TeacherDashboardStatus";
import useTeacherDashboardActions from "./hooks/useTeacherDashboardActions";
import { canUserEditPlanForStudent, resolveEditableAssignmentForUser } from "./utils/editPlanAccess";
import { resolvePilotTeacherPreview } from "./utils/pilotTeacherPreview";
import { resolvePilotStepGuide } from "./utils/pilotStepGuidance";
import useMtssObserver from "./hooks/useMtssObserver";

const CheckinCollageLayer = lazy(() => import("@/components/emotion-staff/CheckinCollageLayer"));

const TeacherDashboardPage = memo(() => {
    const { toast } = useToast();
    const authUser = useSelector((state) => state.auth?.user);
    const { isObserver } = useMtssObserver();
    const navigate = useNavigate();
    const location = useLocation();
    const pageRef = useRef(null);
    const pilotTeacherPreview = useMemo(() => resolvePilotTeacherPreview(location.search), [location.search]);
    const pilotGuide = useMemo(() => resolvePilotStepGuide(location.search), [location.search]);
    const showGlobalPilotGuide = Boolean(
        pilotGuide?.pageType === "teacher" && !pilotGuide?.studentAction && !pilotGuide?.formAction,
    );
    const [resolvedPilotTeacher, setResolvedPilotTeacher] = useState(null);

    useEffect(() => {
        let isMounted = true;

        if (!pilotTeacherPreview?.email) {
            setResolvedPilotTeacher(null);
            return () => {
                isMounted = false;
            };
        }

        setResolvedPilotTeacher(pilotTeacherPreview);

        fetchMtssMentors({ search: pilotTeacherPreview.email, unit: pilotTeacherPreview.unit })
            .then((payload) => {
                if (!isMounted) return;
                const mentors = payload?.mentors || [];
                const exactMatch = mentors.find(
                    (mentor) => String(mentor?.email || "").trim().toLowerCase() === String(pilotTeacherPreview.email).trim().toLowerCase(),
                );
                if (!exactMatch) return;
                setResolvedPilotTeacher({
                    ...pilotTeacherPreview,
                    ...exactMatch,
                    name: exactMatch.name || pilotTeacherPreview.fullName,
                    username: exactMatch.username || pilotTeacherPreview.displayName,
                    jobPosition: exactMatch.jobPosition || pilotTeacherPreview.jobPosition,
                    role: exactMatch.role || pilotTeacherPreview.role,
                    classes: Array.isArray(exactMatch.classes) && exactMatch.classes.length ? exactMatch.classes : pilotTeacherPreview.classes,
                });
            })
            .catch(() => {
                if (isMounted) {
                    setResolvedPilotTeacher(pilotTeacherPreview);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [pilotTeacherPreview]);

    const effectiveTeacherUser = resolvedPilotTeacher || pilotTeacherPreview || authUser;
    const {
        statCards,
        students,
        progressData,
        heroBadge,
        loading: dataLoading,
        error: dataError,
        refresh,
    } = useTeacherDashboardData(effectiveTeacherUser);
    const {
        activeTab,
        setActiveTab,
        interventionForm,
        progressForm,
        editingPlan,
        isEditingPlan,
        handleInterventionChange,
        handleProgressChange,
        handleSavePlan,
        startEditingPlan,
        cancelEditingPlan,
        resetProgressForm,
        submittingPlan,
        setSubmittingProgress,
        submittingProgress,
    } = useTeacherDashboardState(tabs, { onSaveSuccess: refresh, viewerUser: effectiveTeacherUser });
    const [quickUpdateStudent, setQuickUpdateStudent] = useState(null);
    const [savingQuickUpdate, setSavingQuickUpdate] = useState(false);

    const { base: baseFieldClass, textarea: textareaClass, notes: notesTextareaClass } = fieldClasses;
    const handleViewStudent = useCallback(
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

    const handleOpenQuickUpdate = useCallback((student) => setQuickUpdateStudent(student), []);
    const canEditPlanForStudent = useCallback(
        (student) => {
            const assignmentOption = resolveEditableAssignmentForUser(effectiveTeacherUser, student);
            return Boolean(assignmentOption?.assignmentId);
        },
        [effectiveTeacherUser],
    );
    const handleEditPlan = useCallback(
        (payload) => {
            const student = payload?.student || payload;
            if (!student) return;

            const assignmentOption = payload?.assignmentOption || resolveEditableAssignmentForUser(effectiveTeacherUser, student);
            if (!assignmentOption?.assignmentId) {
                toast({
                    title: "No editable intervention",
                    description: `${student?.name || "Student"} doesn't have an intervention plan you can edit.`,
                    variant: "destructive",
                });
                return;
            }

            if (!canUserEditPlanForStudent(effectiveTeacherUser, student, assignmentOption)) {
                toast({
                    title: "Edit permission denied",
                    description: "Only homeroom teacher or matching subject teacher can edit this intervention plan.",
                    variant: "destructive",
                });
                return;
            }

            startEditingPlan(student, assignmentOption);
        },
        [effectiveTeacherUser, startEditingPlan, toast],
    );
    const handleCancelEditPlan = useCallback(() => {
        cancelEditingPlan();
        setActiveTab("students");
    }, [cancelEditingPlan, setActiveTab]);
    const heroTabs = useMemo(() => {
        const hiddenKeys = isObserver ? ["edit", "create", "submit"] : ["edit"];
        return tabs.filter((tab) => !hiddenKeys.includes(tab.key));
    }, [isObserver]);
    const handleHeroTabChange = useCallback(
        (nextTab) => {
            if (nextTab === "edit" && !isEditingPlan) {
                toast({
                    title: "No active edit session",
                    description: "Use Edit Plan from Dashboard/My Students to open the dedicated edit workspace.",
                });
                return;
            }
            if (nextTab === "create" && isEditingPlan) {
                cancelEditingPlan();
            }
            setActiveTab(nextTab);
        },
        [cancelEditingPlan, isEditingPlan, setActiveTab, toast],
    );
    const handleCloseQuickUpdate = useCallback(() => setQuickUpdateStudent(null), []);
    const { handleProgressSubmitForm, handleQuickUpdateSubmit } = useTeacherDashboardActions({
        students,
        progressForm,
        resetProgressForm,
        refresh,
        setSubmittingProgress,
        toast,
        setSavingQuickUpdate,
        onCloseQuickUpdate: handleCloseQuickUpdate,
    });

    return (
        <div ref={pageRef} className="ecd-page-root mtss-theme mtss-animated-bg min-h-screen relative text-foreground dark:text-white transition-colors">
            {(submittingPlan || submittingProgress || savingQuickUpdate) && <PageLoader />}
            <div className="mtss-bg-overlay" />

            {/* Human-centered hybrid photo background */}
            <Suspense fallback={null}>
                <CheckinCollageLayer pageSeed={42} variant="hybrid-studio" />
            </Suspense>

            {/* Soft color blobs (background layer) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                <div className="absolute -top-20 left-[10%] w-[26rem] h-[26rem] rounded-full bg-[#6366f1] opacity-[0.22] dark:opacity-[0.14] blur-[90px]" />
                <div className="absolute -top-32 right-[5%] w-[30rem] h-[30rem] rounded-full bg-[#c084fc] opacity-[0.20] dark:opacity-[0.13] blur-[100px]" />
                <div className="absolute top-[15%] right-[30%] w-[22rem] h-[22rem] rounded-full bg-[#22d3ee] opacity-[0.18] dark:opacity-[0.10] blur-[80px]" />
                <div className="absolute top-[40%] left-[45%] w-[28rem] h-[28rem] rounded-full bg-[#fbbf24] opacity-[0.14] dark:opacity-[0.08] blur-[120px]" />
                <div className="absolute -bottom-32 -left-20 w-[30rem] h-[30rem] rounded-full bg-[#22d3ee] opacity-[0.20] dark:opacity-[0.12] blur-[100px]" />
                <div className="absolute -bottom-20 right-[15%] w-[24rem] h-[24rem] rounded-full bg-[#f472b6] opacity-[0.18] dark:opacity-[0.11] blur-[100px]" />
                <div className="absolute top-[60%] left-[5%] w-[20rem] h-[20rem] rounded-full bg-[#10b981] opacity-[0.14] dark:opacity-[0.09] blur-[90px]" />
            </div>
            {/* Floating gradient orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
                <div className="mtss-orb mtss-orb-1" />
                <div className="mtss-orb mtss-orb-2" />
                <div className="mtss-orb mtss-orb-3" />
                <div className="mtss-orb mtss-orb-4" />
                <div className="mtss-orb mtss-orb-5" />
                <div className="mtss-orb mtss-orb-6" />
                <div className="mtss-orb mtss-orb-7" />
            </div>

            <div className="relative z-20 container-tight px-4 sm:px-6 py-8 lg:py-14 space-y-8 lg:space-y-10">
                <section
                    className="mtss-gradient-border overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 shadow-[0_25px_60px_rgba(148,163,184,0.25)]"
                    data-aos="fade-up"
                    data-aos-duration="700"
                >
                    <TeacherHeroSection
                        heroBadge={heroBadge}
                        tabs={heroTabs}
                        activeTab={activeTab}
                        onTabChange={handleHeroTabChange}
                        pilotGuide={pilotGuide?.pageType === "teacher" ? pilotGuide : null}
                    />
                </section>

                {pilotTeacherPreview && (
                    <section
                        className="rounded-[28px] border border-amber-200/80 bg-gradient-to-r from-amber-50/95 via-white to-sky-50/90 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-amber-400/20 dark:from-amber-500/10 dark:via-white/5 dark:to-sky-500/10"
                        data-aos="fade-up"
                        data-aos-delay="60"
                    >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-1">
                                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Teacher workflow preview</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    You are reviewing the MTSS teacher flow for {pilotTeacherPreview.fullName} · {pilotTeacherPreview.className}.
                                </p>
                                <p className="text-sm text-slate-600 dark:text-white/70">
                                    This preview keeps the principal inside the real teacher pages while matching the pilot class and unit teacher context for guided testing.
                                </p>
                            </div>
                            <div className="rounded-full border border-white/60 bg-white/85 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-white/15 dark:bg-white/5 dark:text-white/75">
                                Pilot teacher: {pilotTeacherPreview.displayName}
                            </div>
                        </div>
                    </section>
                )}

                {showGlobalPilotGuide && (
                    <PilotTaskHintBanner guide={pilotGuide} actionLabel="Use this path next" />
                )}

                <TeacherDashboardStatus loading={dataLoading} error={dataError} onRetry={refresh} />

                <TeacherDashboardPanels
                    activeTab={activeTab}
                    pilotGuide={pilotGuide?.pageType === "teacher" ? pilotGuide : null}
                    statCards={statCards}
                    students={students}
                    progressData={progressData}
                    interventionForm={interventionForm}
                    progressForm={progressForm}
                    handleInterventionChange={handleInterventionChange}
                    handleProgressChange={handleProgressChange}
                    handleSavePlan={handleSavePlan}
                    handleProgressSubmitForm={handleProgressSubmitForm}
                    baseFieldClass={baseFieldClass}
                    textareaClass={textareaClass}
                    notesTextareaClass={notesTextareaClass}
                    submittingPlan={submittingPlan}
                    submittingProgress={submittingProgress}
                    onViewStudent={handleViewStudent}
                    onQuickUpdate={isObserver ? undefined : handleOpenQuickUpdate}
                    onEditPlan={isObserver ? undefined : handleEditPlan}
                    canEditPlanForStudent={isObserver ? () => false : canEditPlanForStudent}
                    editingPlan={editingPlan}
                    onCancelEditPlan={handleCancelEditPlan}
                    refresh={refresh}
                />
            </div>
            {quickUpdateStudent && !isObserver && (
                <QuickUpdateModal
                    student={quickUpdateStudent}
                    onClose={handleCloseQuickUpdate}
                    onSubmit={handleQuickUpdateSubmit}
                    submitting={savingQuickUpdate}
                />
            )}
        </div>
    );
});

TeacherDashboardPage.displayName = "TeacherDashboardPage";
export default TeacherDashboardPage;
