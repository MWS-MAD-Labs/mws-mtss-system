import { useMemo } from "react";
import { useSelector } from "react-redux";
import { getMtssAccessProfile, isMtssObserver as resolveIsMtssObserver } from "@/utils/mtssAccess";

export const getObserverAccessProfile = (user = null) => getMtssAccessProfile(user);

/**
 * Returns whether the current logged-in user is an MTSS observer
 * (view-only access across all units).
 */
const useMtssObserver = () => {
    const user = useSelector((state) => state.auth?.user);
    const isObserver = useMemo(() => {
        return resolveIsMtssObserver(user);
    }, [user]);
    return { isObserver };
};

export default useMtssObserver;
