import { memo } from "react";

const DecorativeBlob = memo(({ variant = "primary", className = "", size = "lg" }) => {
    const sizeMap = {
        sm: "w-48 h-48 md:w-64 md:h-64",
        md: "w-64 h-64 md:w-80 md:h-80",
        lg: "w-80 h-80 md:w-96 md:h-96"
    };

    const variantMap = {
        primary: "bg-primary/20",
        gold: "bg-gold/15",
        emerald: "bg-emerald/15"
    };

    const dur = variant === "primary" ? '10s' : variant === "gold" ? '12s' : '14s';

    return (
        <div
            className={`absolute rounded-full blur-3xl ${sizeMap[size]} ${variantMap[variant]} ${className}`}
            style={{ animation: `blob-breathe ${dur} ease-in-out infinite`, willChange: 'transform, opacity' }}
        />
    );
});

DecorativeBlob.displayName = 'DecorativeBlob';
export default DecorativeBlob;
