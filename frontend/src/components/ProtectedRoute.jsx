import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasEmotionalDashboardAccess } from '@/utils/accessControl';
import { storePendingRedirect } from '@/utils/authRedirect';
import { getDefaultMtssRoute, hasMtssAccess } from '@/utils/mtssAccess';
import PageLoader from '@/components/PageLoader';

const ProtectedRoute = ({
    children,
    allowedRoles = [],
    allowedDepartments = [],
    requireDirectorateAcademic = false,
    accessMatch = 'all',
}) => {
    const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
    const location = useLocation();

    // Role-aware fallback: students → student hub, MTSS roles → their own
    // dashboard directly, others (staff/support_staff) → check-in selection.
    const fallbackPath = user?.role === 'student'
        ? '/mtss/student/support-hub'
        : hasMtssAccess(user)
            ? (getDefaultMtssRoute(user) || '/mtss/select-role')
            : '/mtss/select-role';

    // Show loading while checking authentication - same branded loader as
    // AuthCallback, so there's no visual "flicker" switching between a
    // bespoke spinner and the real one mid-login.
    if (loading) {
        return <PageLoader />;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        storePendingRedirect(`${location.pathname}${location.search}${location.hash}`);
        return <Navigate to="/mtss" replace />;
    }

    // Special check for dashboard access (directorate + academic department + head_unit)
    if (requireDirectorateAcademic) {
        if (!hasEmotionalDashboardAccess(user)) {
            return <Navigate to={fallbackPath} replace />;
        }
    }

    const hasRoleRule = allowedRoles.length > 0;
    const hasDepartmentRule = allowedDepartments.length > 0;
    const roleAllowed = !hasRoleRule || allowedRoles.includes(user?.role);
    const departmentAllowed = !hasDepartmentRule || allowedDepartments.includes(user?.department);

    if (accessMatch === 'any' && (hasRoleRule || hasDepartmentRule)) {
        const passesAnyRule =
            (hasRoleRule && roleAllowed) ||
            (hasDepartmentRule && departmentAllowed);

        if (!passesAnyRule) {
            return <Navigate to={fallbackPath} replace />;
        }
    } else {
        if (!roleAllowed || !departmentAllowed) {
            return <Navigate to={fallbackPath} replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
