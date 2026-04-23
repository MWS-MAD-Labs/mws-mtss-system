const CLOUDINARY_HOST = "res.cloudinary.com";

const safeDecode = (value) => {
    try {
        return decodeURIComponent(value);
    } catch (error) {
        return value;
    }
};

const resolveFilenameFromUrl = (url, fallback = "evidence-file") => {
    if (!url) return fallback;
    try {
        const parsed = new URL(url);
        const pathname = parsed.pathname || "";
        const raw = pathname.split("/").filter(Boolean).pop();
        if (!raw) return fallback;
        return safeDecode(raw.split("?")[0].split("#")[0]);
    } catch (error) {
        return fallback;
    }
};

const normalizeFileName = (value, fallbackUrl) => {
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed || resolveFilenameFromUrl(fallbackUrl);
};

const triggerAnchorDownload = (url, fileName) => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName || "evidence-file";
    anchor.rel = "noopener noreferrer";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
};

const buildCloudinaryAttachmentUrl = (sourceUrl) => {
    if (!sourceUrl) return null;
    try {
        const parsed = new URL(sourceUrl);
        if (!parsed.hostname.includes(CLOUDINARY_HOST)) return null;

        const marker = "/upload/";
        const markerIndex = parsed.pathname.indexOf(marker);
        if (markerIndex < 0) return null;

        const beforeUpload = parsed.pathname.slice(0, markerIndex + marker.length);
        const afterUpload = parsed.pathname.slice(markerIndex + marker.length);
        parsed.pathname = `${beforeUpload}fl_attachment/${afterUpload}`;
        return parsed.toString();
    } catch (error) {
        return null;
    }
};

const triggerHiddenFrameDownload = (url) => {
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.src = url;
    document.body.appendChild(frame);
    window.setTimeout(() => {
        frame.remove();
    }, 10000);
};

export const downloadEvidenceFile = async (item = {}) => {
    const sourceUrl = item.url;
    if (!sourceUrl) throw new Error("Evidence URL is missing");

    const fileName = normalizeFileName(item.fileName, sourceUrl);

    try {
        const response = await fetch(sourceUrl, {
            method: "GET",
            mode: "cors",
            credentials: "omit",
        });

        if (!response.ok) {
            throw new Error(`Unable to download file (${response.status})`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        triggerAnchorDownload(objectUrl, fileName);
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        return;
    } catch (error) {
        const attachmentUrl = buildCloudinaryAttachmentUrl(sourceUrl) || sourceUrl;
        triggerHiddenFrameDownload(attachmentUrl);
    }
};

