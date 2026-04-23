import { useEffect } from "react";
import gsap from "gsap";
import { animate, stagger } from "animejs";
const supportsFinePointer = () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
};

const getDepth = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 12;
};

const useStaffCheckinAnimations = ({ containerRef, reduceMotion = false }) => {
    useEffect(() => {
        const container = containerRef?.current;
        if (!container) return undefined;

        const ctx = gsap.context(() => {
            const revealNodes = gsap.utils.toArray(".staff-reveal");

            if (revealNodes.length > 0) {
                gsap.set(revealNodes, { autoAlpha: 0, y: reduceMotion ? 8 : 22 });
                gsap.to(revealNodes, {
                    autoAlpha: 1,
                    y: 0,
                    duration: reduceMotion ? 0.36 : 0.66,
                    stagger: reduceMotion ? 0.03 : 0.08,
                    ease: "power2.out",
                    clearProps: "transform,opacity,visibility"
                });
            }

            if (!reduceMotion) {
                gsap.to(".staff-aura--left", {
                    xPercent: 7,
                    yPercent: -4,
                    duration: 9.4,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });
                gsap.to(".staff-aura--right", {
                    xPercent: -6,
                    yPercent: 5,
                    duration: 10.2,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });
            }
        }, container);

        let disposeParallax = () => {};

        if (!reduceMotion && supportsFinePointer()) {
            const shell = container.querySelector(".staff-checkin-shell");
            const layers = Array.from(container.querySelectorAll("[data-parallax-depth]"));

            if (shell && layers.length > 0) {
                const onPointerMove = (event) => {
                    const rect = shell.getBoundingClientRect();
                    const relX = (event.clientX - rect.left) / rect.width - 0.5;
                    const relY = (event.clientY - rect.top) / rect.height - 0.5;

                    layers.forEach((layer) => {
                        const depth = getDepth(layer.dataset.parallaxDepth);
                        gsap.to(layer, {
                            x: relX * depth,
                            y: relY * depth,
                            duration: 0.62,
                            ease: "power2.out",
                            overwrite: "auto"
                        });
                    });
                };

                const onPointerLeave = () => {
                    layers.forEach((layer) => {
                        gsap.to(layer, {
                            x: 0,
                            y: 0,
                            duration: 0.8,
                            ease: "power3.out",
                            overwrite: "auto"
                        });
                    });
                };

                shell.addEventListener("pointermove", onPointerMove, { passive: true });
                shell.addEventListener("pointerleave", onPointerLeave, { passive: true });

                disposeParallax = () => {
                    shell.removeEventListener("pointermove", onPointerMove);
                    shell.removeEventListener("pointerleave", onPointerLeave);
                };
            }
        }

        return () => {
            disposeParallax();
            ctx.revert();
        };
    }, [containerRef, reduceMotion]);

    useEffect(() => {
        const container = containerRef?.current;
        if (!container || reduceMotion) return undefined;

        const ambientChips = container.querySelectorAll(".staff-ambient-chip");
        const ambientDots = container.querySelectorAll(".staff-ambient-dot");
        const loops = [];

        if (ambientChips.length > 0) {
            loops.push(
                animate(ambientChips, {
                    translateY: [0, -6, 0],
                    scale: [1, 1.04, 1],
                    rotate: [0, 2, 0]
                }, {
                    duration: 2600,
                    delay: stagger(120),
                    ease: "inOutSine",
                    loop: true
                })
            );
        }

        if (ambientDots.length > 0) {
            loops.push(
                animate(ambientDots, {
                    scale: [1, 1.22, 1],
                    opacity: [0.36, 0.9, 0.36]
                }, {
                    duration: 2200,
                    delay: stagger(160, { start: 100 }),
                    ease: "inOutQuad",
                    loop: true
                })
            );
        }

        return () => {
            loops.forEach((loop) => loop?.pause?.());
        };
    }, [containerRef, reduceMotion]);
};

export default useStaffCheckinAnimations;
