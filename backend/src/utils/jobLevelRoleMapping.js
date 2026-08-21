const JOB_LEVEL_TO_ROLE = {
    'Teacher': 'teacher',
    'SE Teacher': 'se_teacher',
    'Support Staff': 'support_staff',
    'Head Unit': 'head_unit',
    'Director': 'directorate',
    'Staff': 'staff',
};

function mapJobLevelToRole(jobLevel) {
    const key = typeof jobLevel === 'string' ? jobLevel.trim() : '';
    return JOB_LEVEL_TO_ROLE[key] || null;
}

module.exports = { JOB_LEVEL_TO_ROLE, mapJobLevelToRole };
