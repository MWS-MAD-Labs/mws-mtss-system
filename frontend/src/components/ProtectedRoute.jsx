import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasAnyPermission, isStudent } from '@/utils/accessControl';
import { storePendingRedirect } from '@/utils/authRedirect';
import { getDefaultMtssRoute, hasMtssAccess } from '@/utils/mtssAccess';
import { PERSON_TYPE } from '@/constants/enums';
import { sendToHub } from '@/utils/hubSession';
import PageLoader from '@/components/PageLoader';

// What a route asks for, all from Central:
//   anyPermission: the person must hold at least one of these permissions
//   personType:    PERSON_TYPE.STUDENT or PERSON_TYPE.EMPLOYEE, for pages built for one kind of person
const ProtectedRoute = ({
    children,
    anyPermission = [],
    personType = null,
}) => {
    const { user, isAuthenticated, loading, noAccess, leaving } = useSelector((state) => state.auth);
    const location = useLocation();

    // Students go to their hub, people with MTSS to their dashboard, everyone else to the home page.
    const fallbackPath = isStudent(user)
        ? '/mtss/student/support-hub'
        : hasMtssAccess(user)
            ? (getDefaultMtssRoute(user) || '/mtss/home')
            : '/mtss/home';

    const shouldBounceToHub = !loading && !isAuthenticated && !noAccess && !leaving;

    // No Hub session: remember where the person was going, then the Hub gives the session back when they still
    // have one, or shows its front page.
    useEffect(() => {
        if (!shouldBounceToHub) return;
        storePendingRedirect(`${location.pathname}${location.search}${location.hash}`);
        sendToHub();
    }, [shouldBounceToHub, location.pathname, location.search, location.hash]);

    // The Hub knows the person but Central gave them no access to this application.
    if (!loading && !isAuthenticated && noAccess) {
        return <Navigate to="/mtss/account-not-found" replace />;
    }

    if (loading || shouldBounceToHub) {
        return <PageLoader />;
    }

    if (anyPermission.length > 0 && !hasAnyPermission(user, anyPermission)) {
        return <Navigate to={fallbackPath} replace />;
    }

    if (personType && (isStudent(user) ? PERSON_TYPE.STUDENT : PERSON_TYPE.EMPLOYEE) !== personType) {
        return <Navigate to={fallbackPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
