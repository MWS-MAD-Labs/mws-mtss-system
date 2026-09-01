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
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'other',
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'graduated', 'transferred', 'pending'],
        default: 'active',
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
    department: {
        type: String,
        enum: ['Directorate', 'Elementary', 'Junior High', 'Kindergarten', 'Operational', 'MAD Lab', 'Finance', 'Pelangi', 'CARE', 'BRIDGE', 'RISE', 'SHIELD', 'SAFE', 'COMPASS'],
        trim: true
    },
    unit: {
        type: String,
        enum: ['Directorate', 'Elementary', 'Junior High', 'Kindergarten', 'Operational', 'MAD Lab', 'Finance', 'Pelangi', 'CARE', 'BRIDGE', 'RISE', 'SHIELD', 'SAFE', 'COMPASS'],
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
