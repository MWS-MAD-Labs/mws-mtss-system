import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMentorAssignments, fetchMtssStudentById } from "@/services/mtssService";
import socketService from "@/services/socketService";
import {
    MTSS_REALTIME_ADMIN_ROLES,
    MTSS_REALTIME_MENTOR_ROLES,
    resolveMtssRealtimeScope,
} from "../utils/mtssRealtimeScope";
import { getStoredUser, mapAssignmentsToStudents } from "../utils/teacherDashboardUtils";

const useStudentProfileData = (slug) => {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIntervention, setSelectedIntervention] = useState(null);

    const mentor = useMemo(() => getStoredUser(), []);

    const loadStudent = useCallback(async ({ signal, silent = false } = {}) => {
        if (!silent) {
            setLoading(true);
        }
        setError(null);
        try {
            const requestConfig = signal ? { signal } : {};
            const payload = await fetchMtssStudentById(slug, requestConfig);
            const nextStudent = payload?.student || null;
            setStudent(nextStudent);

            const details = nextStudent?.interventionDetails || [];
            setSelectedIntervention((previousSelection) => {
                if (!details.length) return null;
                if (!previousSelection) return details[0];

                return details.find((detail) => String(detail?.id || "") === String(previousSelection?.id || ""))
                    || details.find((detail) => (
                        String(detail?.type || "") === String(previousSelection?.type || "")
                        && String(detail?.label || "") === String(previousSelection?.label || "")
                    ))
                    || details[0];
            });
        } catch (err) {
            if (err?.name === "CanceledError" || err?.name === "AbortError") return;
            try {
                const requestConfig = signal ? { signal } : {};
                const { assignments = [] } = await fetchMentorAssignments({}, requestConfig);
                const { students: normalized } = mapAssignmentsToStudents(
                    assignments,
                    mentor?.username || mentor?.name || "MTSS Mentor",
                );
                const assigned = normalized.find((item) => item.slug === slug);
                if (assigned) {
                    setStudent(assigned);
                    return;
                }
            } catch (fallbackError) {
                // Fallback intentionally ignored; surface the original profile load error below.
            }
            setError(err.response?.data?.message || err.message || "Unable to load student profile");
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [slug, mentor]);

    useEffect(() => {
        const controller = new AbortController();
        loadStudent({ signal: controller.signal });
        return () => {
            controller.abort();
        };
    }, [loadStudent]);

    useEffect(() => {
        const userId = mentor?.id || mentor?._id;
        const role = String(mentor?.role || "").trim().toLowerCase();
        const liveScope = resolveMtssRealtimeScope(mentor);
        if (!userId || !role) return;

        socketService.connect();
        socketService.joinMtssLive(liveScope);
        if (MTSS_REALTIME_ADMIN_ROLES.has(role)) {
            socketService.joinMtssAdmin();
        } else if (MTSS_REALTIME_MENTOR_ROLES.has(role)) {
            socketService.joinMtssMentor(userId);
        }

        const handleMtssRefresh = () => {
            loadStudent({ silent: true });
        };

        socketService.onMtssRefresh(handleMtssRefresh);

        return () => {
            socketService.offMtssRefresh(handleMtssRefresh);
            socketService.leaveMtssLive(liveScope);
            if (MTSS_REALTIME_ADMIN_ROLES.has(role)) {
                socketService.leaveMtssAdmin();
            } else if (MTSS_REALTIME_MENTOR_ROLES.has(role)) {
                socketService.leaveMtssMentor(userId);
            }
        };
    }, [loadStudent, mentor]);

    return {
        student,
        loading,
        error,
        selectedIntervention,
        setSelectedIntervention,
    };
};

export default useStudentProfileData;
