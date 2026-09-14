const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentUserSchema = new mongoose.Schema({
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
            // - Hub owns that now). Central-provisioned students (current
            // Hub SSO relay flow) never set googleId, and this model has no
            // natural Central identity field to key off the way User.js
            // uses employeeId, so ssoProvisioned marks it explicitly.
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
        enum: ['student'],
        default: 'student'
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
    nickname: {
        type: String,
        trim: true
    },
    // Central's exact Gender enum - no local "other" sentinel.
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE'],
        trim: true
    },
    // Central's exact StudentStatus enum - stored as-is, no local narrowing.
    status: {
        type: String,
        enum: ['REGISTERED', 'ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN', 'ARCHIVED'],
        trim: true
    },
    currentGrade: {
        type: String,
        trim: true
    },
    className: {
        type: String,
        trim: true
    },
    joinAcademicYear: {
        type: String,
        trim: true
    },
    // No enum - mws-data-center's MasterUnit table is admin-editable master
    // data, not a fixed vocabulary; synced as-is (see central-field-
    // consistency.test.js for the incident this used to cause).
    department: {
        type: String,
        trim: true
    },
    unit: {
        type: String,
        trim: true
    },
    lastLogin: {
        type: Date
    },
    ssoProvisioned: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

studentUserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

studentUserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

studentUserSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

module.exports = mongoose.model('UserStudent', studentUserSchema);
