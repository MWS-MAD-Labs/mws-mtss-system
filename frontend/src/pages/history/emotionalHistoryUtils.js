import { normalizeId } from "@/utils/id";

export function resolveTargetUserId(userId, currentUser) {
    return normalizeId(userId)
        || normalizeId(currentUser)
        || normalizeId(currentUser?.id)
        || normalizeId(currentUser?._id);
}

export function extractUserCheckins(checkinHistory, targetUserId) {
    if (!checkinHistory || !targetUserId) return [];
    const data = Array.isArray(checkinHistory)
        ? checkinHistory
        : checkinHistory.data?.checkins || checkinHistory.checkins || [];

    return data.filter((checkin) => normalizeId(checkin.userId) === targetUserId);
}

export function mapReflections(userCheckins = []) {
    return userCheckins
        .filter((checkin) => checkin.details)
        .map((checkin) => ({
            id: checkin._id,
            timestamp: new Date(checkin.date),
            date: new Date(checkin.date).toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            }),
            time: new Date(checkin.date).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
            }),
            details: checkin.details,
            weatherType: checkin.weatherType,
            moods: checkin.selectedMoods || [],
            presenceLevel: checkin.presenceLevel,
            capacityLevel: checkin.capacityLevel,
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
}

export function getAveragePresence(reflections = []) {
    if (!reflections.length) return 0;
    const avg = reflections.reduce((sum, item) => sum + item.presenceLevel, 0) / reflections.length;
    return Math.round(avg * 10) / 10;
}
