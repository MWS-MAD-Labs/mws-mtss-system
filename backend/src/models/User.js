const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function () {
            // googleId dates from the old direct-Google OAuth flow (removed
            // - Hub owns that now). Central-provisioned employees (current
            // Hub SSO relay flow) never set googleId, so ssoProvisioned
            // marks it explicitly - deliberately not keyed off employeeId,
            // which means "has a Central employee number" and nothing about
            // how the account authenticates; overloading it would silently
            // make password optional for any manually-created account an
            // admin later links to a real employeeId.
            return !this.googleId && !this.ssoProvisioned;
        },
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['student', 'staff', 'teacher', 'admin', 'superadmin', 'directorate', 'support_staff', 'head_unit', 'se_teacher', 'counselor'],
        default: 'staff'
    },
    // No enum - mws-data-center's MasterUnit table is admin-editable master
    // data, not a fixed vocabulary; synced as-is. A hardcoded list here
    // already caused a real incident (BRIDGE/RISE/SHIELD/SAFE/COMPASS were
    // once missing and silently blocked login for every employee in those
    // units - see central-field-consistency.test.js).
    department: {
        type: String,
        trim: true
    },
    employeeId: {
        type: String,
        trim: true
    },
    ssoProvisioned: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Incremented to force every previously-issued JWT for this user
    // invalid at once (see middleware/auth.js's authenticate) - the
    // back-channel session revocation Hub calls on logout bumps this
    // instead of trying to invalidate one specific token.
    sessionVersion: {
        type: Number,
        default: 0
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    googleProfile: {
        type: Object
    },
    username: {
        type: String,
        trim: true
    },
    // No enum - mws-data-center's job_level master data is free-text and
    // admin-editable, not a fixed vocabulary (real example seen in
    // production: "Junior Full-Stack Web Developer"). role/access-control
    // derives separately (see jobLevelRoleMapping.js) - this field is
    // display-only.
    jobLevel: {
        type: String,
        trim: true
    },
    // No enum - same reasoning as department above.
    unit: {
        type: String,
        trim: true
    },
    jobPosition: {
        type: String,
        trim: true
    },
    // Central's own is_teaching_role flag (job_level master data) - the
    // authoritative "is this a teaching job level" signal Central itself
    // gates class/mentor/support-assignment eligibility on. Synced
    // read-only from Central on every SSO login; see jobLevelRoleMapping.js
    // for how it decides the teacher-vs-staff split.
    isTeachingRole: {
        type: Boolean,
        default: false
    },
    // Central's exact EmploymentType enum - stored as-is, no local mapping.
    employmentStatus: {
        type: String,
        enum: ['PERMANENT', 'CONTRACT', 'PART_TIME', 'PROBATION', 'FREELANCE', 'WFH']
    },
    joinDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    workingPeriod: {
        years: { type: Number, default: 0 },
        months: { type: Number, default: 0 },
        days: { type: Number, default: 0 }
    },
    reportsTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    subordinates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    classes: [{
        grade: String,
        className: { type: String, trim: true },
        subject: String,
        role: { type: String, enum: ['Homeroom Teacher', 'Subject Teacher', 'Special Education Teacher', 'Principal'] }
    }],
    // SE teacher's students, kept in sync with Central's
    // StudentSupportAssignment by studentSupportAssignmentSync.js every 15
    // minutes (same authoritative-overwrite posture as classes above) - an
    // SE teacher relates to students directly, not through a class roster,
    // so this is what mtssStudentController.js's applyViewerScope scopes
    // their "My Students" view by instead of classes/grade.
    supportedStudentIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MTSSStudent'
    }],
    lastLogin: {
        type: Date
    },
    // Central's exact Gender enum - no local "other" sentinel.
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE'],
        trim: true
    },
    mtssAccess: {
        enabled: {
            type: Boolean,
            default: undefined
        },
        accessLevel: {
            type: String,
            enum: ['observer', 'teacher', 'leader', 'admin'],
            default: null
        },
        note: {
            type: String,
            trim: true
        },
        grantedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        grantedAt: {
            type: Date
        }
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

module.exports = mongoose.model('User', userSchema);
