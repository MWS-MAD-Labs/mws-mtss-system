// useHubSignIn.js — mws-mtss-system
// The landing page's side of the Hub's shared session. There is no sign-in here: a visit without a session goes to
// the Hub (which gives the session back if the person still has one), and a visit with one goes to the app.
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { fetchCurrentUser } from "@/store/slices/authSlice";
import { consumePendingRedirect, getDefaultPostLoginPath } from "@/utils/authRedirect";
import { goToHubHome, sendToHub } from "@/utils/hubSession";

// Codes the landing page can be opened with (?error=). The Hub round trip itself has no error codes any more.
const ERROR_MESSAGES = {
    account_inactive: "Your account has been deactivated. Contact an administrator.",
};

// redirectToHub: a visit without a session goes to the Hub on its own.
const useHubSignIn = ({ redirectToHub = false } = {}) => {
    const { toast } = useToast();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [isCheckingHub, setIsCheckingHub] = useState(false);
    // Read before the effect below strips the code from the address.
    const [arrivedWithError] = useState(() => new URLSearchParams(window.location.search).has("error"));

    // Opened with an error code: say so here instead of sending the person around again.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errorCode = params.get("error");
        if (!errorCode) return;

        toast({
            title: "Could not open the app",
            description: ERROR_MESSAGES[errorCode] || "Something went wrong. Please try again from the Hub.",
            variant: "destructive",
        });

        params.delete("error");
        const query = params.toString();
        window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }, [toast]);

    // Already holding a session: go straight to the post-login page.
    useEffect(() => {
        if (!isAuthenticated) return;
        const pendingRedirect = consumePendingRedirect();
        const fallbackPath = getDefaultPostLoginPath(user);
        navigate(pendingRedirect || fallbackPath, { replace: true });
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        if (!redirectToHub || isAuthenticated || arrivedWithError) return;
        let active = true;
        (async () => {
            // A session may still be valid before the store has loaded it.
            const action = await dispatch(fetchCurrentUser());
            if (!active || fetchCurrentUser.fulfilled.match(action)) return;
            // No access to this application is its own answer, not a reason to go round again.
            if (action.payload?.status === 403) {
                navigate("/mtss/account-not-found", { replace: true });
                return;
            }
            await sendToHub();
        })();
        return () => {
            active = false;
        };
    }, [redirectToHub, arrivedWithError, isAuthenticated, dispatch, navigate]);

    const handleHubSignIn = useCallback(async () => {
        setIsCheckingHub(true);
        try {
            await goToHubHome();
        } finally {
            setIsCheckingHub(false);
        }
    }, []);

    return { handleHubSignIn, isCheckingHub };
};

export default useHubSignIn;
