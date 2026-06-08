import { memo, useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { MWS_STUDENT_CARD_ASSET_IDS } from "@/data/mwsStudentsDesignAssets";
import "@/pages/styles/checkin-dashboard-collage.css";

const CLD = "https://res.cloudinary.com/deldcwiji/image/upload";
const photo = (id, w = 160, h = 200) =>
    `${CLD}/c_fill,w_${w},h_${h},g_auto,f_auto,q_auto/${id}`;

/*
   Pick photos for all layout variants.
   Deterministic selection based on date so photos rotate daily.
*/
const pickPhotos = (count, extraSeed = 0) => {
    const dayKey = new Date().toISOString().slice(0, 10);
    let seed = extraSeed;
    for (let i = 0; i < dayKey.length; i += 1) {
        seed = ((seed << 5) - seed) + dayKey.charCodeAt(i);
        seed |= 0;
    }
    seed = Math.abs(seed);

    const pool = [...MWS_STUDENT_CARD_ASSET_IDS];
    if (!pool.length) return [];

    /* Simple deterministic shuffle */
    let s = (seed % 2147483647) || 1;
    const rng = () => {
        s = (s * 48271) % 2147483647;
        return s / 2147483647;
    };

    for (let i = pool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, count);
};

const takeCycled = (ids, start, count) => {
    if (!ids.length || count <= 0) return [];
    return Array.from({ length: count }, (_, i) => ids[(start + i) % ids.length]);
};

const prefersReducedMotion = () => {
    if (typeof window === "undefined") return true;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? true;
};

const HYBRID_WALL_LAYOUT = [
    { cols: 2, rows: 2, tilt: -1.6 },
    { cols: 2, rows: 3, tilt: 1.1 },
    { cols: 3, rows: 2, tilt: -0.8 },
    { cols: 2, rows: 2, tilt: 1.8 },
    { cols: 3, rows: 3, tilt: -1.2 },
    { cols: 2, rows: 2, tilt: 0.9 },
    { cols: 2, rows: 3, tilt: -1.4 },
    { cols: 3, rows: 2, tilt: 0.8 },
    { cols: 2, rows: 2, tilt: -1.1 },
    { cols: 3, rows: 2, tilt: 1.5 },
    { cols: 2, rows: 3, tilt: -0.7 },
    { cols: 2, rows: 2, tilt: 0.7 },
    { cols: 3, rows: 3, tilt: -1.8 },
    { cols: 2, rows: 2, tilt: 1.3 },
    { cols: 2, rows: 3, tilt: -1.0 },
    { cols: 3, rows: 2, tilt: 0.9 },
    { cols: 2, rows: 2, tilt: -1.3 },
    { cols: 2, rows: 3, tilt: 1.4 },
    { cols: 3, rows: 2, tilt: -0.9 },
    { cols: 2, rows: 2, tilt: 1.0 },
    { cols: 3, rows: 3, tilt: -1.5 },
    { cols: 2, rows: 2, tilt: 0.8 },
];

/*
   Legacy variant: subtle grid + vertical filmstrips.
*/
const PhotoMosaicBg = ({ ids }) => {
    const bgPhotos = ids.map((id) => photo(id, 280, 350));
    const repeatedPhotos = [...bgPhotos, ...bgPhotos, ...bgPhotos, ...bgPhotos, ...bgPhotos];

    return (
        <div className="ecd-mosaic-bg" aria-hidden="true">
            <div className="ecd-mosaic-grid">
                {repeatedPhotos.map((src, i) => (
                    <div key={`mosaic-${i}`} className="ecd-mosaic-cell">
                        <img src={src} alt="" loading="eager" decoding="async" />
                    </div>
                ))}
            </div>
            <div className="ecd-mosaic-overlay" />
        </div>
    );
};

const Filmstrip = ({ ids, side, className }) => {
    const photos = ids.map((id) => photo(id, 160, 200));

    return (
        <div className={`ecd-filmstrip ecd-filmstrip--${side} ${className || ""}`}>
            <div className="ecd-filmstrip__track" data-ecd-track={side}>
                {[...photos, ...photos].map((src, i) => (
                    <div key={`${side}-${i}`} className="ecd-filmstrip__frame">
                        <img src={src} alt="" loading="eager" decoding="async" />
                    </div>
                ))}
            </div>
        </div>
    );
};

/*
   Hybrid variant: structured photo wall + clustered classroom moments.
*/
const HybridPhotoWall = ({ ids }) => {
    const wallTiles = useMemo(() => {
        if (!ids.length) return [];
        return HYBRID_WALL_LAYOUT.map((slot, i) => ({
            ...slot,
            src: photo(ids[i % ids.length], 360, 440),
        }));
    }, [ids]);

    return (
        <div className="ecd-hybrid-wall" aria-hidden="true">
            <div className="ecd-hybrid-wall__grid">
                {wallTiles.map((tile, i) => (
                    <figure
                        key={`ecd-hybrid-wall-${i}`}
                        className="ecd-hybrid-wall__tile"
                        style={{
                            gridColumn: `span ${tile.cols}`,
                            gridRow: `span ${tile.rows}`,
                            "--ecd-hybrid-tilt": `${tile.tilt}deg`,
                        }}
                    >
                        <img src={tile.src} alt="" loading="eager" decoding="async" />
                    </figure>
                ))}
            </div>
            <div className="ecd-hybrid-wall__veil" />
        </div>
    );
};

const HybridPhotoCluster = ({ ids, positionClass, rotations }) => {
    if (!ids.length) return null;

    return (
        <div className={`ecd-memory-cluster ${positionClass}`} aria-hidden="true">
            {ids.map((id, i) => (
                <figure
                    key={`${positionClass}-${i}`}
                    className="ecd-memory-card"
                    style={{
                        "--ecd-card-rotate": `${rotations[i % rotations.length]}deg`,
                        "--ecd-card-delay": `${i * 1.7}s`,
                    }}
                >
                    <img src={photo(id, 260, 330)} alt="" loading="eager" decoding="async" />
                </figure>
            ))}
        </div>
    );
};

const HybridPortraitRow = ({ ids }) => {
    if (!ids.length) return null;

    return (
        <div className="ecd-hybrid-portrait-row" aria-hidden="true">
            {ids.map((id, i) => (
                <figure
                    key={`ecd-hybrid-chip-${i}`}
                    className="ecd-hybrid-portrait-chip"
                    style={{ "--ecd-chip-delay": `${i * 0.45}s` }}
                >
                    <img src={photo(id, 140, 140)} alt="" loading="eager" decoding="async" />
                </figure>
            ))}
        </div>
    );
};

/**
 * Reusable collage layer.
 * `variant="filmstrip"` keeps existing style.
 * `variant="hybrid-studio"` uses a fresher human-centered composition.
 */
const CheckinCollageLayer = memo(({ pageSeed = 0, variant = "filmstrip" }) => {
    const ref = useRef(null);
    const motionReduced = useMemo(() => prefersReducedMotion(), []);

    const photoSets = useMemo(() => {
        const seededIds = pickPhotos(72, pageSeed);
        return {
            leftIds: takeCycled(seededIds, 0, 8),
            rightIds: takeCycled(seededIds, 8, 8),
            bgIds: takeCycled(seededIds, 16, 34),
            hybridWallIds: takeCycled(seededIds, 8, HYBRID_WALL_LAYOUT.length),
            hybridLeftTopIds: takeCycled(seededIds, 44, 4),
            hybridRightTopIds: takeCycled(seededIds, 48, 4),
            hybridLeftBottomIds: takeCycled(seededIds, 52, 4),
            hybridRightBottomIds: takeCycled(seededIds, 56, 4),
            hybridPortraitIds: takeCycled(seededIds, 60, 6),
        };
    }, [pageSeed]);

    useEffect(() => {
        if (variant !== "filmstrip") return undefined;
        const root = ref.current;
        if (!root || motionReduced) return undefined;

        const leftTrack = root.querySelector('[data-ecd-track="left"]');
        const rightTrack = root.querySelector('[data-ecd-track="right"]');
        const tweens = [];

        if (leftTrack) {
            const halfH = leftTrack.scrollHeight / 2;
            gsap.set(leftTrack, { y: 0 });
            tweens.push(
                gsap.to(leftTrack, {
                    y: -halfH,
                    duration: 60,
                    ease: "none",
                    repeat: -1,
                })
            );
        }

        if (rightTrack) {
            const halfH = rightTrack.scrollHeight / 2;
            gsap.set(rightTrack, { y: -halfH });
            tweens.push(
                gsap.to(rightTrack, {
                    y: 0,
                    duration: 65,
                    ease: "none",
                    repeat: -1,
                })
            );
        }

        const onVisibility = () => {
            tweens.forEach((t) => {
                if (document.hidden) t.pause();
                else t.play();
            });
        };
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            tweens.forEach((t) => t.kill());
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [motionReduced, variant]);

    if (variant === "hybrid-studio") {
        return (
            <div className={`ecd-collage-layer ecd-collage-layer--hybrid ${motionReduced ? "ecd-motion-reduce" : ""}`} aria-hidden="true">
                <HybridPhotoWall ids={photoSets.hybridWallIds} />
                <div className="ecd-hybrid-soft-veil" />
                <div className="ecd-hybrid-arc ecd-hybrid-arc--one" />
                <div className="ecd-hybrid-arc ecd-hybrid-arc--two" />
                <div className="ecd-hybrid-arc ecd-hybrid-arc--three" />
                <HybridPhotoCluster ids={photoSets.hybridLeftTopIds} positionClass="ecd-memory-cluster--left-top" rotations={[-9, -4, 3, 8]} />
                <HybridPhotoCluster ids={photoSets.hybridRightTopIds} positionClass="ecd-memory-cluster--right-top" rotations={[8, 4, -3, -7]} />
                <HybridPhotoCluster ids={photoSets.hybridLeftBottomIds} positionClass="ecd-memory-cluster--left-bottom" rotations={[-7, -3, 2, 6]} />
                <HybridPhotoCluster ids={photoSets.hybridRightBottomIds} positionClass="ecd-memory-cluster--right-bottom" rotations={[7, 3, -2, -6]} />
                <HybridPortraitRow ids={photoSets.hybridPortraitIds} />
            </div>
        );
    }

    return (
        <div ref={ref} className={`ecd-collage-layer ecd-collage-layer--filmstrip ${motionReduced ? "ecd-motion-reduce" : ""}`} aria-hidden="true">
            <PhotoMosaicBg ids={photoSets.bgIds} />
            <Filmstrip ids={photoSets.leftIds} side="left" />
            <Filmstrip ids={photoSets.rightIds} side="right" />
        </div>
    );
});

CheckinCollageLayer.displayName = "CheckinCollageLayer";
export default CheckinCollageLayer;
