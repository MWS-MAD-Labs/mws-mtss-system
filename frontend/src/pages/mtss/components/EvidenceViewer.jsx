import { memo, useState, useCallback } from "react";
import { FileText, Download, File } from "lucide-react";
import EvidenceLightbox from "./EvidenceLightbox";
import { downloadEvidenceFile } from "./evidenceDownloadUtils";

const IMAGE_EXTS = new Set(["image/jpeg", "image/png", "image/webp"]);
const isImage = (ev) => ev.resourceType === "image" || IMAGE_EXTS.has(ev.fileType);

const EvidenceViewer = memo(({ evidence = [] }) => {
    const [lightbox, setLightbox] = useState(null);
    const [downloadingUrl, setDownloadingUrl] = useState(null);

    const imageEvidence = evidence.filter(isImage);
    const docEvidence = evidence.filter((ev) => !isImage(ev));

    const openLightbox = useCallback(
        (ev) => {
            const idx = imageEvidence.findIndex((img) => img.url === ev.url);
            setLightbox(idx >= 0 ? idx : 0);
        },
        [imageEvidence],
    );

    const handleDownloadDoc = useCallback(async (ev) => {
        if (!ev?.url || downloadingUrl === ev.url) return;
        setDownloadingUrl(ev.url);
        try {
            await downloadEvidenceFile(ev);
        } finally {
            setDownloadingUrl(null);
        }
    }, [downloadingUrl]);

    if (!evidence.length) return null;

    return (
        <>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {/* Image thumbnails */}
                {imageEvidence.map((ev, idx) => (
                    <button
                        key={ev.url || idx}
                        onClick={() => openLightbox(ev)}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-md overflow-hidden border border-slate-200/60 dark:border-slate-700/40 hover:ring-2 hover:ring-primary/40 transition-all flex-shrink-0"
                    >
                        <img src={ev.url} alt={ev.fileName || "Evidence"} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                ))}

                {/* Document links */}
                {docEvidence.map((ev, idx) => (
                    <button
                        key={ev.url || idx}
                        type="button"
                        onClick={() => handleDownloadDoc(ev)}
                        disabled={downloadingUrl === ev.url}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title={downloadingUrl === ev.url ? "Downloading..." : (ev.fileName || "Download")}
                    >
                        {ev.fileType === "application/pdf" ? (
                            <FileText className="w-3 h-3 text-red-500 flex-shrink-0" />
                        ) : (
                            <File className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        )}
                        <span className="text-[8px] sm:text-[9px] font-medium text-foreground dark:text-white truncate max-w-[60px]">
                            {ev.fileName || "File"}
                        </span>
                        <Download className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                    </button>
                ))}
            </div>

            {/* Lightbox */}
            {lightbox !== null && (
                <EvidenceLightbox images={imageEvidence} initialIndex={lightbox} onClose={() => setLightbox(null)} />
            )}
        </>
    );
});
EvidenceViewer.displayName = "EvidenceViewer";

export default EvidenceViewer;
