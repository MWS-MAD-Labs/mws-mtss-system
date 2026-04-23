// RouteConfig.jsx — mws-mtss-system
import { Suspense, lazy, memo, useMemo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import PageLoader from "@/components/PageLoader";
import PageTransition from "./PageTransition";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getMtssAccessProfile } from "@/utils/mtssAccess";

const LandingPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/LandingPage'));
const AuthCallback = lazy(() => import(/* webpackPrefetch: true */ '@/pages/AuthCallback'));
const ProfilePage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/ProfilePage'));
const NotificationPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/NotificationPage'));
const NotificationSettingsPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/NotificationSettingsPage'));
const RoleSelectionPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/RoleSelectionPage'));
const UserManagementDashboard = lazy(() => import(/* webpackPrefetch: true */ '@/pages/UserManagementDashboard'));
const SupportModeSelectionPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/mtss/SupportModeSelectionPage'));
const MTSSTeacherDashboard = lazy(() => import(/* webpackPrefetch: true */ '@/pages/mtss/TeacherDashboardPage'));
const MTSSAdminDashboard = lazy(() => import(/* webpackPrefetch: true */ '@/pages/mtss/AdminDashboardPage'));
const MTSSObserverDashboard = lazy(() => import(/* webpackPrefetch: true */ '@/pages/mtss/ObserverDashboardPage'));
const MTSSPilotTestingHubPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/mtss/MTSSPilotTestingHubPage'));
const MTSSAdminAssignPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/mtss/admin/AdminMentorAssignPage'));
const MTSSStudentPortalPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/mtss/StudentPortalPage'));
const MTSSStudentProfilePage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/mtss/StudentProfilePage'));
const StudentSupportHubPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/StudentSupportHubPage'));
const StudentAIChatPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/StudentAIChatPage'));
const TeacherAIInsightsPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/TeacherAIInsightsPage'));
const AINetworkTopologyPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/AINetworkTopology'));
const NotFound = lazy(() => import(/* webpackPrefetch: true */ '@/pages/NotFound'));

const MemoizedPageTransition = memo(({ children }) => (
    <PageTransition>{children}</PageTransition>
));
MemoizedPageTransition.displayName = 'MemoizedPageTransition';

const AdminProtectedRoute = memo(({ children }) => {
    const { user } = useSelector((state) => state.auth);

    const hasAdminAccess = user && (
        user.role === 'directorate' ||
        user.role === 'superadmin' ||
        user.role === 'admin'
    );

    if (!hasAdminAccess) {
        return (
            <MemoizedPageTransition>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="glass glass-card p-8 text-center">
                        <h2 className="text-2xl font-bold text-destructive mb-4">Access Denied</h2>
                        <p className="text-muted-foreground">
                            You don't have permission to access this page.
                        </p>
                    </div>
                </div>
            </MemoizedPageTransition>
        );
    }

    return <MemoizedPageTransition>{children}</MemoizedPageTransition>;
});
AdminProtectedRoute.displayName = 'AdminProtectedRoute';

const MtssPreviewGate = memo(({ children }) => {
    const { user, loading } = useSelector((state) => state.auth);

    const storedUser = useMemo(() => {
        if (typeof window === "undefined") return null;
        try {
            const raw = localStorage.getItem("auth_user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }, []);

    const effectiveUser = user || storedUser;
    const mtssAccess = getMtssAccessProfile(effectiveUser);

    if (!effectiveUser?.email && loading) {
        return <PageLoader />;
    }

    if (!mtssAccess.hasAccess) {
        return <Navigate to="/select-role" replace />;
    }

    return children;
});
MtssPreviewGate.displayName = "MtssPreviewGate";

const publicRoutes = [
    <Route key="landing" path="/" element={<MemoizedPageTransition><LandingPage /></MemoizedPageTransition>} />,
    <Route key="auth-callback" path="/auth/callback" element={<MemoizedPageTransition><AuthCallback /></MemoizedPageTransition>} />,
    <Route key="select-role" path="/select-role" element={<ProtectedRoute allowedRoles={['teacher', 'se_teacher', 'head_unit', 'directorate', 'admin', 'superadmin']}><MemoizedPageTransition><RoleSelectionPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="profile" path="/profile" element={<ProtectedRoute><MemoizedPageTransition><ProfilePage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="notifications" path="/notifications" element={<ProtectedRoute><MemoizedPageTransition><NotificationPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="notifications-settings" path="/notifications/settings" element={<ProtectedRoute><MemoizedPageTransition><NotificationSettingsPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="user-management" path="/user-management" element={<AdminProtectedRoute><UserManagementDashboard /></AdminProtectedRoute>} />,
    <Route key="support-hub" path="/support-hub" element={<ProtectedRoute allowedRoles={['teacher', 'se_teacher', 'head_unit', 'directorate', 'admin', 'superadmin']}><MtssPreviewGate><MemoizedPageTransition><SupportModeSelectionPage /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="mtss-teacher" path="/mtss/teacher" element={<ProtectedRoute><MtssPreviewGate><MemoizedPageTransition><MTSSTeacherDashboard /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="mtss-admin" path="/mtss/admin" element={<ProtectedRoute><MtssPreviewGate><MemoizedPageTransition><MTSSAdminDashboard /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="mtss-observer" path="/mtss/observer" element={<ProtectedRoute><MtssPreviewGate><MemoizedPageTransition><MTSSObserverDashboard /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="mtss-pilot-testing" path="/mtss/pilot-testing" element={<ProtectedRoute allowedRoles={['teacher', 'se_teacher', 'head_unit', 'directorate', 'admin', 'superadmin']}><MtssPreviewGate><MemoizedPageTransition><MTSSPilotTestingHubPage /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="mtss-admin-assign" path="/mtss/admin/assign/:mentorId" element={<ProtectedRoute><MtssPreviewGate><MemoizedPageTransition><MTSSAdminAssignPage /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="mtss-student-portal" path="/mtss/student-portal" element={<ProtectedRoute><MtssPreviewGate><MemoizedPageTransition><MTSSStudentPortalPage /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="mtss-student-profile" path="/mtss/student/:slug" element={<ProtectedRoute><MtssPreviewGate><MemoizedPageTransition><MTSSStudentProfilePage /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="ai-assistant" path="/ai-assistant" element={<ProtectedRoute><MemoizedPageTransition><StudentAIChatPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="teacher-ai-insights" path="/ai-insights" element={<ProtectedRoute allowedRoles={['teacher', 'se_teacher', 'head_unit', 'directorate', 'admin', 'superadmin']}><MemoizedPageTransition><TeacherAIInsightsPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="student-support-hub" path="/student/support-hub" element={<ProtectedRoute allowedRoles={['student']}><MemoizedPageTransition><StudentSupportHubPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="student-ai-chat" path="/student/ai-chat" element={<ProtectedRoute allowedRoles={['student']}><MemoizedPageTransition><StudentAIChatPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="ai-network-topology" path="/dev/ai-topology" element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'directorate', 'head_unit']} allowedDepartments={['MAD Lab']} accessMatch="any"><AINetworkTopologyPage /></ProtectedRoute>} />,
];

const RouteConfig = memo(() => (
    <Suspense fallback={<PageLoader />}>
        <Routes>
            {publicRoutes}
            <Route path="*" element={<MemoizedPageTransition><NotFound /></MemoizedPageTransition>} />
        </Routes>
    </Suspense>
));
RouteConfig.displayName = 'RouteConfig';
export default RouteConfig;
