// The student list of the teacher dashboard is split into one row per student and subject (a "support unit"), and the
// id of such a row is `<student>:<assignment>:<focus>`. Only the first part is the student. These helpers keep the
// form on the real student id, so a student with several MTSS subjects is one choice and one id goes to the server.
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export const normalizeStudentId = (value) => {
    const text = String(value ?? "").trim();
    const [first] = text.split(":");
    return OBJECT_ID.test(first) ? first : text;
};

export const getBaseStudentId = (student = {}) =>
    normalizeStudentId(student.baseStudentId || student._id || student.id || "");

// One choice per student, in the order they first appear.
export const getStudentOptions = (students = []) => {
    const seen = new Set();
    return (Array.isArray(students) ? students : []).flatMap((student) => {
        const value = getBaseStudentId(student);
        if (!value || seen.has(value)) return [];
        seen.add(value);
        return [{ value, label: student.name }];
    });
};

// The student for an id of any form: the real id, or the id of one of their support units.
export const findStudentById = (students = [], id) => {
    const wanted = normalizeStudentId(id);
    if (!wanted) return undefined;
    return (Array.isArray(students) ? students : []).find((student) => getBaseStudentId(student) === wanted);
};
