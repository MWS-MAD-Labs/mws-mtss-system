// src/pages/DisputePage.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import AnimatedPage from "@/components/AnimatedPage";
import { useToast } from "@/components/ui/use-toast";
import { Helmet } from "react-helmet";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeText } from "@/lib/utils";

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_DESC_LENGTH = 2000;


const formatBytes = (n) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${Math.round(n / (1024 * 1024))} MB`;
};

const hasSuspiciousExtension = (name) => {
    const lower = name.toLowerCase();
    const parts = lower.split(".");
    if (parts.length <= 2) return false;
    const lastExt = parts[parts.length - 1];
    const hasDangerous = parts
        .slice(0, -1)
        .some((p) => ["php", "exe", "sh", "bat", "js", "html"].includes(p));
    return hasDangerous && ["png", "jpg", "jpeg", "webp", "pdf"].includes(lastExt);
};

export default function DisputePage() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [jobId] = useState("JOB-123-XYZ");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);
    const descLength = description.length;

    const canSubmit = useMemo(
        () => descLength >= 10 && descLength <= MAX_DESC_LENGTH && !submitting,
        [descLength, submitting]
    );

    const validateFile = (file) => {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return `Tipe file tidak didukung: ${file.name}`;
        }
        if (file.size > MAX_FILE_BYTES) {
            return `Maximum size ${formatBytes(MAX_FILE_BYTES)} — file ${file.name} is too large`;
        }
        if (hasSuspiciousExtension(file.name)) {
            return `Suspicious file extension: ${file.name}`;
        }
        return null;
    };

    const addFiles = (fileList) => {
        const arr = Array.from(fileList || []);
        const next = [];
        for (const f of arr) {
            const err = validateFile(f);
            if (err) {
                toast({ title: "Invalid file", description: err, variant: "destructive" });
                continue;
            }
            const dup = files.find((x) => x.name === f.name && x.size === f.size);
            if (dup) continue;
            const isImage = f.type.startsWith("image/");
            const preview = isImage ? URL.createObjectURL(f) : null;
            next.push({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                file: f,
                name: f.name,
                size: f.size,
                type: f.type,
                preview,
                progress: 0,
            });
        }
        if (next.length) setFiles((prev) => [...prev, ...next]);
    };

    const handleFileChange = (e) => {
        addFiles(e.target.files);
        e.target.value = "";
    };

    const removeFile = (id) => {
        setFiles((prev) => {
            prev.forEach((f) => {
                if (f.id === id && f.preview) URL.revokeObjectURL(f.preview);
            });
            return prev.filter((f) => f.id !== id);
        });
    };

    useEffect(() => {
        return () => {
            files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
        };
    }, [files]);

    const uploadFile = (fileObj, onProgress) =>
        new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const fd = new FormData();
            fd.append("jobId", jobId);
            fd.append("description", sanitizeText(description));
            fd.append("file", fileObj.file);
            xhr.open("POST", "/api/disputes");
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    onProgress(percent);
                }
            };
            xhr.onload = () => {
                if (xhr.status === 200) resolve(xhr.response);
                else reject(new Error("Upload failed"));
            };
            xhr.onerror = () => reject(new Error("Network error"));
            xhr.send(fd);
        });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const sanitized = sanitizeText(description);
        if (sanitized.length < 10) {
            toast({ title: "Description too short", description: "Minimum 10 characters." });
            return;
        }
        setSubmitting(true);
        try {
            await Promise.all(
                files.map((fileObj) =>
                    uploadFile(fileObj, (p) => {
                        setFiles((prev) =>
                            prev.map((f) => (f.id === fileObj.id ? { ...f, progress: p } : f))
                        );
                    })
                )
            );
            toast({
                title: "Report submitted",
                description: "Our team will review your report within 24 hours.",
            });
            setDescription("");
            setFiles([]);
            setTimeout(() => navigate(-1), 1200);
        } catch (err) {
            console.error(err);
            toast({ title: "Failed to submit", description: err.message, variant: "destructive" });
            setSubmitting(false);
        }
    };

    return (
        <AnimatedPage>
            <Helmet>
                <title>Submit Dispute — MWS IntegraLearn</title>
            </Helmet>
            <div className="relative min-h-dvh w-full px-3 py-4 sm:px-4 sm:py-6">
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4 flex items-center gap-2"
                >
                    <Link to={-1}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-card/40 backdrop-blur-md ring-1 ring-border text-muted-foreground hover:text-accent-foreground hover:bg-accent/12 transition-colors duration-300"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                        <span className="text-accent">⚑</span> Report an Issue
                    </h1>
                </motion.div>
                <Card className="rounded-2xl sm:rounded-3xl border border-border/40 bg-card/50 shadow-xl backdrop-blur-xl">
                    <CardContent className="p-4 sm:p-6 space-y-4">
                        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 sm:p-4">
                            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive mt-1" />
                            <div>
                                <h3 className="font-semibold text-destructive text-sm sm:text-base">Important</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Clearly describe the issue. Attach evidence if available.
                                </p>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground">Job ID</Label>
                                <p className="mt-1 rounded-md bg-background/40 px-3 py-1 font-mono text-xs sm:text-sm text-foreground/80">
                                    {jobId}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Issue Details</Label>
                                <Textarea
                                    rows={4}
                                    required
                                    value={description}
                                    sanitize="strong"
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="mt-1 text-xs sm:text-sm"
                                    placeholder="Contoh: Pekerja tidak menyelesaikan..."
                                />
                                <p className="mt-1 text-right text-[10px] sm:text-xs text-muted-foreground">
                                    {descLength}/{MAX_DESC_LENGTH}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Lampiran Bukti</Label>
                                <div className="mt-2 flex items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={ALLOWED_FILE_TYPES.join(",")}
                                        onChange={handleFileChange}
                                        multiple
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer flex items-center justify-center rounded-xl bg-card/40 backdrop-blur-xl border border-border/40 shadow px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground transition duration-300 hover:bg-accent/20 hover:text-accent-foreground active:scale-[0.97]"
                                    >
                                        Choose File
                                    </label>
                                    <span className="text-xs sm:text-sm text-muted-foreground">
                                        {files.length > 0 ? `${files.length} file` : "No file"}
                                    </span>
                                </div>
                                {files.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {files.map((f) => (
                                            <div
                                                key={f.id}
                                                className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/40 backdrop-blur-md p-2 shadow"
                                            >
                                                {f.preview ? (
                                                    <img
                                                        src={f.preview}
                                                        alt={f.name}
                                                        className="h-10 w-10 object-cover rounded-md"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 flex items-center justify-center rounded-md bg-secondary/30 text-[10px] font-semibold">
                                                        PDF
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                                                        {f.name}
                                                    </p>
                                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                                        {formatBytes(f.size)}
                                                    </p>
                                                    {f.progress > 0 && (
                                                        <div className="mt-1 h-1 w-full rounded bg-muted overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${f.progress}%` }}
                                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                                className="h-1 rounded bg-primary"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(f.id)}
                                                    className="text-destructive hover:opacity-80 transition"
                                                >
                                                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 transition duration-300"
                                disabled={!canSubmit}
                            >
                                {submitting ? "Submitting..." : "Submit Report"}
                                <Send className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AnimatedPage>
    );
}
