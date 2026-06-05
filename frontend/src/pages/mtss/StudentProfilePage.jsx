import { memo, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import { ArrowLeft } from "lucide-react";
import { glassStyles } from "./config/studentProfileConfig";
import StudentProfileHeader from "./components/StudentProfileHeader";
import QuickFactsGrid from "./components/QuickFactsGrid";
import GrowthJourneySection from "./components/GrowthJourneySection";
import StudentInterventionsSection from "./components/StudentInterventionsSection";
import StudentNoInterventionFallback from "./components/StudentNoInterventionFallback";
import { StudentProfileLoading, StudentProfileError } from "./components/StudentProfileStates";
import useStudentProfileData from "./hooks/useStudentProfileData";
import { buildStudentProfileView } from "./utils/studentProfileUtils";

const StudentProfilePage = memo(() => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { student, loading, error, selectedIntervention, setSelectedIntervention } = useStudentProfileData(slug);

    useEffect(() => {
        AOS.init({
            duration: 600,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
            delay: 0,
        });
    }, []);

    useEffect(() => {
        if (student) {
            setTimeout(() => AOS.refresh(), 100);
        }
    }, [student]);

    const handleSelectIntervention = useCallback((intervention) => {
        setSelectedIntervention(intervention);
    }, [setSelectedIntervention]);

    const handleBack = useCallback(() => {
        const fromPath = location.state?.from?.pathname;
        const fromSearch = location.state?.from?.search || "";

        if (fromPath) {
            navigate(`${fromPath}${fromSearch}`);
            return;
        }

        if (window.history.length > 2) {
            navigate(-1);
            return;
        }

        navigate("/mtss/teacher?tab=students");
    }, [location.state, navigate]);

    const {
        profile,
        highlight,
        sortedInterventions,
        currentIntervention,
        strategyLabel,
        durationLabel,
        frequencyLabel,
        mentorLabel,
        pairingLabel,
        goalLabel,
        monitoringMethodLabel,
        startDateLabel,
        notesLabel,
    } = useMemo(
        () => buildStudentProfileView(student, selectedIntervention),
        [student, selectedIntervention],
    );

    if (loading) {
        return <StudentProfileLoading />;
    }

    if (error || !student) {
        return <StudentProfileError error={error} onBack={handleBack} />;
    }

    return (
        <div className="relative min-h-screen mtss-theme bg-gradient-to-br from-slate-50 via-white to-rose-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-rose-950/20">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 hidden sm:block mtss-animated-bg opacity-70" />
                <div className="absolute -top-32 -left-32 hidden sm:block w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-purple-600/10 dark:to-pink-600/10 rounded-full blur-3xl" />
                <div className="absolute top-1/4 -right-32 hidden sm:block w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 dark:from-blue-600/10 dark:to-cyan-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 left-1/4 hidden sm:block w-72 h-72 bg-gradient-to-br from-amber-400/15 to-orange-400/15 dark:from-amber-600/10 dark:to-orange-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 container max-w-7xl mx-auto px-2.5 sm:px-6 py-2 sm:py-8 space-y-2 sm:space-y-6">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={handleBack}
                    className={`${glassStyles.card} ${glassStyles.hover} inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-semibold shadow-lg`}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back to Students</span>
                    <span className="sm:hidden">Back</span>
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`${glassStyles.card} rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl`}
                >
                    <StudentProfileHeader
                        student={student}
                        highlight={highlight}
                        currentTier={currentIntervention?.tier}
                        currentInterventionLabel={currentIntervention?.label}
                    />

                    <div className="p-2 sm:p-6 lg:p-8 space-y-2.5 sm:space-y-6">
                        <QuickFactsGrid student={student} profile={profile} mentorLabel={mentorLabel} />

                        <StudentInterventionsSection
                            sortedInterventions={sortedInterventions}
                            selectedIntervention={selectedIntervention}
                            onSelect={handleSelectIntervention}
                            glassStyles={glassStyles}
                        />

                        <AnimatePresence mode="wait">
                            {currentIntervention && (
                                <GrowthJourneySection
                                    intervention={currentIntervention}
                                    strategyLabel={strategyLabel}
                                    durationLabel={durationLabel}
                                    frequencyLabel={frequencyLabel}
                                    mentorLabel={mentorLabel}
                                    pairingLabel={pairingLabel}
                                    goalLabel={goalLabel}
                                    monitoringMethodLabel={monitoringMethodLabel}
                                    startDateLabel={startDateLabel}
                                    notesLabel={notesLabel}
                                />
                            )}
                        </AnimatePresence>

                        {!currentIntervention && sortedInterventions.length === 0 && (
                            <StudentNoInterventionFallback glassStyles={glassStyles} />
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
});

StudentProfilePage.displayName = "StudentProfilePage";
export default StudentProfilePage;
