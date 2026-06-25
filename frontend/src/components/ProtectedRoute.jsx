import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasEmotionalDashboardAccess } from '@/utils/accessControl';
import { storePendingRedirect } from '@/utils/authRedirect';
import { hasMtssAccess } from '@/utils/mtssAccess';

const normalizeRole = (role = '') => String(role || '').trim().toLowerCase();
const SUPPORT_HUB_ROLES = new Set([
    'staff',
    'support_staff',
    'nurse',
    'counselor',
    'teacher',
    'se_teacher',
    'head_unit',
    'principal',
    'directorate',
    'admin',
    'superadmin',
]);

const ProtectedRoute = ({
    children,
    allowedRoles = [],
    allowedDepartments = [],
    requireDirectorateAcademic = false,
    accessMatch = 'all',
}) => {
    const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
    const location = useLocation();
    const userRole = normalizeRole(user?.role);

    // Role-aware fallback: students -> student hub, support/MTSS roles -> support hub, others -> check-in selection
    const fallbackPath = userRole === 'student'
        ? '/student/support-hub'
        : SUPPORT_HUB_ROLES.has(userRole) || hasMtssAccess(user || { role: userRole })
            ? '/support-hub'
            : '/select-role';

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        storePendingRedirect(`${location.pathname}${location.search}${location.hash}`);
        return <Navigate to="/" replace />;
    }

    // Special check for dashboard access (directorate + academic department + head_unit)
    if (requireDirectorateAcademic) {
        if (!hasEmotionalDashboardAccess(user)) {
            return <Navigate to={fallbackPath} replace />;
        }
    }

    const hasRoleRule = allowedRoles.length > 0;
    const hasDepartmentRule = allowedDepartments.length > 0;
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
    const roleAllowed = !hasRoleRule || normalizedAllowedRoles.includes(userRole);
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
