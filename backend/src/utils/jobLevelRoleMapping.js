// Once Hub's relayed tags say someone is teaching-adjacent staff at all
// (tag "teacher" or the baseline "staff" every active employee gets), this
// is the only place left that needs to know MTSS's own sub-classification -
// se_teacher vs support_staff vs plain teacher matters for caseload/roster
// logic elsewhere in this app, and Hub has no reason to know about it.
// Unrecognized job_level values fall through to 'teacher' rather than
// 'staff', so an unmapped title never loses MTSS access - it only loses the
// cosmetic sub-label.
const TEACHER_FAMILY_BY_JOB_LEVEL = {
    'Teacher': 'teacher',
    'SE Teacher': 'se_teacher',
    'Support Staff': 'support_staff',
    'Staff': 'staff',
};

// Central has no fixed role vocabulary of its own - job_position/job_level
// are free-text, admin-editable master data. Hub already turns that text
// into a broad access-tag verdict for its own app catalog (see
// AppsService.accessTagsFor in mws-hub); relaying those signed tags here
// means MTSS agrees with Hub about the same person from the same Central
// data, instead of maintaining a second, narrower dictionary that can
// silently miss a job title Hub already recognizes (this is what used to
// happen: a job_level outside this file's old 6-entry table silently
// dropped everyone to 'staff', even a Principal or Head Unit).
//
// tags take the outer bucket (does this person get admin/leader access at
// all); jobLevel only fine-tunes which flavor of teaching staff they are
// once that bucket is 'teacher'.
function deriveMtssRoleFromCentralTags(tags, jobLevel) {
    const tagSet = new Set(Array.isArray(tags) ? tags : []);
    const level = typeof jobLevel === 'string' ? jobLevel.trim() : '';

    if (tagSet.has('director')) return 'directorate';
    // MTSS has no role bucket of its own for "principal" that carries
    // different permissions than head_unit - accessControl.js grants both
    // the same 'leader' access level, so mapping principal's tag onto the
    // role MTSS already recognizes avoids introducing a role value the rest
    // of this app (and its own frontend/backend leader-role lists) doesn't
    // agree is a leader.
    if (tagSet.has('head-unit') || tagSet.has('principal')) return 'head_unit';
    if (tagSet.has('admin')) return 'admin';
    if (tagSet.has('teacher') || tagSet.has('staff') || tagSet.has('employee')) {
        return TEACHER_FAMILY_BY_JOB_LEVEL[level] || 'teacher';
    }

    return null;
}

module.exports = { TEACHER_FAMILY_BY_JOB_LEVEL, deriveMtssRoleFromCentralTags };
