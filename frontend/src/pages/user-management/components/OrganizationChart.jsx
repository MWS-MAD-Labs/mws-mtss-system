import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Building, Users, User, Crown, GraduationCap, Briefcase } from "lucide-react";

const OrganizationChart = memo(({ organizationStructure, users }) => {
    const orgData = useMemo(() => {
        if (!organizationStructure?.stats) return null;

        // Group users by department and role
        const departmentGroups = {};
        const directorateMembers = users?.filter(u => u.role === 'directorate') || [];

        // Initialize departments
        const departments = [
            'Directorate',
            'Elementary',
            'Junior High',
            'Kindergarten',
            'Operational',
            'MAD Lab',
            'Finance',
            'Pelangi',
            'CARE'
        ];

        departments.forEach(dept => {
            // Get head unit for this department
            const headUnit = users?.filter(u => u.role === 'head_unit' && u.department === dept) || [];

            departmentGroups[dept] = {
                name: dept,
                directorate: directorateMembers.filter(u => u.department === dept),
                headUnit: headUnit,
                headUnitName: headUnit.length > 0 ? headUnit[0].name : null,
                teachers: users?.filter(u => (u.role === 'teacher' || u.role === 'se_teacher') && u.department === dept) || [],
                staff: users?.filter(u => u.role === 'staff' && u.department === dept) || [],
                supportStaff: users?.filter(u => u.role === 'support_staff' && u.department === dept) || [],
                students: users?.filter(u => u.role === 'student' && u.department === dept) || []
            };
        });

        return {
            departments: departmentGroups,
            directorateMembers,
            totalUsers: users?.length || 0
        };
    }, [organizationStructure, users]);

    const DepartmentCard = memo(({ department, data }) => {
        const totalMembers = data.directorate.length + data.headUnit.length +
            data.teachers.length + data.staff.length + data.supportStaff.length;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass glass-card p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <Building className="w-5 h-5 mr-2 text-primary" />
                        <h3 className="text-lg font-semibold">{department}</h3>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {totalMembers} members
                    </span>
                </div>

                <div className="space-y-3">
                    {/* Directorate */}
                    {data.directorate.length > 0 && (
                        <div className="flex items-center justify-between p-2 bg-gold/10 rounded">
                            <div className="flex items-center">
                                <Crown className="w-4 h-4 mr-2 text-gold" />
                                <span className="text-sm font-medium">Directorate</span>
                            </div>
                            <span className="text-sm">{data.directorate.length}</span>
                        </div>
                    )}

                    {/* Head Unit */}
                    {data.headUnit.length > 0 && (
                        <div className="p-3 bg-purple/10 rounded">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                    <User className="w-4 h-4 mr-2 text-purple" />
                                    <span className="text-sm font-medium">Head Unit</span>
                                </div>
                                <span className="text-sm">{data.headUnit.length}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Head:</span> {data.headUnitName}
                            </div>
                        </div>
                    )}

                    {/* Teachers */}
                    {data.teachers.length > 0 && (
                        <div className="flex items-center justify-between p-2 bg-blue/10 rounded">
                            <div className="flex items-center">
                                <GraduationCap className="w-4 h-4 mr-2 text-blue" />
                                <span className="text-sm font-medium">Teachers</span>
                            </div>
                            <span className="text-sm">{data.teachers.length}</span>
                        </div>
                    )}

                    {/* Staff */}
                    {data.staff.length > 0 && (
                        <div className="flex items-center justify-between p-2 bg-green/10 rounded">
                            <div className="flex items-center">
                                <Briefcase className="w-4 h-4 mr-2 text-green" />
                                <span className="text-sm font-medium">Staff</span>
                            </div>
                            <span className="text-sm">{data.staff.length}</span>
                        </div>
                    )}

                    {/* Support Staff */}
                    {data.supportStaff.length > 0 && (
                        <div className="flex items-center justify-between p-2 bg-orange/10 rounded">
                            <div className="flex items-center">
                                <Users className="w-4 h-4 mr-2 text-orange" />
                                <span className="text-sm font-medium">Support Staff</span>
                            </div>
                            <span className="text-sm">{data.supportStaff.length}</span>
                        </div>
                    )}

                    {/* Students */}
                    {data.students.length > 0 && (
                        <div className="flex items-center justify-between p-2 bg-gray/10 rounded">
                            <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-gray" />
                                <span className="text-sm font-medium">Students</span>
                            </div>
                            <span className="text-sm">{data.students.length}</span>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    });

    DepartmentCard.displayName = 'DepartmentCard';

    if (!orgData) {
        return (
            <div className="glass glass-card p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted/30 rounded w-1/3"></div>
                    <div className="h-3 bg-muted/20 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Directorate Overview */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass glass-card p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <Crown className="w-6 h-6 mr-3 text-gold" />
                        <h2 className="text-xl font-bold">Directorate Overview</h2>
                    </div>
                    <span className="text-lg font-semibold text-gold">
                        {orgData.directorateMembers.length} Members
                    </span>
                </div>

                {orgData.directorateMembers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {orgData.directorateMembers.map((member, index) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 bg-gradient-to-r from-gold/10 to-gold/5 rounded-lg border border-gold/20"
                            >
                                <div className="flex items-center mb-2">
                                    <Crown className="w-4 h-4 mr-2 text-gold" />
                                    <span className="font-semibold text-foreground">{member.name}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{member.jobPosition}</p>
                                <p className="text-xs text-muted-foreground mt-1">{member.department}</p>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No directorate members found</p>
                )}
            </motion.div>

            {/* Department Structure */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Building className="w-6 h-6 mr-3 text-primary" />
                    Department Structure
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(orgData.departments).map(([dept, data], index) => (
                        <motion.div
                            key={dept}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                        >
                            <DepartmentCard department={dept} data={data} />
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Summary Statistics */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="glass glass-card p-6"
            >
                <h3 className="text-lg font-semibold mb-4">Organization Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gold">{orgData.directorateMembers.length}</div>
                        <div className="text-sm text-muted-foreground">Directorate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue">
                            {Object.values(orgData.departments).reduce((sum, dept) => sum + dept.teachers.length, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Teachers</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green">
                            {Object.values(orgData.departments).reduce((sum, dept) => sum + dept.staff.length, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Staff</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{orgData.totalUsers}</div>
                        <div className="text-sm text-muted-foreground">Total Users</div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
});

OrganizationChart.displayName = 'OrganizationChart';

export default OrganizationChart;
