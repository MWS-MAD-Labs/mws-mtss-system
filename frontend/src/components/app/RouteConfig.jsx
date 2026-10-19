// RouteConfig.jsx — mws-mtss-system
import { Suspense, lazy, memo, useMemo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import PageLoader from "@/components/PageLoader";
import PageTransition from "./PageTransition";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getMtssAccessProfile } from "@/utils/mtssAccess";
import { getStoredAuthUser } from "@/utils/authStorage";
import { PERMISSIONS } from "@/constants/permissions";
import { PERSON_TYPE } from "@/constants/enums";
import RootRedirect from "./RootRedirect";

const AccountNotFoundPage = lazy(() => import('@/pages/AccountNotFoundPage'));
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

const MtssPreviewGate = memo(({ children }) => {
    const { user, loading } = useSelector((state) => state.auth);

    const storedUser = useMemo(() => {
        if (typeof window === "undefined") return null;
        try {
            return getStoredAuthUser();
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
        return <Navigate to="/mtss/home" replace />;
    }

    return children;
});
MtssPreviewGate.displayName = "MtssPreviewGate";

const publicRoutes = [
    <Route key="landing" path="/mtss" element={<RootRedirect />} />,
    <Route key="account-not-found" path="/mtss/account-not-found" element={<MemoizedPageTransition><AccountNotFoundPage /></MemoizedPageTransition>} />,
    <Route key="home" path="/mtss/home" element={<ProtectedRoute personType={PERSON_TYPE.EMPLOYEE}><MemoizedPageTransition><RoleSelectionPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="profile" path="/mtss/profile" element={<ProtectedRoute><MemoizedPageTransition><ProfilePage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="notifications" path="/mtss/notifications" element={<ProtectedRoute><MemoizedPageTransition><NotificationPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="notifications-settings" path="/mtss/notifications/settings" element={<ProtectedRoute><MemoizedPageTransition><NotificationSettingsPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="user-management" path="/mtss/user-management" element={<ProtectedRoute anyPermission={[PERMISSIONS.USERS_READ]}><MemoizedPageTransition><UserManagementDashboard /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="support-hub" path="/mtss/support-hub" element={<ProtectedRoute anyPermission={[PERMISSIONS.MTSS_READ]}><MtssPreviewGate><MemoizedPageTransition><SupportModeSelectionPage /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="mtss-teacher" path="/mtss/teacher" element={<ProtectedRoute anyPermission={[PERMISSIONS.MTSS_READ]}><MtssPreviewGate><MemoizedPageTransition><MTSSTeacherDashboard /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="mtss-admin" path="/mtss/admin" element={<ProtectedRoute anyPermission={[PERMISSIONS.MTSS_ADMIN]}><MtssPreviewGate><MemoizedPageTransition><MTSSAdminDashboard /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="mtss-observer" path="/mtss/observer" element={<ProtectedRoute anyPermission={[PERMISSIONS.MTSS_READ]}><MtssPreviewGate><MemoizedPageTransition><MTSSObserverDashboard /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="mtss-pilot-testing" path="/mtss/pilot-testing" element={<ProtectedRoute anyPermission={[PERMISSIONS.MTSS_READ]}><MtssPreviewGate><MemoizedPageTransition><MTSSPilotTestingHubPage /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="mtss-admin-assign" path="/mtss/admin/assign/:mentorId" element={<ProtectedRoute anyPermission={[PERMISSIONS.MTSS_ADMIN]}><MtssPreviewGate><MemoizedPageTransition><MTSSAdminAssignPage /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="mtss-student-portal" path="/mtss/student-portal" element={<ProtectedRoute anyPermission={[PERMISSIONS.MTSS_READ]}><MtssPreviewGate><MemoizedPageTransition><MTSSStudentPortalPage /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="mtss-student-profile" path="/mtss/student/:slug" element={<ProtectedRoute anyPermission={[PERMISSIONS.MTSS_READ]}><MtssPreviewGate><MemoizedPageTransition><MTSSStudentProfilePage /></MemoizedPageTransition></MtssPreviewGate></ProtectedRoute>} />,
    <Route key="ai-assistant" path="/mtss/ai-assistant" element={<ProtectedRoute personType={PERSON_TYPE.EMPLOYEE} anyPermission={[PERMISSIONS.AI_CHAT_USE]}><MemoizedPageTransition><StudentAIChatPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="teacher-ai-insights" path="/mtss/teacher/ai-insights" element={<ProtectedRoute anyPermission={[PERMISSIONS.AI_INSIGHTS_READ]}><MemoizedPageTransition><TeacherAIInsightsPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="student-support-hub" path="/mtss/student/support-hub" element={<ProtectedRoute personType={PERSON_TYPE.STUDENT}><MemoizedPageTransition><StudentSupportHubPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="student-ai-chat" path="/mtss/student/ai-chat" element={<ProtectedRoute personType={PERSON_TYPE.STUDENT} anyPermission={[PERMISSIONS.AI_CHAT_USE]}><MemoizedPageTransition><StudentAIChatPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="ai-network-topology" path="/mtss/dev/ai-topology" element={<ProtectedRoute anyPermission={[PERMISSIONS.DEV_TOPOLOGY_READ]}><AINetworkTopologyPage /></ProtectedRoute>} />,
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
