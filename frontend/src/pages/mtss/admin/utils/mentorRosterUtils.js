import { KEYWORDS } from "../config/mentorPanelConfig";
import { normalizeClassLabel, normalizeGradeLabel } from "../../utils/teacherGradeUtils";

export const makeMentorKey = (mentor = {}) =>
    (mentor._id || mentor.id || mentor.email || mentor.name || "").toString().toLowerCase();

const normalizeText = (value = "") =>
    value
        .toString()
        .trim()
        .toLowerCase();

const isTeacherProfile = (mentor) => {
    const jobPosition = (mentor.jobPosition || "").toLowerCase();
    const role = (mentor.role || "").toLowerCase();
    const classRole = Array.isArray(mentor.classes)
        ? mentor.classes.some((cls) => (cls.role || "").toLowerCase().includes("teacher"))
        : false;
    return KEYWORDS.some((keyword) => jobPosition.includes(keyword)) || classRole || role.includes("teacher");
};

const isAutomaticOwnershipRole = (role = "") => {
    const normalized = normalizeText(role);
    return normalized.includes("homeroom") || normalized.includes("class teacher") || normalized.includes("special education");
};

const getStudentKey = (student = {}) => (student.id || student._id || "").toString();

const getStudentGrade = (student = {}) =>
    normalizeGradeLabel(student.grade || student.currentGrade || student.className || student.unit || student.classes?.[0]?.grade);

const getStudentClass = (student = {}) =>
    normalizeClassLabel(student.className || student.currentGrade || student.unit || student.classes?.[0]?.className || "");

const classOwnershipMatchesStudent = (classAssignment = {}, student = {}) => {
    const assignmentGrade = normalizeGradeLabel(classAssignment?.grade || classAssignment?.className || "");
    const assignmentClass = normalizeClassLabel(classAssignment?.className || "");
    const studentGrade = getStudentGrade(student);
    const studentClass = getStudentClass(student);

    const matchesGrade = !assignmentGrade || !studentGrade || assignmentGrade === studentGrade;
    const matchesClass = !assignmentClass || !studentClass || assignmentClass === studentClass;
    return matchesGrade && matchesClass;
};

const countAutomaticOwnedStudents = (mentor = {}, students = []) => {
    const automaticScopes = Array.isArray(mentor.classes)
        ? mentor.classes.filter((classAssignment) => isAutomaticOwnershipRole(classAssignment?.role || mentor.jobPosition || mentor.role))
        : [];

    if (!automaticScopes.length) return 0;

    const ownedStudents = new Set();
    students.forEach((student) => {
        if (automaticScopes.some((classAssignment) => classOwnershipMatchesStudent(classAssignment, student))) {
            const key = getStudentKey(student);
            if (key) ownedStudents.add(key);
        }
    });
    return ownedStudents.size;
};

export const buildMentorRoster = (mentorRoster = [], mentorDirectory = [], students = []) => {
    const teacherMentors = mentorDirectory.filter(isTeacherProfile);

    const statsMap = new Map(
        mentorRoster.map((mentor) => [
            makeMentorKey(mentor),
            {
                interventionStudents: mentor.activeStudents || mentor.students || 0,
                successRate: mentor.successRate || "0%",
            },
        ]),
    );

    const rosterMap = new Map();

    teacherMentors.forEach((mentor) => {
        const key = makeMentorKey(mentor);
        const stats = statsMap.get(key) || { interventionStudents: 0, successRate: "0%" };
        const classOwnedStudents = countAutomaticOwnedStudents(mentor, students);
        rosterMap.set(key, {
            _id: mentor._id || mentor.id || null,
            name: mentor.name,
            role: mentor.jobPosition || mentor.role || "Teacher",
            unit: mentor.unit || "",
            classes: Array.isArray(mentor.classes) ? mentor.classes : [],
            activeStudents: classOwnedStudents,
            classOwnedStudents,
            interventionStudents: stats.interventionStudents,
            manualAssignedStudents: stats.interventionStudents,
            successRate: stats.successRate,
        });
    });

    mentorRoster.forEach((mentor) => {
        const key = makeMentorKey(mentor);
        const existing = rosterMap.get(key);
        rosterMap.set(key, {
            _id: mentor._id || mentor.id || rosterMap.get(key)?._id || null,
            name: mentor.name,
            role: mentor.role || existing?.role || "Teacher",
            unit: mentor.unit || existing?.unit || "",
            classes: Array.isArray(mentor.classes) ? mentor.classes : existing?.classes || [],
            activeStudents: existing?.activeStudents || 0,
            classOwnedStudents: existing?.classOwnedStudents || 0,
            interventionStudents: mentor.activeStudents || mentor.students || existing?.interventionStudents || 0,
            manualAssignedStudents: mentor.activeStudents || mentor.students || existing?.manualAssignedStudents || 0,
            successRate: mentor.successRate || existing?.successRate || "0%",
        });
    });

    return Array.from(rosterMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};
