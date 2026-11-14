import React, { useState, useEffect, memo, useCallback, Suspense, lazy } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import AnimatedPage from "@/components/AnimatedPage";
import {
    fetchUsers,
    fetchOrganizationStructure,
    setFilters,
    clearError
} from "../store/slices/userSlice";
import SyncStatusLine from "./user-management/components/SyncStatusLine";

// Lazy load components for better performance
const UserStatsOverview = lazy(() => import(/* webpackChunkName: "user-stats" */ "./user-management/components/UserStatsOverview"));
const UserTable = lazy(() => import(/* webpackChunkName: "user-table" */ "./user-management/components/UserTable"));
const UserFilters = lazy(() => import(/* webpackChunkName: "user-filters" */ "./user-management/components/UserFilters"));
const UserDetailsModal = lazy(() => import(/* webpackChunkName: "user-details" */ "./user-management/components/UserDetailsModal"));

// Loading fallback component
const LoadingFallback = memo(() => (
    <div className="glass glass-card p-6">
        <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted/30 rounded w-1/3"></div>
            <div className="h-3 bg-muted/20 rounded w-1/2"></div>
            <div className="h-3 bg-muted/20 rounded w-2/3"></div>
        </div>
    </div>
));

LoadingFallback.displayName = 'LoadingFallback';

const UserManagementDashboard = memo(() => {
    const dispatch = useDispatch();

    // Redux state
    const {
        users,
        organizationStructure,
        pagination,
        filters,
        loading,
        error,
        lastUpdated
    } = useSelector((state) => state.users);

    // Local state
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Load initial data. The route only opens for people holding users.read.
    useEffect(() => {
        dispatch(fetchUsers(filters));
        dispatch(fetchOrganizationStructure());
    }, [dispatch, filters]);

    // Handle filter changes
    const handleFiltersChange = useCallback((newFilters) => {
        dispatch(setFilters(newFilters));
    }, [dispatch]);

    // Handle pagination
    const handlePageChange = useCallback((page) => {
        dispatch(setFilters({ ...filters, page }));
    }, [dispatch, filters]);

    // Clear error when component unmounts
    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    return (
        <AnimatedPage>
            <Helmet>
                <title>User Management — Millennia World School</title>
                <meta name="description" content="Advanced user management system for school administration" />
            </Helmet>

            <div className="min-h-screen text-foreground relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 container-tight py-4 md:py-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <h1 className="text-3xl font-bold mb-2">User Management Dashboard</h1>
                        <p className="text-muted-foreground">
                            The people Central lists for MTSS. Who they are and what they may do is set in Central.
                        </p>
                        <SyncStatusLine />
                    </motion.div>

                    {/* Error Display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
                            >
                                <p className="text-destructive text-sm">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Tab Navigation */}
                    <div className="mb-6">
                        <div className="flex space-x-1 bg-muted/30 p-1 rounded-lg">
                            {[
                                { id: 'overview', label: 'Overview', icon: '📊' },
                                { id: 'users', label: 'Users', icon: '👥' },
                                { id: 'analytics', label: 'Analytics', icon: '📈' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-background shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Suspense fallback={<LoadingFallback />}>
                                    <UserStatsOverview
                                        organizationStructure={organizationStructure}
                                        totalUsers={pagination.totalUsers}
                                        lastUpdated={lastUpdated}
                                    />
                                </Suspense>
                            </motion.div>
                        )}

                        {activeTab === 'users' && (
                            <motion.div
                                key="users"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="space-y-6">
                                    {/* Filters */}
                                    <Suspense fallback={<LoadingFallback />}>
                                        <UserFilters
                                            filters={filters}
                                            onFiltersChange={handleFiltersChange}
                                        />
                                    </Suspense>

                                    {/* User Table */}
                                    <Suspense fallback={<LoadingFallback />}>
                                        <UserTable
                                            users={users}
                                            loading={loading}
                                            pagination={pagination}
                                            onPageChange={handlePageChange}
                                            onViewUser={setSelectedUser}
                                        />
                                    </Suspense>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'analytics' && (
                            <motion.div
                                key="analytics"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="space-y-6">
                                    {/* Department Analytics */}
                                    <div className="glass glass-card p-6">
                                        <h3 className="text-xl font-semibold mb-4">Department Analytics</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {organizationStructure?.stats?.byDepartment?.map((dept) => (
                                                <div key={dept._id} className="p-4 bg-muted/30 rounded-lg">
                                                    <h4 className="font-semibold text-lg">{dept._id}</h4>
                                                    <p className="text-2xl font-bold text-primary">{dept.count}</p>
                                                    <p className="text-sm text-muted-foreground">members</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Role Distribution */}
                                    <div className="glass glass-card p-6">
                                        <h3 className="text-xl font-semibold mb-4">Roles in Central</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {organizationStructure?.stats?.byRole?.map((role) => (
                                                <div key={role._id} className="text-center p-4 bg-muted/20 rounded-lg">
                                                    <p className="text-2xl font-bold text-primary">{role.count}</p>
                                                    <p className="text-sm text-muted-foreground capitalize">{role._id}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Employment Status */}
                                    <div className="glass glass-card p-6">
                                        <h3 className="text-xl font-semibold mb-4">Employment Status</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            {organizationStructure?.stats?.byEmploymentStatus?.map((status) => (
                                                <div key={status._id} className="text-center p-4 bg-muted/20 rounded-lg">
                                                    <p className="text-2xl font-bold text-primary">{status.count}</p>
                                                    <p className="text-sm text-muted-foreground">{status._id}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Modals */}
                    <AnimatePresence>
                        {selectedUser && (
                            <Suspense fallback={null}>
                                <UserDetailsModal
                                    user={selectedUser}
                                    onClose={() => setSelectedUser(null)}
                                />
                            </Suspense>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </AnimatedPage>
    );
});

UserManagementDashboard.displayName = 'UserManagementDashboard';

export default UserManagementDashboard;