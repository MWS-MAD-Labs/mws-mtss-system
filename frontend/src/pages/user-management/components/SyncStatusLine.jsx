import { memo, useEffect, useState } from "react";
import { getSyncStatus } from "@/services/syncService";

const REFRESH_MS = 60 * 1000;

const ago = (value, now) => {
    if (!value) return "not yet";
    const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000));
    if (seconds < 60) return "just now";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
};

// How the automatic sync with Central is doing. There is nothing to press: it runs by itself every minute.
const SyncStatusLine = memo(() => {
    const [status, setStatus] = useState(null);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        let active = true;
        const load = () => getSyncStatus()
            .then((data) => { if (active) { setStatus(data); setNow(Date.now()); } })
            .catch(() => {});
        load();
        const timer = setInterval(load, REFRESH_MS);
        return () => { active = false; clearInterval(timer); };
    }, []);

    if (!status) return null;

    const problems = [status.lastError && `Sync with Central is failing: ${status.lastError}`, ...(status.warnings || [])].filter(Boolean);

    return (
        <section className="mt-2 space-y-1 text-sm text-muted-foreground" aria-live="polite">
            <p>
                {status.lastError ? "Not synced with Central." : "Synced with Central."} Last check {ago(status.checkedAt, now)}.
                {status.syncedAt ? ` Last change ${ago(status.syncedAt, now)}.` : ""}
            </p>
            {problems.map((problem) => <p key={problem} className="text-destructive">{problem}</p>)}
        </section>
    );
});

SyncStatusLine.displayName = "SyncStatusLine";

export default SyncStatusLine;
