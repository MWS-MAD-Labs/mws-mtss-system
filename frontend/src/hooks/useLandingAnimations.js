import { useEffect } from "react";

const supportsFinePointer = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
};

const prefersReducedMotion = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

const resolveDepth = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 14;
};

const resolveMotionIntensity = (variant) => {
  if (variant === "bold") return 1.16;
  if (variant === "hybrid") return 1.04;
  if (variant === "clean") return 0.88;
  return 0.94;
};

const useLandingAnimations = ({ containerRef, variant = "clean" }) => {
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || typeof window === "undefined") return undefined;

    let disposed = false;
    let cleanup = () => {};
    const motionIntensity = resolveMotionIntensity(variant);
    const isHybrid = variant === "hybrid";
    const isBold = variant === "bold";

    const init = async () => {
      const shouldReduceMotion = prefersReducedMotion();

      const [gsapModule, animeModule] = await Promise.all([
        import("gsap"),
        import("animejs")
      ]);

      if (disposed) return;

      const gsap = gsapModule?.default || gsapModule?.gsap || gsapModule;
      const animate = animeModule?.animate || animeModule?.default?.animate;
      const stagger = animeModule?.stagger || animeModule?.default?.stagger;
      const animeLoops = [];
      let removeParallax = () => {};

      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.55 } });

        tl.addLabel("scene-start", 0);

        tl.from(".landing-photo-bg--primary", {
          autoAlpha: 0,
          scale: isHybrid ? 1.2 : 1.16,
          duration: isHybrid ? 1.04 : 0.88,
          ease: "power2.out"
        }, "scene-start");

        tl.from(".landing-photo-bg--secondary", {
          autoAlpha: 0,
          xPercent: isHybrid ? 10 : 7,
          scale: isHybrid ? 1.22 : 1.18,
          duration: isHybrid ? 1.12 : 0.94,
          ease: "power2.out"
        }, "scene-start+=0.02");

        tl.from(".landing-photo-veil", {
          autoAlpha: 0,
          duration: 0.74,
          ease: "sine.out"
        }, "scene-start+=0.08");

        tl.from(".landing-photo-mesh", {
          autoAlpha: 0,
          scale: 1.04,
          duration: 0.8,
          ease: "sine.out"
        }, "scene-start+=0.12");

        tl.fromTo(".landing-gsap-logo",
          { autoAlpha: 0, y: 26 * motionIntensity, scale: 0.84 },
          { autoAlpha: 1, y: 0, scale: 1, duration: isBold ? 0.72 : 0.62 },
          "scene-start+=0.16"
        );

        tl.fromTo(".landing-gsap-title",
          { autoAlpha: 0, y: 22 * motionIntensity },
          { autoAlpha: 1, y: 0, duration: isBold ? 0.58 : 0.52 },
          "scene-start+=0.28"
        );

        tl.fromTo(".landing-gsap-copy",
          { autoAlpha: 0, y: 18 * motionIntensity },
          { autoAlpha: 1, y: 0, duration: isBold ? 0.48 : 0.42 },
          "scene-start+=0.34"
        );

        tl.fromTo(".landing-gsap-card",
          { autoAlpha: 0, x: 30, scale: 0.97 },
          { autoAlpha: 1, x: 0, scale: 1, duration: isBold ? 0.64 : 0.55 },
          "scene-start+=0.24"
        );

        if (!shouldReduceMotion) {
          gsap.to(".landing-photo-bg--primary", {
            scale: isBold ? 1.12 : (isHybrid ? 1.1 : 1.08),
            xPercent: isHybrid ? -1.6 : -1.1,
            yPercent: isHybrid ? 1.2 : 0.8,
            duration: isBold ? 7.4 : 8.4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });

          gsap.to(".landing-photo-bg--secondary", {
            xPercent: isHybrid ? 2.2 : 1.7,
            yPercent: isHybrid ? -1.5 : -1,
            scale: isBold ? 1.17 : 1.14,
            duration: isBold ? 8.2 : 9.3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });

          gsap.to(".landing-photo-halo", {
            scale: isHybrid ? 1.1 : 1.07,
            opacity: isHybrid ? 0.62 : 0.56,
            duration: isBold ? 3.8 : 4.6,
            stagger: { each: 0.26, from: "random" },
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
        }
      }, container);

      if (!shouldReduceMotion && supportsFinePointer()) {
        const shell = container.querySelector(".landing-pointer-shell") || container;
        const layers = Array.from(container.querySelectorAll("[data-landing-depth]"));

        if (layers.length > 0 && shell) {
          const movers = layers.map((layer) => ({
            x: gsap.quickTo(layer, "x", {
              duration: isHybrid ? 0.5 : 0.56,
              ease: "power2.out",
              overwrite: "auto"
            }),
            y: gsap.quickTo(layer, "y", {
              duration: isHybrid ? 0.5 : 0.56,
              ease: "power2.out",
              overwrite: "auto"
            }),
            depth: resolveDepth(layer.dataset.landingDepth),
          }));

          const onPointerMove = (event) => {
            const rect = shell.getBoundingClientRect();
            const xRatio = (event.clientX - rect.left) / rect.width - 0.5;
            const yRatio = (event.clientY - rect.top) / rect.height - 0.5;

            movers.forEach((item) => {
              item.x(xRatio * item.depth * motionIntensity);
              item.y(yRatio * item.depth * motionIntensity);
            });
          };

          const onPointerLeave = () => {
            movers.forEach((item) => {
              item.x(0);
              item.y(0);
            });
          };

          shell.addEventListener("pointermove", onPointerMove, { passive: true });
          shell.addEventListener("pointerleave", onPointerLeave, { passive: true });
          removeParallax = () => {
            shell.removeEventListener("pointermove", onPointerMove);
            shell.removeEventListener("pointerleave", onPointerLeave);
          };
        }
      }

      if (!shouldReduceMotion && typeof animate === "function" && typeof stagger === "function") {
        const chips = container.querySelectorAll(".landing-anime-chip");
        const dots = container.querySelectorAll(".landing-anime-dot");
        const orbs = container.querySelectorAll(".landing-anime-orb:not(.landing-photo-halo)");
        const frameMedia = container.querySelectorAll(".landing-anime-frame-media");

        if (chips.length > 0) {
          animeLoops.push(
            animate(chips, {
              translateY: [0, -4, 0],
              scale: isBold ? [1, 1.06, 1] : [1, 1.03, 1]
            }, {
              duration: isBold ? 2400 : 2800,
              delay: stagger(90),
              ease: "inOutSine",
              loop: true
            })
          );
        }

        if (dots.length > 0) {
          animeLoops.push(
            animate(dots, {
              translateY: [0, -12 * motionIntensity, 8 * motionIntensity, 0],
              translateX: [0, 8 * motionIntensity, -6 * motionIntensity, 0],
              opacity: isBold ? [0.16, 0.42, 0.2] : [0.12, 0.32, 0.15],
              scale: isBold ? [0.86, 1.2, 0.94] : [0.85, 1.12, 0.9]
            }, {
              duration: isBold ? 4200 : 5000,
              delay: stagger(140, { start: 120 }),
              ease: "inOutSine",
              loop: true
            })
          );
        }

        if (orbs.length > 0) {
          animeLoops.push(
            animate(orbs, {
              translateY: [0, -8 * motionIntensity, 0],
              scale: isBold ? [1, 1.14, 1] : [1, 1.08, 1],
              opacity: isBold ? [0.5, 0.78, 0.5] : [0.4, 0.62, 0.4]
            }, {
              duration: isBold ? 4700 : 5400,
              delay: stagger(200, { start: 140 }),
              ease: "inOutSine",
              loop: true
            })
          );
        }

        if (frameMedia.length > 0) {
          animeLoops.push(
            animate(frameMedia, {
              scale: [1.03, 1.08, 1.03],
              translateY: [0, -3.2 * motionIntensity, 1.2 * motionIntensity, 0],
              rotate: [0, -0.5, 0.4, 0],
            }, {
              duration: isHybrid ? 4300 : (isBold ? 3900 : 4600),
              delay: stagger(120, { start: 90 }),
              ease: "inOutSine",
              loop: true,
            })
          );
        }
      }

      cleanup = () => {
        removeParallax();
        animeLoops.forEach((loop) => loop?.pause?.());
        ctx.revert();
      };
    };

    let cancelInit = () => {};
    const run = () => {
      init().catch(() => {});
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(run, { timeout: 1200 });
      cancelInit = () => window.cancelIdleCallback?.(idleId);
    } else {
      const timeoutId = window.setTimeout(run, 140);
      cancelInit = () => window.clearTimeout(timeoutId);
    }

    return () => {
      disposed = true;
      cancelInit();
      cleanup();
    };
  }, [containerRef, variant]);
};

export default useLandingAnimations;
