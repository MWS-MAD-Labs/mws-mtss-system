import { memo, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useStudentPortalState } from "./hooks/useStudentPortalState";
import StudentSelectionView from "./student/StudentSelectionView";
import StudentProgressPanel from "./student/StudentProgressPanel";
import StudentSchedulePanel from "./student/StudentSchedulePanel";
import StudentMessagesPanel from "./student/StudentMessagesPanel";
import StudentBottomBar from "./student/portal/StudentBottomBar";
import StudentPortalHeader from "./student/portal/StudentPortalHeader";
import StudentPortalTabs from "./student/portal/StudentPortalTabs";
import { resolveBadges, resolveTierShortLabel } from "./student/portal/studentPortalUtils";
import "@/pages/styles/student-ios-system.css";

const StudentPortalPage = memo(() => {
    const {
        selectedStudent,
        activeTab,
        setActiveTab,
        currentStudent,
        handleBack,
        handleSelectStudent,
        students,
        isLoadingList,
        isLoadingDetail,
        error,
        refreshPortal,
    } = useStudentPortalState();

    const [isHeaderSnapped, setIsHeaderSnapped] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsHeaderSnapped((prev) => {
            if (!prev && latest > 22) return true;
            if (prev && latest < 10) return false;
            return prev;
        });
    });

    if (!selectedStudent) {
        return (
            <>
                <StudentSelectionView
                    students={students}
                    onSelect={handleSelectStudent}
                    onBack={handleBack}
                    isLoading={isLoadingList}
                    error={error}
                    onRetry={refreshPortal}
                />
                <StudentBottomBar />
            </>
        );
    }

    const gradeLabel = currentStudent?.grade || currentStudent?.currentGrade || "-";
    const classLabel = currentStudent?.className || "Class not set";
    const tierLabel = currentStudent?.tier || currentStudent?.primaryIntervention?.tier || "Tier 1";
    const tierShortLabel = resolveTierShortLabel(tierLabel);
    const navBadges = resolveBadges(currentStudent);

    return (
        <div
            className="mtss-theme student-shell min-h-screen relative overflow-hidden text-slate-800 dark:text-white"
            data-student-theme="portal"
        >
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(251,191,36,0.35),transparent_45%),radial-gradient(circle_at_82%_18%,rgba(244,114,182,0.28),transparent_42%),radial-gradient(circle_at_60%_82%,rgba(129,140,248,0.3),transparent_50%),linear-gradient(135deg,#fff7ed_0%,#fdf2f8_40%,#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_15%_12%,rgba(251,191,36,0.12),transparent_45%),radial-gradient(circle_at_82%_18%,rgba(244,114,182,0.12),transparent_42%),radial-gradient(circle_at_60%_82%,rgba(129,140,248,0.13),transparent_50%),linear-gradient(135deg,#1f1b2e_0%,#1e2030_50%,#1a2238_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:52px_52px] opacity-25 dark:opacity-20" />
            </div>

            <div
                className="relative z-10 container-tight pt-5 space-y-6 md:pt-8 md:space-y-7"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 9.5rem)" }}
            >
                <StudentPortalHeader
                    isHeaderSnapped={isHeaderSnapped}
                    currentStudent={currentStudent}
                    tierLabel={tierLabel}
                    tierShortLabel={tierShortLabel}
                    gradeLabel={gradeLabel}
                    classLabel={classLabel}
                    refreshPortal={refreshPortal}
                    isLoadingList={isLoadingList}
                    isLoadingDetail={isLoadingDetail}
                />

                <StudentPortalTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isHeaderSnapped={isHeaderSnapped}
                />

                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 12, scale: 0.988 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.988 }}
                        transition={{ type: "spring", stiffness: 290, damping: 30, mass: 0.45 }}
                        className="space-y-6"
                    >
                        {activeTab === "progress" && (
                            <StudentProgressPanel
                                student={currentStudent}
                                isLoading={isLoadingDetail}
                            />
                        )}
                        {activeTab === "schedule" && <StudentSchedulePanel student={currentStudent} isLoading={isLoadingDetail} />}
                        {activeTab === "messages" && (
                            <StudentMessagesPanel
                                student={currentStudent}
                                isLoading={isLoadingDetail}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {!currentStudent && !isLoadingDetail && (
                    <div className="ios-glass rounded-[24px] border border-white/65 bg-white/80 p-6 text-center text-sm text-slate-600 shadow-sm dark:border-white/15 dark:bg-white/5 dark:text-slate-300">
                        Student data is unavailable right now. Try refreshing.
                    </div>
                )}

                <div className="h-1" />
            </div>

            <StudentBottomBar badges={navBadges} />
        </div>
    );
});

StudentPortalPage.displayName = "StudentPortalPage";
export default StudentPortalPage;
