import { memo } from "react";
import StudentsTableDesktopRow from "./StudentsTableDesktopRow";
import StudentsTableMobileCard from "./StudentsTableMobileCard";
import { resolveProgressAssignmentForStudent } from "../utils/editPlanAccess";

const MAX_RENDER = 50;

const HEADER_COLS = [
    { label: "Student", align: "text-left", width: "w-[18%]" },
    { label: "Class / Mentor", align: "text-left", width: "w-[14%]" },
    { label: "Interventions", align: "text-left", width: "w-[23%]" },
    { label: "Progress", align: "text-left", width: "w-[10%]" },
    { label: "Last Update", align: "text-left", width: "w-[15%]" },
    { label: "Next Update", align: "text-left", width: "w-[14%]" },
];

const StudentsTable = memo(
    ({
        students,
        ProgressBadge,
        dense = false,
        showActions = false,
        pilotHintAction = null,
        onView,
        onUpdate,
        onEditPlan,
        canEditPlanForStudent,
        selectable = false,
        selectedIds = [],
        onSelect,
    }) => {
        const activeSelectedIds = selectedIds || [];
        const limitedStudents = students.slice(0, Math.min(MAX_RENDER, students.length));
        const hintedStudent = limitedStudents.find((student) => {
            if (pilotHintAction === "view") return true;
            if (pilotHintAction === "progress") {
                return Boolean(resolveProgressAssignmentForStudent(student)?.assignmentId);
            }
            if (pilotHintAction === "edit") {
                return typeof canEditPlanForStudent === "function"
                    ? Boolean(canEditPlanForStudent(student))
                    : Boolean(student?.assignmentId || Number(student?.activeAssignmentCount || 0) > 0);
            }
            return false;
        });
        const hintedStudentKey = hintedStudent?.id || hintedStudent?._id || hintedStudent?.name || null;

        return (
            <div className="space-y-5">
                {/* Desktop table */}
                <div
                    className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.10)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.30)]"
                    data-aos="fade-up"
                    data-aos-delay="120"
                    data-aos-duration="500"
                >
                    {/* Liquid glass top highlight */}
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 dark:via-white/15 to-transparent pointer-events-none" />

                    <table className="w-full table-fixed text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800/80">
                                <th className="py-3.5 w-2" />
                                {selectable && (
                                    <th className="py-3.5 pl-2 font-semibold text-left w-12 text-[10px] text-slate-500 dark:text-slate-300 tracking-[0.2em] uppercase">
                                        Sel
                                    </th>
                                )}
                                {HEADER_COLS.map((col) => (
                                    <th
                                        key={col.label}
                                        className={`py-3.5 font-semibold ${col.align} ${col.width} tracking-[0.14em] uppercase text-[10px] text-slate-500 dark:text-slate-300 whitespace-nowrap ${dense ? "text-[9px]" : ""}`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                                {showActions && (
                                    <th className="py-3.5 w-[10%] font-semibold text-center tracking-[0.14em] uppercase text-[10px] text-slate-500 dark:text-slate-300 whitespace-nowrap">
                                        Action
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {limitedStudents.map((student, index) => {
                                const key = student.id || student._id || student.name;
                                const selected = activeSelectedIds.includes(student.id || student._id);
                                return (
                                    <StudentsTableDesktopRow
                                        key={key}
                                        index={index}
                                        student={student}
                                        ProgressBadge={ProgressBadge}
                                        showActions={showActions}
                                        pilotHintAction={pilotHintAction}
                                        showPilotHint={Boolean(pilotHintAction) && hintedStudentKey === key}
                                        onView={onView}
                                        onUpdate={onUpdate}
                                        onEditPlan={onEditPlan}
                                        canEditPlanForStudent={canEditPlanForStudent}
                                        selectable={selectable}
                                        selected={selected}
                                        onSelect={onSelect}
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                    {limitedStudents.map((student, index) => {
                        const key = student.id || student._id || student.name;
                        const selected = activeSelectedIds.includes(student.id || student._id);
                        return (
                            <StudentsTableMobileCard
                                key={key}
                                index={index}
                                student={student}
                                ProgressBadge={ProgressBadge}
                                showActions={showActions}
                                pilotHintAction={pilotHintAction}
                                showPilotHint={Boolean(pilotHintAction) && hintedStudentKey === key}
                                onView={onView}
                                onUpdate={onUpdate}
                                onEditPlan={onEditPlan}
                                canEditPlanForStudent={canEditPlanForStudent}
                                selectable={selectable}
                                selected={selected}
                                onSelect={onSelect}
                            />
                        );
                    })}
                </div>
            </div>
        );
    },
);

StudentsTable.displayName = "StudentsTable";
export default StudentsTable;
