import { memo, Suspense, lazy, useMemo } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { ClipboardCheck, FileText, MessageSquareText } from "lucide-react";
import useMtssObserver from "./hooks/useMtssObserver";
import { adminTabs, heroCard, overviewIcons } from "./data/adminDashboardContent";
import useAdminDashboardData from "./hooks/useAdminDashboardData";
import { useAdminDashboardState } from "./hooks/useAdminDashboardState";
import AdminHeroSection from "./admin/AdminHeroSection";
import { canAccessPilotFeedbackAdmin } from "./utils/pilotFeedbackAccess";
import PilotTaskHintBanner from "./components/PilotTaskHintBanner";
import { resolvePilotStepGuide } from "./utils/pilotStepGuidance";
import {
    buildStaffGreeting,
    formatStaffDisplayName,
    resolveStaffGender
} from "@/utils/staffIdentity";

const AdminOverviewPanel = lazy(() => import("./admin/AdminOverviewPanel"));
const AdminStudentsPanel = lazy(() => import("./admin/AdminStudentsPanel"));
const AdminMentorsPanel = lazy(() => import("./admin/AdminMentorsPanel"));
const AdminAnalyticsPanel = lazy(() => import("./admin/AdminAnalyticsPanel"));
const AdminPilotFeedbackPanel = lazy(() => import("./admin/AdminPilotFeedbackPanel"));
const AdminPilotSummaryReportPanel = lazy(() => import("./admin/AdminPilotSummaryReportPanel"));

const PanelFallback = () => (
    <div className="glass glass-card p-8 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>
);

