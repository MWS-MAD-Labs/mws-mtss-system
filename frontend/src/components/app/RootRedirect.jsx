// RootRedirect.jsx — mws-mtss-system
// The address the Hub opens the app on. A person who already has the Hub's session goes straight to their start
// page, without the landing page loading first. Only a visit without a session reaches the landing page, which
// sends it to the Hub.
import { Suspense, lazy, useState } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import PageLoader from "@/components/PageLoader";
import { consumePendingRedirect, getDefaultPostLoginPath } from "@/utils/authRedirect";

const LandingPage = lazy(() => import("@/pages/LandingPage"));

const RootRedirect = () => {
    const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
    // Read once, a second render must not find it already used.
    const [pending] = useState(() => (isAuthenticated ? consumePendingRedirect() : null));

    if (isAuthenticated) return <Navigate to={pending || getDefaultPostLoginPath(user)} replace />;
    if (loading) return <PageLoader />;
    return (
        <Suspense fallback={<PageLoader />}>
            <LandingPage />
        </Suspense>
    );
};

export default RootRedirect;
