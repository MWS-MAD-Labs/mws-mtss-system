import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import socketService from "@/services/socketService";
import { fetchPilotFeedbackSessions } from "@/services/mtssService";
import { PILOT_FEEDBACK_ADMIN_EMAILS } from "../utils/pilotFeedbackAccess";

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

const shouldHidePilotSession = (session = {}) => {
    const testerEmail = normalizeEmail(session?.tester?.email);
    return Boolean(testerEmail && PILOT_FEEDBACK_ADMIN_EMAILS.has(testerEmail));
};

const sortSessions = (items = []) =>
    [...items].sort((left, right) => {
        const rightTime = new Date(right?.updatedAt || right?.clientUpdatedAt || 0).getTime();
        const leftTime = new Date(left?.updatedAt || left?.clientUpdatedAt || 0).getTime();
        return rightTime - leftTime;
    });

const mergeSessions = (existing = [], incoming = []) => {
    const map = new Map(existing.map((item) => [item.sessionKey, item]));
    incoming.forEach((item) => {
        if (!item?.sessionKey || shouldHidePilotSession(item)) return;
        map.set(item.sessionKey, {
            ...(map.get(item.sessionKey) || {}),
            ...item,
        });
    });
    return sortSessions(Array.from(map.values()));
};

const buildStatsFromSessions = (sessions = []) => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((entry) => entry.status === "completed").length;
    const inProgressSessions = totalSessions - completedSessions;
    const sessionsWithBugs = sessions.filter((entry) => Number(entry?.bugCount || 0) > 0).length;
    const principals = new Set(
        sessions
            .map((entry) => String(entry?.tester?.email || "").trim().toLowerCase())
            .filter(Boolean),
    );
    const activeLast24Hours = sessions.filter((entry) => {
        const updatedAt = new Date(entry?.updatedAt || entry?.clientUpdatedAt || 0).getTime();
        return Number.isFinite(updatedAt) && Date.now() - updatedAt <= 24 * 60 * 60 * 1000;
    }).length;
    const finalSavedSessions = sessions.filter((entry) => entry.finalFeedbackSavedAt);
    const averageConfidence = finalSavedSessions.length
        ? Number(
            (
                finalSavedSessions.reduce((sum, entry) => sum + Number(entry?.finalFeedback?.overallConfidence || 0), 0)
                / finalSavedSessions.length
            ).toFixed(1),
        )
        : 0;

    return {
        totalSessions,
        completedSessions,
        inProgressSessions,
        sessionsWithBugs,
        principalCount: principals.size,
        activeLast24Hours,
        averageConfidence,
    };
};

const usePilotFeedbackDashboardData = ({ enabled = true } = {}) => {
    const user = useSelector((state) => state.auth?.user);
    const [sessions, setSessions] = useState([]);
    const [serverStats, setServerStats] = useState(null);
    const [loading, setLoading] = useState(Boolean(enabled));
    const [error, setError] = useState(null);
    const [lastLiveEventAt, setLastLiveEventAt] = useState(null);
    const dashboardUserId = user?.id || user?._id;

    const refresh = useCallback(async ({ background = false } = {}) => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        if (!background) {
            setLoading(true);
            setError(null);
        }

        try {
            const response = await fetchPilotFeedbackSessions(
                { limit: 300 },
                background ? { skipGlobalLoading: true } : undefined,
            );
            setSessions(sortSessions((response?.sessions || []).filter((session) => !shouldHidePilotSession(session))));
            setServerStats(response?.stats || null);
            if (background) {
                setError(null);
            }
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to load pilot feedback sessions.");
        } finally {
            if (!background) {
                setLoading(false);
            }
        }
    }, [enabled]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        if (!enabled) return undefined;

        const intervalId = window.setInterval(() => {
            refresh({ background: true });
        }, 15000);

        return () => window.clearInterval(intervalId);
    }, [enabled, refresh]);

    useEffect(() => {
        if (!enabled || !dashboardUserId) return undefined;

        socketService.connect();
        socketService.joinDashboard(dashboardUserId);

        const handlePilotFeedbackUpdate = (payload = {}) => {
            if (!payload?.session?.sessionKey) return;
            setSessions((prev) => mergeSessions(prev, [payload.session]));
            setLastLiveEventAt(payload.changedAt || new Date().toISOString());
        };

        socketService.onMtssPilotFeedbackUpdate(handlePilotFeedbackUpdate);

        return () => {
            socketService.offMtssPilotFeedbackUpdate(handlePilotFeedbackUpdate);
            socketService.leaveDashboard(dashboardUserId);
        };
    }, [dashboardUserId, enabled]);

    const stats = useMemo(
        () => (serverStats && Object.keys(serverStats).length ? { ...serverStats, ...buildStatsFromSessions(sessions) } : buildStatsFromSessions(sessions)),
        [serverStats, sessions],
    );

    return {
        sessions,
        stats,
        loading,
        error,
        refresh,
        lastLiveEventAt,
    };
};

export default usePilotFeedbackDashboardData;
