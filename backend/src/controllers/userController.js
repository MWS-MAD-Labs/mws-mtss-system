const Person = require('../models/Person');
const { sendSuccess, sendError } = require('../utils/response');

// The people of MTSS are the people Central lists for it (jobs/centralSync.js). They are read here and never
// made, changed or removed here: who is a person and what they may do is decided in Central.

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Get all people with pagination and filtering
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build filter query
        const filter = {};
        // `role` is the name of the role Central gave them in MTSS.
        if (req.query.role) filter.centralEntitlementRole = String(req.query.role);
        if (req.query.personType) filter.personType = String(req.query.personType);
        if (req.query.department) filter.department = String(req.query.department);
        if (req.query.unit) filter.unit = String(req.query.unit);
        if (req.query.jobLevel) filter.jobLevel = String(req.query.jobLevel);
        if (req.query.employmentStatus) filter.employmentStatus = String(req.query.employmentStatus);
        if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

        // Search functionality
        if (req.query.search) {
            const pattern = escapeRegex(req.query.search);
            filter.$or = [
                { name: { $regex: pattern, $options: 'i' } },
                { email: { $regex: pattern, $options: 'i' } },
                { username: { $regex: pattern, $options: 'i' } },
                { jobPosition: { $regex: pattern, $options: 'i' } }
            ];
        }

        const total = await Person.countDocuments(filter);
        const users = await Person.find(filter)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(total / limit);

        sendSuccess(res, 'Users retrieved successfully', {
            users,
            pagination: {
                currentPage: page,
                totalPages,
                totalUsers: total,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        sendError(res, 'Failed to retrieve users', 500);
    }
};

// Get a person by ID with full details
const getUserById = async (req, res) => {
    try {
        const user = await Person.findById(req.params.id);

        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        sendSuccess(res, 'User details retrieved', { user });
    } catch (error) {
        console.error('Get user by ID error:', error);
        sendError(res, 'Failed to retrieve user details', 500);
    }
};

// Get organization structure and statistics
const getOrganizationStructure = async (req, res) => {
    try {
        const departments = await Person.distinct('department');
        const units = await Person.distinct('unit');
        const roles = await Person.distinct('centralEntitlementRole');
        const jobLevels = await Person.distinct('jobLevel');

        // Get department heads
        const departmentHeads = await Person.find({
            jobLevel: 'Head Unit',
            isActive: true
        }).select('name department unit jobPosition').sort('department');

        // Get statistics
        const stats = {
            totalUsers: await Person.countDocuments({ isActive: true }),
            byRole: await Person.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$centralEntitlementRole', count: { $sum: 1 } } }
            ]),
            byDepartment: await Person.aggregate([
                { $match: { isActive: true, department: { $ne: null } } },
                { $group: { _id: '$department', count: { $sum: 1 } } }
            ]),
            byEmploymentStatus: await Person.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$employmentStatus', count: { $sum: 1 } } }
            ])
        };

        sendSuccess(res, 'Organization structure retrieved', {
            departments,
            units,
            roles,
            jobLevels,
            departmentHeads,
            stats
        });
    } catch (error) {
        console.error('Get organization structure error:', error);
        sendError(res, 'Failed to retrieve organization structure', 500);
    }
};

module.exports = {
    getUsers,
    getUserById,
    getOrganizationStructure
};
