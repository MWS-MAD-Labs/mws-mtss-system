const UserStudent = require('../models/UserStudent');
const MTSSStudent = require('../models/MTSSStudent');
const notificationService = require('./notificationService');
const studentNotifierService = require('./studentNotifierService');
const teacherNotifierService = require('./teacherNotifierService');

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolveStudentUserId = async (student = {}) => {
    const email = String(student.email || '').trim().toLowerCase();
    if (email) {
        const account = await UserStudent.findOne({ email, isActive: true }).select('_id').lean();
        if (account?._id) return String(account._id);
    }

    const name = String(student.name || '').trim();
    const className = String(student.className || '').trim();
    if (!name || !className) return null;
    const account = await UserStudent.findOne({
        name: new RegExp(`^${escapeRegExp(name)}$`, 'i'),
        className: new RegExp(`^${escapeRegExp(className)}$`, 'i'),
        isActive: true
    }).select('_id').lean();
    return account?._id ? String(account._id) : null;
};

const queueAssignmentMutationNotifications = ({
    students = [],
    studentIds = [],
    actor = {},
    mentorId,
    assignmentId,
    operation,
    title,
    message,
    notifyMentor = false,
    category = 'reminder',
    priority = 'medium'
} = {}) => {
    setImmediate(async () => {
        try {
            const targetStudents = students.length
                ? students
                : await MTSSStudent.find({ _id: { $in: studentIds } }).select('name email className').lean();
            const actorName = String(actor.name || actor.username || 'Your mentor').trim();
            await Promise.allSettled(targetStudents.map(async (student) => {
                const userId = await resolveStudentUserId(student);
                if (!userId) return;
                await notificationService.createNotification(userId, category, priority, title, message, {
                    source: 'mtss_rest',
                    scope: 'student',
                    operation,
                    assignmentId: String(assignmentId || ''),
                    studentId: String(student._id || ''),
                    actorId: String(actor._id || actor.id || ''),
                    actorName,
                    actionRoute: '/student/support-hub'
                });
            }));

            await studentNotifierService.sendMtssUpdateEmails({
                students: targetStudents,
                actor,
                operation,
                assignmentId: String(assignmentId || ''),
                titleBuilder: () => title,
                messageBuilder: () => message
            });

            if (notifyMentor && mentorId) {
                await notificationService.createNotification(mentorId, category, priority, title, message, {
                    source: 'mtss_rest',
                    scope: 'mentor',
                    operation,
                    assignmentId: String(assignmentId || ''),
                    actionRoute: '/mtss/teacher'
                });
                await teacherNotifierService.sendMtssUpdateEmail(mentorId, title, message, {
                    operation,
                    assignmentId: String(assignmentId || ''),
                    studentNames: targetStudents.map((student) => student.name).filter(Boolean),
                    actionRoute: '/mtss/teacher'
                });
            }
        } catch (error) {
            console.error('[MTSS Notification] Dispatch failed:', error.message);
        }
    });
};

module.exports = { queueAssignmentMutationNotifications };
