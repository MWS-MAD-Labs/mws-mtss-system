import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, Building, Briefcase } from "lucide-react";

const StatCard = memo(({ icon: Icon, title, value, subtitle, color = "primary", delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="glass glass-card p-4 md:p-6"
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg bg-${color}/10`}>
                <Icon className={`w-6 h-6 text-${color}`} />
            </div>
            <span className="text-2xl font-bold text-foreground">{value}</span>
        </div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
    </motion.div>
));

StatCard.displayName = 'StatCard';

const UserStatsOverview = memo(({ organizationStructure, totalUsers, lastUpdated }) => {
    const stats = useMemo(() => {
        // Always try to get real stats from organizationStructure
        const { stats: orgStats } = organizationStructure || {};

        return {
            totalUsers: totalUsers || orgStats?.totalUsers || 0,
            // The roles Central gave people in MTSS, most people first.
            roles: [...(orgStats?.byRole || [])].sort((a, b) => b.count - a.count),
            permanent: orgStats?.byEmploymentStatus?.find(s => s._id === 'Permanent')?.count || 0,
            contract: orgStats?.byEmploymentStatus?.find(s => s._id === 'Contract')?.count || 0,
            probation: orgStats?.byEmploymentStatus?.find(s => s._id === 'Probation')?.count || 0
        };
    }, [organizationStructure, totalUsers]);

    // Always show stats, even if organization structure is not loaded yet
    if (!stats) {
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
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    icon={Users}
                    title="Total Users"
                    value={stats.totalUsers}
                    subtitle="Active people from Central"
                    color="primary"
                    delay={0}
                />
                <StatCard
                    icon={Briefcase}
                    title="Contract Staff"
                    value={stats.contract}
                    subtitle="Contract employees"
                    color="secondary"
                    delay={0.1}
                />
                <StatCard
                    icon={UserCheck}
                    title="Permanent Staff"
                    value={stats.permanent}
                    subtitle="Full-time employees"
                    color="default"
                    delay={0.2}
                />
            </div>

            {/* Roles in Central */}
            <div className="glass glass-card p-4 md:p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Roles in Central
                </h3>
                {stats.roles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        {stats.roles.map((role) => (
                            <div key={role._id || 'none'} className="flex justify-between">
                                <span className="text-muted-foreground">{role._id || 'No role'}</span>
                                <span className="font-medium">{role.count}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No roles yet.</p>
                )}
            </div>

            {/* Employment Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="glass glass-card p-4 md:p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                    >
                        <h3 className="font-semibold text-foreground mb-3 flex items-center">
                            <Briefcase className="w-4 h-4 mr-2" />
                            Employment Status
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Permanent</span>
                                <span className="font-medium">{stats.permanent}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Contract</span>
                                <span className="font-medium">{stats.contract}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Probation</span>
                                <span className="font-medium">{stats.probation}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="glass glass-card p-4 md:p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.5 }}
                    >
                        <h3 className="font-semibold text-foreground mb-3 flex items-center">
                            <Building className="w-4 h-4 mr-2" />
                            Department Distribution
                        </h3>
                        <div className="space-y-2 text-sm">
                            {organizationStructure?.stats?.byDepartment?.map(dept => (
                                <div key={dept._id} className="flex justify-between">
                                    <span className="text-muted-foreground">{dept._id || 'No Department'}</span>
                                    <span className="font-medium">{dept.count}</span>
                                </div>
                            )) || (
                                    <>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Directorate</span>
                                            <span>0</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Elementary</span>
                                            <span>0</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Junior High</span>
                                            <span>0</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Operational</span>
                                            <span>0</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>MAD Lab</span>
                                            <span>0</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Finance</span>
                                            <span>0</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>CARE</span>
                                            <span>0</span>
                                        </div>
                                    </>
                                )}
                        </div>
                    </motion.div>
                </div>

                <div className="glass glass-card p-4 md:p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0, duration: 0.5 }}
                    >
                        <h3 className="font-semibold text-foreground mb-3 flex items-center">
                            <UserCheck className="w-4 h-4 mr-2" />
                            Activity Status
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Active Users</span>
                                <span className="font-medium text-green-600">{stats.totalUsers}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Inactive Users</span>
                                <span className="font-medium text-red-600">0</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="text-center text-xs text-muted-foreground"
                >
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                </motion.div>
            )}
        </div>
    );
});

UserStatsOverview.displayName = 'UserStatsOverview';

export default UserStatsOverview;
