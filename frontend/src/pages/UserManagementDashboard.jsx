import React, { useState, useEffect, memo, useCallback, Suspense, lazy } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import AnimatedPage from "@/components/AnimatedPage";
import { useToast } from "@/components/ui/use-toast";
import {
    fetchUsers,
    fetchOrganizationStructure,
    createUser,
    updateUser,
    deleteUser,
    setFilters,
    clearError
} from "../store/slices/userSlice";

// Lazy load components for better performance
const UserStatsOverview = lazy(() => import(/* webpackChunkName: "user-stats" */ "./user-management/components/UserStatsOverview"));
const UserTable = lazy(() => import(/* webpackChunkName: "user-table" */ "./user-management/components/UserTable"));
const UserFilters = lazy(() => import(/* webpackChunkName: "user-filters" */ "./user-management/components/UserFilters"));
const UserForm = lazy(() => import(/* webpackChunkName: "user-form" */ "./user-management/components/UserForm"));
const OrganizationChart = lazy(() => import(/* webpackChunkName: "org-chart" */ "./user-management/components/OrganizationChart"));
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
    const { toast } = useToast();

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

    const { user: currentUser } = useSelector((state) => state.auth);

    // Local state
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Check if user has admin access
    const hasAdminAccess = currentUser && (
        currentUser.role === 'directorate' ||
        currentUser.role === 'superadmin' ||
        currentUser.role === 'admin'
    );

    // Load initial data
    useEffect(() => {
        if (hasAdminAccess) {
            dispatch(fetchUsers(filters));
            dispatch(fetchOrganizationStructure());
        }
    }, [dispatch, hasAdminAccess, filters]);

    // Handle filter changes
    const handleFiltersChange = useCallback((newFilters) => {
        dispatch(setFilters(newFilters));
    }, [dispatch]);

    // Handle user creation
    const handleCreateUser = useCallback(async (userData) => {
        try {
            await dispatch(createUser(userData)).unwrap();
            toast({
                title: "Success",
                description: "User created successfully",
            });
            setShowUserForm(false);
            // Refresh data after creation
            dispatch(fetchUsers(filters));
            dispatch(fetchOrganizationStructure());
        } catch (error) {
            toast({
                title: "Error",
                description: error || "Failed to create user",
                variant: "destructive"
            });
        }
    }, [dispatch, toast, filters]);

    // Handle user update
    const handleUpdateUser = useCallback(async (userId, userData) => {
        try {
            await dispatch(updateUser({ userId, userData })).unwrap();
            toast({
                title: "Success",
                description: "User updated successfully",
            });
            setEditingUser(null);
            setShowUserForm(false);
            // Refresh data after update
            dispatch(fetchUsers(filters));
            dispatch(fetchOrganizationStructure());
        } catch (error) {
            toast({
                title: "Error",
                description: error || "Failed to update user",
                variant: "destructive"
            });
        }
    }, [dispatch, toast, filters]);

    // Handle user deletion
    const handleDeleteUser = useCallback(async (userId) => {
        if (window.confirm('Are you sure you want to deactivate this user?')) {
            try {
                await dispatch(deleteUser(userId)).unwrap();
                toast({
                    title: "Success",
                    description: "User deactivated successfully",
                });
                // Refresh data after deletion
                dispatch(fetchUsers(filters));
                dispatch(fetchOrganizationStructure());
            } catch (error) {
                toast({
                    title: "Error",
                    description: error || "Failed to deactivate user",
                    variant: "destructive"
                });
            }
        }
    }, [dispatch, toast, filters]);

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

    // Show access denied if not admin
    if (!hasAdminAccess) {
        return (
            <AnimatedPage>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="glass glass-card p-8 text-center">
                        <h2 className="text-2xl font-bold text-destructive mb-4">Access Denied</h2>
                        <p className="text-muted-foreground">
                            You don't have permission to access the User Management Dashboard.
                        </p>
                    </div>
                </div>
            </AnimatedPage>
        );
    }

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
                            Manage users, roles, and organizational structure
                        </p>
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
                                { id: 'organization', label: 'Organization', icon: '🏢' },
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
                                            onAddUser={() => setShowUserForm(true)}
                                        />
                                    </Suspense>

                                    {/* User Table */}
                                    <Suspense fallback={<LoadingFallback />}>
                                        <UserTable
                                            users={users}
                                            loading={loading}
                                            pagination={pagination}
                                            onPageChange={handlePageChange}
                                            onEditUser={setEditingUser}
                                            onDeleteUser={handleDeleteUser}
                                            onViewUser={setSelectedUser}
                                        />
                                    </Suspense>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'organization' && (
                            <motion.div
                                key="organization"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Suspense fallback={<LoadingFallback />}>
                                    <OrganizationChart
                                        organizationStructure={organizationStructure}
                                        users={users}
                                    />
                                </Suspense>
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
                                        <h3 className="text-xl font-semibold mb-4">Role Distribution</h3>
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

                                    {/* Management Hierarchy Insights */}
                                    <div className="glass glass-card p-6">
                                        <h3 className="text-xl font-semibold mb-4">Management Insights</h3>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-blue/10 rounded-lg">
                                                <h4 className="font-semibold text-blue-700 mb-2">Leadership Structure</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Directorate members oversee {organizationStructure?.stats?.totalUsers || 0} total users
                                                    across {organizationStructure?.stats?.byDepartment?.length || 0} departments.
                                                </p>
                                            </div>
                                            <div className="p-4 bg-green/10 rounded-lg">
                                                <h4 className="font-semibold text-green-700 mb-2">Teaching Staff</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {organizationStructure?.stats?.byRole?.find(r => r._id === 'teacher')?.count || 0} teachers
                                                    and {organizationStructure?.stats?.byRole?.find(r => r._id === 'se_teacher')?.count || 0} SE teachers
                                                    are actively managing classroom assignments.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Modals */}
                    <AnimatePresence>
                        {(showUserForm || editingUser) && (
                            <Suspense fallback={null}>
                                <UserForm
                                    user={editingUser}
                                    onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                                    onCancel={() => {
                                        setShowUserForm(false);
                                        setEditingUser(null);
                                    }}
                                />
                            </Suspense>
                        )}

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