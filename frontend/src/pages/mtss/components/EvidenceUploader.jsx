import { memo, useCallback, useRef, useEffect } from "react";
import { Upload, X, FileText, File, ImageIcon } from "lucide-react";

const ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx";
const MAX_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
};

const FileIcon_ = ({ type }) => {
    if (IMAGE_TYPES.has(type)) return <ImageIcon className="w-4 h-4 text-blue-500" />;
    if (type === "application/pdf") return <FileText className="w-4 h-4 text-red-500" />;
    return <File className="w-4 h-4 text-slate-500" />;
};

const EvidenceUploader = memo(({ files = [], setFiles, maxFiles = 5, uploading = false, uploadProgress = 0 }) => {
    const inputRef = useRef(null);

    useEffect(() => {
        return () => files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    }, []);

    const addFiles = useCallback(
        (incoming) => {
            const valid = [];
            for (const file of incoming) {
                if (files.length + valid.length >= maxFiles) break;
                if (file.size > MAX_SIZE) continue;
                const preview = IMAGE_TYPES.has(file.type) ? URL.createObjectURL(file) : null;
                valid.push({ file, preview, name: file.name, size: file.size, type: file.type });
            }
            if (valid.length) setFiles((prev) => [...prev, ...valid]);
        },
        [files.length, maxFiles, setFiles],
    );

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            if (uploading) return;
            addFiles(Array.from(e.dataTransfer.files));
        },
        [addFiles, uploading],
    );

    const handleSelect = useCallback(
        (e) => {
            if (e.target.files) addFiles(Array.from(e.target.files));
            e.target.value = "";
        },
        [addFiles],
    );

    const removeFile = useCallback(
        (idx) => {
            setFiles((prev) => {
                const next = [...prev];
                const removed = next.splice(idx, 1)[0];
                if (removed?.preview) URL.revokeObjectURL(removed.preview);
                return next;
            });
        },
        [setFiles],
    );

    return (
        <div className="space-y-2">
            {/* Drop zone */}
            {files.length < maxFiles && (
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => !uploading && inputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed
                        ${uploading ? "border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed" : "border-slate-300 dark:border-slate-600 hover:border-primary/50 cursor-pointer"}
                        bg-slate-50/50 dark:bg-slate-800/30 p-4 transition-colors`}
                >
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                        Tap to browse or drag files here
                    </p>
                    <p className="text-[9px] text-muted-foreground/60">
                        JPG, PNG, PDF, DOC — max {formatBytes(MAX_SIZE)} each
                    </p>
                    <input ref={inputRef} type="file" multiple accept={ACCEPT} onChange={handleSelect} className="hidden" />
                </div>
            )}

            {/* File list */}
            {files.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">
                        {files.length}/{maxFiles} files
                    </p>
                    {files.map((f, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 rounded-lg bg-slate-100/80 dark:bg-slate-800/50 px-2.5 py-1.5 border border-slate-200/60 dark:border-slate-700/40"
                        >
                            {f.preview ? (
                                <img src={f.preview} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                            ) : (
                                <div className="w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                    <FileIcon_ type={f.type} />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs font-medium text-foreground dark:text-white truncate">{f.name}</p>
                                <p className="text-[9px] text-muted-foreground">{formatBytes(f.size)}</p>
                            </div>
                            {!uploading && (
                                <button onClick={() => removeFile(idx)} className="p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                                    <X className="w-3.5 h-3.5 text-red-500" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload progress */}
            {uploading && uploadProgress > 0 && (
                <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <p className="text-[9px] text-muted-foreground text-right">{uploadProgress}%</p>
                </div>
            )}
        </div>
    );
});
EvidenceUploader.displayName = "EvidenceUploader";

export default EvidenceUploader;