const AdminDashboardPage = memo(() => {
    const { user } = useSelector((state) => state.auth);
    const { isObserver } = useMtssObserver();
    const navigate = useNavigate();
    const location = useLocation();
    const pilotGuide = useMemo(() => resolvePilotStepGuide(location.search), [location.search]);
    const showGlobalPilotGuide = Boolean(
        pilotGuide?.pageType === "admin" && !pilotGuide?.studentAction && !pilotGuide?.mentorAction && !pilotGuide?.panelArea,
    );
    const showPilotFeedbackTab = canAccessPilotFeedbackAdmin(user);
    const dashboardTabs = useMemo(
        () => (
            showPilotFeedbackTab
                ? [
                    ...adminTabs,
                    { key: "pilot-feedback", label: "Pilot Feedback", icon: MessageSquareText },
                    { key: "pilot-report", label: "Feedback Summary", icon: FileText },
                ]
                : adminTabs
        ),
        [showPilotFeedbackTab],
    );

    const {
        students,
        supportUnits,
        statCards,
        systemSnapshot,
        recentActivity,
        mentorSpotlights,
        mentorRoster,
        mentorSubjectCoverageRows,
        subjectStudentBreakdown,
        mentors,
        successByType,
        trendData,
        trendPaths,
        analyticsSummary,
        analyticsNarrative,
        strategyHighlights,
        tierMovement,
        loading,
        error,
        refresh,
    } = useAdminDashboardData();
    const dashboardRows = supportUnits?.length ? supportUnits : students;

    const {
        activeTab,
        setActiveTab,
        filters,
        visibleCount,
        setVisibleCount,
        handleFilterChange,
        filteredStudents,
        gradeOptions,
        tierOptions,
        typeOptions,
        mentorOptions,
        handleViewStudent,
        handleQuickUpdate,
        clearFilters,
        selectedIds,
        toggleSelection,
        resetSelection,
    } = useAdminDashboardState(
        dashboardRows,
        dashboardTabs.map((tab) => tab.key),
    );

    const adminHeroCard = useMemo(() => {
        const nameWithTitle = formatStaffDisplayName({
            nickname: user?.nickname,
            username: user?.username,
            name: user?.name,
            gender: resolveStaffGender(user),
            fallback: "MTSS Admin",
        });
        const heading = buildStaffGreeting(nameWithTitle, {
            morning: [
                "Good morning %NAME%, let's guide today's MTSS glow.",
                "Morning %NAME%, time to uplift every grade.",
            ],
            afternoon: [
                "Good afternoon %NAME%, keep the joyful momentum alive.",
                "%NAME%, your afternoon command center is ready.",
            ],
            evening: [
                "Good evening %NAME%, let's close the day with clarity.",
                "Evening %NAME%, time for a focused MTSS wrap-up.",
            ],
        });
        const roleLabel = user?.jobPosition || user?.unit || heroCard.badgeCaption || "Principal dashboard";
        return {
            ...heroCard,
            badgeCaption: roleLabel,
            heading,
            subheading: "Oversee joyful MTSS momentum with live caseloads, mentors, and progress signals.",
        };
    }, [user]);

    const activePanel = useMemo(() => {
        switch (activeTab) {
            case "overview":
                return (
                    <AdminOverviewPanel
                        pilotGuide={pilotGuide}
                        statCards={statCards}
                        systemSnapshot={systemSnapshot}
                        subjectStudentBreakdown={subjectStudentBreakdown}
                        recentActivity={recentActivity}
                        mentorSpotlights={mentorSpotlights}
                        icons={overviewIcons}
                    />
                );
            case "students":
                return (
                    <AdminStudentsPanel
                        pilotGuide={pilotGuide}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        gradeOptions={gradeOptions}
                        tierOptions={tierOptions}
                        typeOptions={typeOptions}
                        mentorOptions={mentorOptions}
                        filteredStudents={filteredStudents}
                        allStudents={dashboardRows}
                        onClearFilters={clearFilters}
                        visibleCount={visibleCount}
                        onVisibleCountChange={setVisibleCount}
                        onViewStudent={handleViewStudent}
                        onUpdateStudent={isObserver ? undefined : handleQuickUpdate}
                        isReadOnly={isObserver}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelection}
                        onResetSelection={resetSelection}
                        mentorDirectory={mentors}
                        onRefresh={refresh}
                    />
                );
            case "mentors":
                return (
                    <AdminMentorsPanel
                        pilotGuide={pilotGuide}
                        mentorRoster={mentorRoster}
                        mentorDirectory={mentors}
                        students={students}
                    />
                );
            case "analytics":
                return (
                    <AdminAnalyticsPanel
                        pilotGuide={pilotGuide}
                        successByType={successByType}
                        trendPaths={trendPaths}
                        trendData={trendData}
                        analyticsSummary={analyticsSummary}
                        analyticsNarrative={analyticsNarrative}
                        strategyHighlights={strategyHighlights}
                        tierMovement={tierMovement}
                        mentorSubjectCoverageRows={mentorSubjectCoverageRows}
                    />
                );
            case "pilot-feedback":
                return showPilotFeedbackTab ? <AdminPilotFeedbackPanel /> : null;
            case "pilot-report":
                return showPilotFeedbackTab ? <AdminPilotSummaryReportPanel /> : null;
            default:
                return null;
        }
    }, [
        activeTab,
        filters,
        dashboardRows,
        gradeOptions,
        tierOptions,
        typeOptions,
        mentorOptions,
        filteredStudents,
        visibleCount,
        setVisibleCount,
        handleFilterChange,
        handleViewStudent,
        handleQuickUpdate,
        clearFilters,
        selectedIds,
        toggleSelection,
        resetSelection,
        mentorRoster,
        mentorSubjectCoverageRows,
        subjectStudentBreakdown,
        mentors,
        statCards,
        systemSnapshot,
        recentActivity,
        mentorSpotlights,
        successByType,
        trendData,
        trendPaths,
        analyticsSummary,
        analyticsNarrative,
        strategyHighlights,
        tierMovement,
        isObserver,
        refresh,
        pilotGuide,
        showPilotFeedbackTab,
        students,
    ]);

    return (
        <div className="mtss-theme mtss-animated-bg min-h-screen relative overflow-hidden">
            <div className="mtss-bg-overlay" />
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 left-0 w-96 h-96 bg-[#ff80b5]/30 blur-[180px]" />
                <div className="absolute top-40 right-0 w-80 h-80 bg-[#60a5fa]/30 blur-[180px]" />
                <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-[#fcd34d]/20 blur-[180px]" />
            </div>

            <div className="relative z-20 container-tight py-12 lg:py-16 text-foreground dark:text-white space-y-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} data-aos="fade-up">
                    <AdminHeroSection
                        heroCard={adminHeroCard}
                        tabs={dashboardTabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        pilotGuide={pilotGuide?.pageType === "admin" ? pilotGuide : null}
                    />
                </motion.div>

                {showGlobalPilotGuide && (
                    <PilotTaskHintBanner guide={pilotGuide} actionLabel="Review this page in order" />
                )}

                <div className="flex justify-end" data-aos="fade-left" data-aos-delay="60">
                    <button
                        type="button"
                        onClick={() => navigate("/mtss/pilot-testing")}
                        className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    >
                        <ClipboardCheck className="h-4 w-4 text-primary" />
                        Open Pilot Testing Hub
                    </button>
                </div>

                {(loading || error) && (
                    <div className="rounded-2xl border border-border/50 bg-white/70 dark:bg-white/10 px-4 py-3 flex items-center justify-between gap-4 text-sm text-muted-foreground">
                        <span>{error || "Syncing MTSS data..."}</span>
                        {error && (
                            <button onClick={refresh} className="text-primary font-semibold hover:underline">
                                Retry
                            </button>
                        )}
                    </div>
                )}

                <div data-aos="fade-up" data-aos-delay="120">
                    <Suspense fallback={<PanelFallback />}>{activePanel}</Suspense>
                </div>
            </div>
        </div>
    );
});

AdminDashboardPage.displayName = "AdminDashboardPage";
export default AdminDashboardPage;
