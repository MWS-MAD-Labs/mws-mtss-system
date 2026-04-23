import { formatMentorDisplay } from "../../utils/mentorNameUtils";

const CARD_ACCENTS = [
    "from-[#fda4af] via-[#f472b6] to-[#c084fc]",
    "from-[#fef3c7] via-[#fcd34d] to-[#fb923c]",
    "from-[#86efac] via-[#34d399] to-[#22d3ee]",
    "from-[#93c5fd] via-[#818cf8] to-[#a78bfa]",
];

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const buildGradeTierLabel = (student = {}) => {
    const grade = student.grade || student.currentGrade || "-";
    const tier = student.primaryIntervention?.tier || student.tier || "Tier 1";
    return `${grade} • ${tier}`;
};

const mapStudentCard = (student = {}, index = 0) => {
    const id = student.id || student._id || student.slug || `student-${index}`;
    const focus = student.primaryIntervention?.label || student.type || student.profile?.type || "Tiered Supports";
    const mentor = formatMentorDisplay({
        name: student.mentor || student.profile?.mentor,
        nickname: student.mentorNickname || student.profile?.mentorNickname,
        username: student.mentorUsername || student.profile?.mentorUsername,
        gender: student.mentorGender || student.profile?.mentorGender,
    });

    return {
        ...student,
        id: String(id),
        accent: student.accent || CARD_ACCENTS[index % CARD_ACCENTS.length],
        focus,
        mentor,
        gradeTierLabel: buildGradeTierLabel(student),
    };
};

const filterStudentsForViewer = (students = [], user = null) => {
    if (!user || user.role !== "student") {
        return students;
    }

    const userEmail = normalizeText(user.email);
    const userUsername = normalizeText(user.username);
    const userNickname = normalizeText(user.nickname);
    const userName = normalizeText(user.name);

    const strictMatch = students.find((student) => normalizeText(student.email) === userEmail);
    if (strictMatch) return [strictMatch];

    const fuzzyMatch = students.find((student) => {
        const username = normalizeText(student.username);
        const nickname = normalizeText(student.nickname);
        const name = normalizeText(student.name);

        return (
            (userUsername && (username === userUsername || nickname === userUsername)) ||
            (userNickname && (nickname === userNickname || username === userNickname)) ||
            (userName && (name === userName || nickname === userName))
        );
    });

    if (fuzzyMatch) return [fuzzyMatch];
    if (students.length === 1) return students;

    // Backend now enforces student scope. If client-side identity matching fails,
    // keep server-scoped records instead of dropping valid data.
    return students;
};

export { mapStudentCard, filterStudentsForViewer, buildGradeTierLabel };
