import { memo, useEffect, useMemo, useRef, useState } from "react";
import PilotTaskHintBanner from "../components/PilotTaskHintBanner";
import AdminAssignmentModal from "./AdminAssignmentModal";
import AdminStudentsFilters from "./components/AdminStudentsFilters";
import AdminStudentsRoster from "./components/AdminStudentsRoster";

const BATCH_SIZE = 10;
const getStudentRowId = (student = {}) =>
    student.id || student._id || student.supportUnit?.assignmentId || student.baseStudentId || student.slug || student.name;

const getBaseStudentId = (student = {}) =>
    student.baseStudentId || student._id || student.id;

const groupStudentsForRoster = (students = []) => {
    const grouped = new Map();

    students.forEach((student) => {
        const baseId = getBaseStudentId(student) || getStudentRowId(student);
        if (!baseId) return;
        if (!grouped.has(baseId)) {
            grouped.set(baseId, {
                ...student,
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
    }));
};

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
    onClearFilters,
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
        const selectedByBaseId = new Map();
        allStudents.forEach((student) => {
            if (!selectedIds.includes(getStudentRowId(student))) return;
            const baseId = getBaseStudentId(student);
            if (baseId && !selectedByBaseId.has(baseId)) {
                selectedByBaseId.set(baseId, student);
            }
        });
        return Array.from(selectedByBaseId.values());
    }, [selectedIds, allStudents]);

    const groupedStudents = useMemo(
        () => groupStudentsForRoster(filteredStudents),
        [filteredStudents],
    );

    useEffect(() => {
        if (!loadMoreRef.current) return;
        const sentinel = loadMoreRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    onVisibleCountChange?.((prev) => {
                        if (prev >= groupedStudents.length) return prev;
                        return Math.min(groupedStudents.length, prev + BATCH_SIZE);
                    });
                }
            },
            { threshold: 0.4 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [groupedStudents.length, onVisibleCountChange]);

    const visibleStudents = useMemo(
        () => groupedStudents.slice(0, Math.min(visibleCount, groupedStudents.length)),
        [groupedStudents, visibleCount],
    );
    const activeSubjectLabel = useMemo(() => {
        if (!filters?.type || filters.type === "all") return "";
        const match = (typeOptions || []).find((option) => (
            typeof option === "object" ? option.value === filters.type : option === filters.type
        ));
        return typeof match === "object" ? match.label : match || filters.type;
    }, [filters?.type, typeOptions]);
    const hasMoreStudents = visibleStudents.length < groupedStudents.length;
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
                activeSubjectLabel={activeSubjectLabel}
                filteredCount={filteredStudents.length}
                filteredRowCount={groupedStudents.length}
                selectedCount={selectedStudents.length}
                mentorCount={mentorDirectory.length}
                onResetSelection={onResetSelection}
                onClearFilters={onClearFilters}
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
