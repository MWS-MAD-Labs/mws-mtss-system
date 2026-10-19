const mongoose = require('mongoose');
const { PERSON_TYPE, CENTRAL_STATUS } = require('../constants/person');

// One document per person, the way Central keeps them: a Person that is either an employee or a student.
// Central decides who is which and what they may do; everything here is a copy of that, kept up to date by
// jobs/centralSync.js. The employee fields are filled for employees, the student fields for students.
const personSchema = new mongoose.Schema({
    centralPersonId: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, trim: true },
    nickname: { type: String, trim: true },
    gender: { type: String, enum: ['MALE', 'FEMALE'], trim: true },
    personType: { type: String, enum: Object.values(PERSON_TYPE), required: true, index: true },
    isActive: { type: Boolean, default: true },
    centralStatus: { type: String, enum: Object.values(CENTRAL_STATUS), default: CENTRAL_STATUS.ACTIVE },
    lastLogin: { type: Date },

    // What Central allows in this app.
    // A group's entitlement ("group:<id>") is shared by everybody in the group, so this cannot be unique.
    centralEntitlementId: { type: String, trim: true, index: true },
    centralEntitlementApplicationId: { type: String, trim: true },
    centralEntitlementOrganizationId: { type: String, trim: true, index: true },
    centralEntitlementRole: { type: String, trim: true },
    centralEntitlementPermissions: [{ type: String, trim: true }],
    centralEntitlementVersion: { type: Number, min: 0 },
    centralEntitlementUpdatedAt: { type: Date },

    // Employee (copied from Central).
    employeeId: { type: String, trim: true },
    department: { type: String, trim: true },
    unit: { type: String, trim: true },
    jobLevel: { type: String, trim: true },
    jobPosition: { type: String, trim: true },
    isTeachingRole: { type: Boolean, default: false },
    employmentStatus: { type: String },
    joinDate: { type: Date },
    endDate: { type: Date },
    reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
    subordinates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
    // Where and what they teach, from Central's class assignments.
    classes: [{
        grade: String,
        className: { type: String, trim: true },
        subject: String,
        role: { type: String },
    }],
    // The students of a special education teacher, from Central's support assignments.
    supportedStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MTSSStudent' }],

    // Student (copied from Central).
    status: {
        type: String,
        enum: ['REGISTERED', 'ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN', 'ARCHIVED'],
        trim: true,
    },
    currentGrade: { type: String, trim: true },
    className: { type: String, trim: true },
    joinAcademicYear: { type: String, trim: true },
}, {
    timestamps: true,
    collection: 'people',
});

personSchema.index({ personType: 1, isActive: 1 });
personSchema.index({ unit: 1 });

module.exports = mongoose.model('Person', personSchema);
