import React, { useCallback } from "react";
import { cn, sanitizeLight, sanitizeText } from "@/lib/utils";

/**
 * Tokenized, liquid-glass Textarea with optional built-in sanitization.
 * - Compact-friendly sizing (mobile-first)
 * - Smooth transitions (320ms soft easing)
 * - Accessible focus ring using tokens
 *
 * Props:
 * - sanitize: boolean | "light" | "strong" (default "light")
 * - onChange: (e) => void (receives sanitized value in e.target.value when sanitize enabled)
 * - onPaste: user handler is called after security guard (unless blocked)
 */
const Textarea = React.forwardRef(
    (
        {
            className,
            sanitize = "light", // true|"light"|"strong"|false
            onChange,
            onPaste,
            rows = 3,
            ...props
        },
        ref
    ) => {
        const doSanitize = sanitize !== false;
        const mode = sanitize === "strong" ? "strong" : "light";
        const sanitizer = mode === "strong" ? sanitizeText : sanitizeLight;

        const handleChange = useCallback(
            (e) => {
                if (doSanitize && typeof e?.target?.value === "string") {
                    const original = e.target.value;
                    const cleaned = sanitizer(original);
                    if (cleaned !== original) {
                        const next = { ...e, target: { ...e.target, value: cleaned } };
                        onChange?.(next);
                        return;
                    }
                }
                onChange?.(e);
            },
            [doSanitize, sanitizer, onChange]
        );

        const handlePaste = useCallback(
            (e) => {
                try {
                    const txt = (e.clipboardData || window.clipboardData).getData("text") || "";
                    if (
                        /\bhttps?:\/\//i.test(txt) ||
                        /<script/i.test(txt) ||
                        /\b(javascript:|data:|vbscript:)/i.test(txt)
                    ) {
                        e.preventDefault();
                        return;
                    }
                } catch {
                    /* noop */
                }
                onPaste?.(e);
            },
            [onPaste]
        );

        return (
            <textarea
                ref={ref}
                rows={rows}
                onChange={handleChange}
                onPaste={handlePaste}
                className={cn(
                    // compact height and padding on mobile
                    "flex min-h-[84px] w-full rounded-xl",
                    // glass + tokens
                    "border border-input bg-card/60 backdrop-blur-xl",
                    // typography and padding
                    "px-3 py-2 text-sm placeholder:text-muted-foreground",
                    // focus and transition
                    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "transition-[color,background-color,border-color,box-shadow,transform,opacity] mtss-duration-soft mtss-ease-soft",
                    // disabled
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            />
        );
    }
);
Textarea.displayName = "Textarea";

export { Textarea };
