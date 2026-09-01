import { memo, useMemo } from "react";
import { TierPill, ProgressBadge } from "./StatusPills";
import DashboardOverview from "./DashboardOverview";
import StudentsPanel from "./StudentsPanel";
import InterventionFormPanel from "./InterventionFormPanel";
import EditInterventionPanel from "./EditInterventionPanel";
import ProgressFormPanel from "./ProgressFormPanel";

// Plain imports, not React.lazy(): activeTab below fully unmounts whichever
// panel isn't showing, so switching back to a previously-visited tab
// re-mounts its component from scratch every time. A lazy component
// re-suspends on every fresh mount regardless of whether its chunk is
// already cached - promise resolution is always a microtask tick away, so
// Suspense's fallback flashes for a frame on every single tab switch, not
// just the first. Prefetching (this file used to do that) only removes the
// network cost, not that per-mount flash. Since every panel is small
// enough to prefetch instantly anyway, there's no real code-splitting
// benefit left to trade for that recurring flicker - plain imports never
// suspend at all.
const TeacherDashboardPanels = memo(
    ({
        activeTab,
        pilotGuide,
        statCards,
        students,
        progressData,
        interventionForm,
        progressForm,
        handleInterventionChange,
        handleProgressChange,
        handleSavePlan,
        handleProgressSubmitForm,
        baseFieldClass,
        textareaClass,
        notesTextareaClass,
        submittingPlan,
        submittingProgress,
        onViewStudent,
        onQuickUpdate,
        onEditPlan,
        canEditPlanForStudent,
        editingPlan,
        onCancelEditPlan,
        refresh,
        user,
    }) => {
        const panelContent = useMemo(() => {
            switch (activeTab) {
                case "dashboard":
                    return (
                        <DashboardOverview
                            statCards={statCards}
                            students={students}
                            progressData={progressData}
                            TierPill={TierPill}
                            ProgressBadge={ProgressBadge}
                            onView={onViewStudent}
                            onUpdate={onQuickUpdate}
                            onEditPlan={onEditPlan}
                            canEditPlanForStudent={canEditPlanForStudent}
                        />
                    );
                case "students":
                    return (
                        <StudentsPanel
                            students={students}
                            pilotGuide={pilotGuide}
                            TierPill={TierPill}
                            ProgressBadge={ProgressBadge}
                            onEditPlan={onEditPlan}
                            canEditPlanForStudent={canEditPlanForStudent}
                            onRefresh={refresh}
                        />
                    );
                case "create":
                    return (
                        <InterventionFormPanel
                            formState={interventionForm}
                            pilotGuide={pilotGuide}
                            onChange={handleInterventionChange}
                            onSubmit={(event) => handleSavePlan(event, interventionForm)}
                            baseFieldClass={baseFieldClass}
                            textareaClass={textareaClass}
                            students={students}
                            submitting={submittingPlan}
                            user={user}
                        />
                    );
                case "edit":
                    return (
                        <EditInterventionPanel
                            formState={interventionForm}
                            onChange={handleInterventionChange}
                            onSubmit={(event) => handleSavePlan(event, interventionForm)}
                            baseFieldClass={baseFieldClass}
                            textareaClass={textareaClass}
                            students={students}
                            submitting={submittingPlan}
                            editingPlan={editingPlan}
                            onCancelEdit={onCancelEditPlan}
                        />
                    );
                case "submit":
                    return (
                        <ProgressFormPanel
                            formState={progressForm}
                            onChange={handleProgressChange}
                            onSubmit={handleProgressSubmitForm}
                            baseFieldClass={baseFieldClass}
                            textareaClass={notesTextareaClass}
                            students={students}
                            submitting={submittingProgress}
                        />
                    );
                default:
                    return null;
            }
        }, [
            activeTab,
            baseFieldClass,
            handleInterventionChange,
            handleProgressChange,
            handleProgressSubmitForm,
            handleSavePlan,
            canEditPlanForStudent,
            interventionForm,
            pilotGuide,
            notesTextareaClass,
            onCancelEditPlan,
            onEditPlan,
            onQuickUpdate,
            onViewStudent,
            progressData,
            progressForm,
            refresh,
            editingPlan,
            statCards,
            students,
            submittingPlan,
            submittingProgress,
            textareaClass,
        ]);

        return panelContent;
    },
);

TeacherDashboardPanels.displayName = "TeacherDashboardPanels";
export default TeacherDashboardPanels;
