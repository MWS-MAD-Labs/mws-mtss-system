import { memo, useEffect, useMemo, useRef, useState } from "react";
import PilotTaskHintBanner from "../components/PilotTaskHintBanner";
import AdminAssignmentModal from "./AdminAssignmentModal";
import AdminStudentsFilters from "./components/AdminStudentsFilters";
import AdminStudentsRoster from "./components/AdminStudentsRoster";

const BATCH_SIZE = 10;

const AdminStudentsPanel = ({
    pilotGuide = null,
    filters,
    onFilterChange,
    gradeOptions,
    tierOptions,
    typeOptions,
    mentorOptions,
    filteredStudents,
    allStudents,
    visibleCount = BATCH_SIZE,
    onVisibleCountChange,
    onViewStudent,
    onUpdateStudent,
    selectedIds,
    onToggleSelect,
    onResetSelection,
    mentorDirectory,
    onRefresh,
    isReadOnly = false,
}) => {
    const [assignmentOpen, setAssignmentOpen] = useState(false);
    const loadMoreRef = useRef(null);

    const selectedStudents = useMemo(() => {
        if (!selectedIds?.length) return [];
        return allStudents.filter((student) => selectedIds.includes(student.id || student._id));
    }, [selectedIds, allStudents]);

    useEffect(() => {
        if (!loadMoreRef.current) return;
        const sentinel = loadMoreRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    onVisibleCountChange?.((prev) => {
                        if (prev >= filteredStudents.length) return prev;
                        return Math.min(filteredStudents.length, prev + BATCH_SIZE);
                    });
                }
            },
            { threshold: 0.4 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [filteredStudents.length, onVisibleCountChange]);

    const visibleStudents = useMemo(
        () => filteredStudents.slice(0, Math.min(visibleCount, filteredStudents.length)),
        [filteredStudents, visibleCount],
    );
    const hasMoreStudents = visibleStudents.length < filteredStudents.length;
    const disableAssignment = selectedStudents.length < 2 || mentorDirectory.length === 0;

    return (
        <div className="space-y-6">
            {pilotGuide && (
                <PilotTaskHintBanner guide={pilotGuide} actionLabel="Use these controls next" />
            )}

            <div className={`relative ${pilotGuide?.panelArea === "filters" ? "rounded-[32px] ring-2 ring-amber-400/80 ring-offset-2 ring-offset-white dark:ring-amber-300 dark:ring-offset-slate-950 animate-pulse" : ""}`}>
                {pilotGuide?.panelArea === "filters" && (
                    <span className="pointer-events-none absolute -top-3 left-4 z-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg animate-bounce">
                        Start here
                    </span>
                )}
                <AdminStudentsFilters
                    filters={filters}
                    onFilterChange={onFilterChange}
                    gradeOptions={gradeOptions}
                    tierOptions={tierOptions}
                    typeOptions={typeOptions}
                    mentorOptions={mentorOptions}
                    filteredCount={filteredStudents.length}
                    totalCount={allStudents.length}
                />
            </div>

            <AdminStudentsRoster
                pilotGuide={pilotGuide}
                visibleStudents={visibleStudents}
                filteredCount={filteredStudents.length}
                selectedCount={selectedStudents.length}
                mentorCount={mentorDirectory.length}
                onResetSelection={onResetSelection}
                onOpenAssign={() => setAssignmentOpen(true)}
                disableAssignment={disableAssignment}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
                onViewStudent={onViewStudent}
                onUpdateStudent={onUpdateStudent}
                loadMoreRef={loadMoreRef}
                hasMoreStudents={hasMoreStudents}
                isReadOnly={isReadOnly}
            />

            {assignmentOpen && !isReadOnly && (
                <AdminAssignmentModal
                    open={assignmentOpen}
                    onClose={() => setAssignmentOpen(false)}
                    students={selectedStudents}
                    mentors={mentorDirectory}
                    onAssigned={() => {
                        onResetSelection();
                        setAssignmentOpen(false);
                        onRefresh?.();
                    }}
                />
            )}
        </div>
    );
};

AdminStudentsPanel.displayName = "AdminStudentsPanel";
export default memo(AdminStudentsPanel);
