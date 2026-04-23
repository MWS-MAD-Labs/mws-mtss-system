import { formatDateLabel } from "./adminDashboardTrends";

export const buildMentorSpotlights = (assignments = []) => {
    const map = new Map();
    assignments.forEach((assignment) => {
        const mentorName = assignment.mentorId?.name || "Unassigned Mentor";
        if (!map.has(mentorName)) {
            map.set(mentorName, {
                name: mentorName,
                focusAreas: new Set(),
                caseload: 0,
                success: 0,
                total: 0,
            });
        }
        const entry = map.get(mentorName);
        entry.total += 1;
        entry.caseload += assignment.studentIds?.length || 0;
        if (assignment.focusAreas?.length) {
            assignment.focusAreas.forEach((area) => entry.focusAreas.add(area));
        }
        if (["completed", "active"].includes(assignment.status)) {
            entry.success += 1;
        }
    });

    return Array.from(map.values())
        .map((entry) => ({
            name: entry.name,
            caseload: entry.caseload,
            focus: entry.focusAreas.size ? Array.from(entry.focusAreas).slice(0, 2).join(", ") : "Tiered Supports",
            trend: entry.total ? `${Math.round((entry.success / entry.total) * 100)}% success` : "New mentor",
        }))
        .sort((a, b) => b.caseload - a.caseload)
        .slice(0, 3);
};

export const buildMentorRoster = (assignments = []) => {
    const map = new Map();
    assignments.forEach((assignment) => {
        const mentorId = assignment.mentorId?._id?.toString?.() || null;
        const mentorEmail = assignment.mentorId?.email || null;
        const mentorKey = mentorId || mentorEmail || assignment.mentorId?.name || "unassigned";
        if (!map.has(mentorKey)) {
            map.set(mentorKey, {
                id: mentorId,
                email: mentorEmail,
                name: assignment.mentorId?.name || "Unassigned",
                role: assignment.mentorId?.jobPosition || assignment.mentorId?.role || "Mentor",
                students: 0,
                total: 0,
                completed: 0,
            });
        }
        const entry = map.get(mentorKey);
        entry.students += assignment.studentIds?.length || 0;
        entry.total += 1;
        if (assignment.status === "completed") {
            entry.completed += 1;
        }
    });

    return Array.from(map.values())
        .map((entry) => ({
            _id: entry.id,
            email: entry.email,
            name: entry.name,
            role: entry.role,
            activeStudents: entry.students,
            successRate: entry.total ? `${Math.round((entry.completed / entry.total) * 100)}%` : "0%",
        }))
        .sort((a, b) => b.activeStudents - a.activeStudents);
};

export const buildRecentActivity = (assignments = []) => {
    const entries = [];
    assignments.forEach((assignment) => {
        const studentName = assignment.studentIds?.[0]?.name || "Student group";
        const mentorName = assignment.mentorId?.name || "Mentor team";
        const checkIn = assignment.checkIns?.slice(-1)[0];
        if (checkIn) {
            entries.push({
                date: checkIn.date,
                student: studentName,
                mentor: mentorName,
                activity: checkIn.summary || "Progress update recorded",
            });
        } else {
            entries.push({
                date: assignment.updatedAt || assignment.startDate || assignment.createdAt,
                student: studentName,
                mentor: mentorName,
                activity: `Status updated to ${assignment.status}`,
            });
        }
    });

    return entries
        .filter((entry) => entry.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6)
        .map((entry) => ({
            ...entry,
            date: formatDateLabel(entry.date),
        }));
};
