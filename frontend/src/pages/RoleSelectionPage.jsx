import { memo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, ArrowRight, BarChart3, ArrowLeft } from "lucide-react";
import { useSelector } from "react-redux";
import { getDefaultMtssRoute } from "@/utils/mtssAccess";
import { env } from "@/config/env";
import gsap from "gsap";
import "@/pages/styles/role-selection-humanistic.css";

/* Cloudinary base with auto-format & quality */
const CLD = "https://res.cloudinary.com/deldcwiji/image/upload";
const cld = (id, w = 300) => `${CLD}/c_scale,w_${w},f_auto,q_auto/${id}.png`;
const cldJpg = (id, w = 240) => `${CLD}/c_fill,w_${w},h_${Math.round(w * 1.25)},g_face,f_auto,q_auto/${id}.jpg`;
const RS_ENABLE_FRAMED_CARDS = true;
const HUB_SUPPORT_PATH = "/support-hub";

// Mirrors daily-checkin's own RoleSelectionPage.jsx goToHubSupport - this
// button means "go back to Hub's app launcher", not MTSS's own now-vestigial
// /mtss/support-hub route (that just self-redirects back into the MTSS
// dashboard, see SupportModeSelectionPage.jsx's own comment on why).
const goToHubSupport = () => {
  const hubBaseUrl = String(env.hubBaseUrl || "").trim().replace(/\/+$/, "");
  window.location.assign(hubBaseUrl ? `${hubBaseUrl}${HUB_SUPPORT_PATH}` : HUB_SUPPORT_PATH);
};

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
  return Number.isFinite(parsed) ? parsed : 12;
};

// Keyed by the exact routes getDefaultMtssRoute() can return (mtssAccess.js).
const MTSS_DASHBOARD_CARD_CONTENT = {
  "/mtss/observer": {
    title: "Observer Dashboard",
    desc: "Read-only view across every MTSS tier and case.",
    features: ["Org-wide case visibility", "Tier & intervention tracking", "No edit access", "Always up to date"],
  },
  "/mtss/admin": {
    title: "Admin Dashboard",
    desc: "Manage mentors, tiers, and MTSS configuration.",
    features: ["Mentor assignment", "Tier & case management", "Org-wide analytics", "System configuration"],
  },
  "/mtss/teacher": {
    title: "Teacher Dashboard",
    desc: "Track your students' support tiers and interventions.",
    features: ["Your assigned students", "Tier progress tracking", "Intervention logging", "Mentor notes"],
  },
};

/* Structured, human-centered collage for Select Role page */
const RS_BODY_CUTOUTS = [
  {
    id: "hero-left",
    className: "rs-body--hero-left",
    src: cld("FOTO_POTRAIT_4_toxvjw", 280),
    depth: 13,
    aos: "rs-natural-rise",
    delay: 60,
    duration: 840
  },
  {
    id: "hero-right",
    className: "rs-body--hero-right",
    src: cld("FOTO_BG_REMOVE_17_dh98bg", 280),
    depth: 13,
    aos: "rs-natural-drift",
    delay: 110,
    duration: 840
  },
  {
    id: "hero-bottom",
    className: "rs-body--hero-bottom",
    src: cld("FOTO_BG_REMOVE_1133_x_2000_px_73_jsv6a0", 430),
    depth: 8,
    aos: "rs-natural-rise",
    delay: 220,
    duration: 820
  },
];

const RS_LEFT_LANE_CARDS = [
  { id: "left-1", src: cldJpg("DSC01543_epizl3", 176), depth: 9, delay: 90, rotate: -6 },
  { id: "left-2", src: cldJpg("_DSC8750_fdmetn", 172), depth: 10, delay: 140, rotate: -2 },
  { id: "left-3", src: cldJpg("DSC02677_zgyz6w", 178), depth: 11, delay: 190, rotate: 3 },
  { id: "left-4", src: cldJpg("_DSC6603_sonkrm", 170), depth: 9, delay: 230, rotate: -4 },
];

const RS_RIGHT_LANE_CARDS = [
  { id: "right-1", src: cldJpg("DSC01621_nssiis", 176), depth: 9, delay: 120, rotate: 6 },
  { id: "right-2", src: cldJpg("_DSC5962_mym0e5", 170), depth: 10, delay: 170, rotate: 2 },
  { id: "right-3", src: cldJpg("DSC02730_k10pn3", 178), depth: 11, delay: 220, rotate: -3 },
  { id: "right-4", src: cldJpg("_DSC6346_rjpzcy", 172), depth: 9, delay: 270, rotate: 4 },
];

const RS_TOP_STRIP_CARDS = [
  { id: "top-1", src: cldJpg("DSC01079_tc6ttw", 150), depth: 8, delay: 130, rotate: -4 },
  { id: "top-2", src: cldJpg("_DSC5535_yuiqgh", 156), depth: 8, delay: 180, rotate: 3 },
  { id: "top-3", src: cldJpg("_DSC6603_sonkrm", 148), depth: 8, delay: 220, rotate: -2 },
];

const RS_COMMUNITY_CHIPS = [
  cldJpg("DSC01543_epizl3", 120),
  cldJpg("_DSC8750_fdmetn", 120),
  cldJpg("DSC02677_zgyz6w", 120),
  cldJpg("DSC01621_nssiis", 120),
  cldJpg("_DSC5962_mym0e5", 120),
  cldJpg("DSC02730_k10pn3", 120),
];

const RS_PHOTO_ACCENTS = [
  { id: "accent-left", className: "rs-photo-accent--left", depth: 8, aos: "rs-orb-pop", delay: 90, duration: 680 },
  { id: "accent-right", className: "rs-photo-accent--right", depth: 8, aos: "rs-orb-pop", delay: 150, duration: 700 },
  { id: "accent-center", className: "rs-photo-accent--center", depth: 7, aos: "rs-orb-pop", delay: 220, duration: 710 },
];

const RoleSelectionPhotoLayer = memo(() => (
  <div className="rs-photo-layer" aria-hidden="true">
    <div className="rs-white-canvas" />
    <div className="rs-photo-fabric" />

    <div className="rs-top-strip">
      {RS_TOP_STRIP_CARDS.map((item) => (
        <div
          key={item.id}
          className="rs-photo-card rs-photo-card--top"
          style={{ "--rs-card-rotate": `${item.rotate}deg` }}
          data-rs-depth={item.depth}
          data-aos="rs-card-pop"
          data-aos-delay={item.delay}
          data-aos-duration={740}
          data-aos-easing="ease-out-cubic"
        >
          <img src={item.src} alt="" className="rs-photo-card-img" loading="eager" decoding="async" />
        </div>
      ))}
    </div>

    {RS_ENABLE_FRAMED_CARDS && (
      <>
        <div className="rs-gallery-lane rs-gallery-lane--left">
          {RS_LEFT_LANE_CARDS.map((item) => (
            <div
              key={item.id}
              className="rs-photo-card rs-photo-card--lane"
              style={{ "--rs-card-rotate": `${item.rotate}deg` }}
              data-rs-depth={item.depth}
              data-aos="rs-card-pop"
              data-aos-delay={item.delay}
              data-aos-duration={760}
              data-aos-easing="ease-out-cubic"
            >
              <img src={item.src} alt="" className="rs-photo-card-img" loading="eager" decoding="async" />
            </div>
          ))}
        </div>

        <div className="rs-gallery-lane rs-gallery-lane--right">
          {RS_RIGHT_LANE_CARDS.map((item) => (
            <div
              key={item.id}
              className="rs-photo-card rs-photo-card--lane"
              style={{ "--rs-card-rotate": `${item.rotate}deg` }}
              data-rs-depth={item.depth}
              data-aos="rs-card-pop"
              data-aos-delay={item.delay}
              data-aos-duration={760}
              data-aos-easing="ease-out-cubic"
            >
              <img src={item.src} alt="" className="rs-photo-card-img" loading="eager" decoding="async" />
            </div>
          ))}
        </div>
      </>
    )}

    {RS_BODY_CUTOUTS.map((item) => (
      <div
        key={item.id}
        className={`rs-body-cutout ${item.className}`}
        data-rs-depth={item.depth}
        data-aos={item.aos}
        data-aos-delay={item.delay}
        data-aos-duration={item.duration}
        data-aos-easing="ease-out-cubic"
      >
        <img src={item.src} alt="" className="rs-body-cutout-img" loading="eager" decoding="async" />
      </div>
    ))}

    <div className="rs-community-row" data-rs-depth={7}>
      {RS_COMMUNITY_CHIPS.map((src, index) => (
        <div
          key={`rs-chip-${index}`}
          className="rs-avatar-chip"
          style={{ "--rs-chip-delay": `${index * 0.36}s` }}
        >
          <img src={src} alt="" loading="eager" decoding="async" />
        </div>
      ))}
    </div>

    {RS_PHOTO_ACCENTS.map((item) => (
      <div
        key={item.id}
        className={`rs-photo-accent ${item.className}`}
        data-rs-depth={item.depth}
        data-aos={item.aos}
        data-aos-delay={item.delay}
        data-aos-duration={item.duration || 700}
        data-aos-easing="ease-out-cubic"
      />
    ))}
  </div>
));
RoleSelectionPhotoLayer.displayName = "RoleSelectionPhotoLayer";

/* ── MethodCard ─────────────────────────────────────────── */
const MethodCard = memo(({ icon: Icon, title, desc, features, isPremium, onClick, onIntent, delay = 0 }) => (
  <button
    onMouseEnter={onIntent}
    onFocus={onIntent}
    onTouchStart={onIntent}
    onClick={onClick}
    className="rs-card group relative w-full text-left rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden hover:border-primary/30 active:scale-[0.985] transition-all duration-300"
    style={{ animation: `rs-card-in 0.5s cubic-bezier(.21,1.02,.73,1) ${delay}s both` }}
  >
    {/* Hover glow */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/[0.04] group-hover:to-transparent transition-all duration-500 pointer-events-none" />
    {/* Accent line */}
    {isPremium && <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-primary via-gold to-primary" />}

    <div className="relative z-10 p-4 sm:p-5 space-y-3">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 ${isPremium ? 'bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20' : 'bg-surface border border-border/50'}`}>
          <Icon className={`w-5 h-5 ${isPremium ? 'text-white' : 'text-primary'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-foreground">{title}</h3>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug mt-0.5">{desc}</p>
        </div>
        {isPremium && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0">
            <Sparkles className="w-2.5 h-2.5 text-primary" />
            <span className="text-[8px] font-bold text-primary uppercase tracking-wider">AI</span>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-2 text-[10px] sm:text-[11px]">
            <div className="w-1 h-1 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
            <span className="text-foreground/80 leading-snug">{feature}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/20">
        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">
          {isPremium ? 'Try it out' : 'Open'}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
      </div>
    </div>
  </button>
));

/* ── Main Component ─────────────────────────────────────── */
const RoleSelection = memo(() => {
  const navigate = useNavigate();
  const { user, loading } = useSelector((state) => state.auth);
  const pageRef = useRef(null);

  const mtssDashboardRoute = getDefaultMtssRoute(user);
  const mtssDashboardCard = mtssDashboardRoute ? MTSS_DASHBOARD_CARD_CONTENT[mtssDashboardRoute] : null;

  /* GSAP entrance */
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.rs-back-btn', { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4 })
        .fromTo('.rs-icon-box', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 }, '-=0.2')
        .fromTo('.rs-heading', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2')
        .fromTo('.rs-subtext', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, '-=0.15')
        .fromTo('.rs-trust', { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.06 }, '-=0.1');
    }, el);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return undefined;
    const reduceMotion = prefersReducedMotion();
    const isCompactViewport = typeof window !== "undefined"
      && typeof window.matchMedia === "function"
      && window.matchMedia("(max-width: 767px)").matches;
    const ambientEntryDelay = isCompactViewport ? 0.72 : 0.94;

    const ctx = gsap.context(() => {
      if (reduceMotion) return;

      gsap.to(".rs-white-canvas", {
        scale: 1.02,
        duration: 10.4,
        delay: ambientEntryDelay,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      const bodyCutouts = gsap.utils.toArray(".rs-body-cutout");
      const animatedBody = isCompactViewport ? bodyCutouts.slice(0, 3) : bodyCutouts;

      animatedBody.forEach((node, index) => {
        gsap.to(node, {
          y: index % 2 === 0 ? -7 : -5,
          x: index % 2 === 0 ? 4 : -4,
          duration: 6.2 + index * 0.5,
          delay: ambientEntryDelay + 0.14 + index * 0.08,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          force3D: true
        });
      });

      if (RS_ENABLE_FRAMED_CARDS) {
        const photoCards = gsap.utils.toArray(".rs-photo-card");
        const animatedCards = isCompactViewport ? photoCards.slice(0, 4) : photoCards.slice(0, 8);

        animatedCards.forEach((node, index) => {
          gsap.to(node, {
            y: index % 2 === 0 ? -5 : -4,
            x: index % 2 === 0 ? 3 : -3,
            rotation: index % 2 === 0 ? 1.5 : -1.5,
            duration: 5.6 + index * 0.4,
            delay: ambientEntryDelay + 0.2 + index * 0.06,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            force3D: true
          });
        });
      }

      const accents = gsap.utils.toArray(".rs-photo-accent");
      const animatedAccents = isCompactViewport ? accents.slice(0, 2) : accents;

      animatedAccents.forEach((node, index) => {
        gsap.to(node, {
          scale: 1.08,
          opacity: 0.72,
          duration: 4.8 + index * 0.4,
          delay: ambientEntryDelay + 0.26 + index * 0.06,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          force3D: true
        });
      });
    }, el);

    let removeParallax = () => { };
    if (!reduceMotion && supportsFinePointer()) {
      const shell = el.querySelector(".rs-pointer-shell") || el;
      const layers = Array.from(el.querySelectorAll("[data-rs-depth]"));

      if (shell && layers.length > 0) {
        const onMove = (event) => {
          const rect = shell.getBoundingClientRect();
          const ratioX = (event.clientX - rect.left) / rect.width - 0.5;
          const ratioY = (event.clientY - rect.top) / rect.height - 0.5;

          layers.forEach((layer) => {
            const depth = resolveDepth(layer.dataset.rsDepth);
            gsap.to(layer, {
              x: ratioX * depth,
              y: ratioY * depth,
              duration: 0.56,
              ease: "power2.out",
              overwrite: "auto"
            });
          });
        };

        const onLeave = () => {
          layers.forEach((layer) => {
            gsap.to(layer, {
              x: 0,
              y: 0,
              duration: 0.72,
              ease: "power3.out",
              overwrite: "auto"
            });
          });
        };

        shell.addEventListener("pointermove", onMove, { passive: true });
        shell.addEventListener("pointerleave", onLeave, { passive: true });
        removeParallax = () => {
          shell.removeEventListener("pointermove", onMove);
          shell.removeEventListener("pointerleave", onLeave);
        };
      }
    }

    return () => {
      removeParallax();
      ctx.revert();
    };
  }, []);

  // Same role list RouteConfig.jsx gates /mtss/pilot-testing with - reused
  // here for both the Support Hub button and the Pilot Testing card below.
  const hasSupportHubAccess = user && ['teacher', 'se_teacher', 'head_unit', 'directorate', 'admin', 'superadmin'].includes(user.role);
  const hasNoMtssAccess = user && !mtssDashboardRoute && !hasSupportHubAccess;

  return (
    <div ref={pageRef} className="rs-humanistic-shell rs-white-collage relative min-h-screen text-foreground overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <RoleSelectionPhotoLayer />
        <div className="absolute top-0 left-0 w-80 h-80 bg-primary/[0.06] rounded-full blur-3xl" style={{ animation: 'rs-blob 8s ease-in-out infinite' }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/[0.04] rounded-full blur-3xl" style={{ animation: 'rs-blob 10s ease-in-out 1s infinite' }} />
        <div className="rs-grid-overlay" />
      </div>

      {/* Back button — only shown for roles with Support Hub access */}
      {hasSupportHubAccess && (
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-4 md:left-[130px] z-30">
          <button onClick={goToHubSupport}
            className="rs-back-btn inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-primary bg-card/80 border border-border/40 shadow-md backdrop-blur-xl hover:shadow-lg hover:border-primary/30 active:scale-95 transition-all duration-200">
            <ArrowLeft className="w-3.5 h-3.5" /> Support Hub
          </button>
        </div>
      )}

      {/* Content */}
      <div className="rs-pointer-shell relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl">

          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="rs-icon-box w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 mb-3 sm:mb-4" style={{ animation: 'rs-float 3s ease-in-out 1s infinite alternate' }}>
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h1 className="rs-heading text-xl sm:text-2xl font-bold text-foreground mb-1.5">
              MTSS Home
            </h1>
            <p className="rs-subtext text-[10px] sm:text-xs text-muted-foreground max-w-md mx-auto leading-relaxed px-2">
              Jump straight into your dashboard, or explore other MTSS tools below.
            </p>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {mtssDashboardCard && (
              <MethodCard icon={BarChart3} title={mtssDashboardCard.title}
                desc={mtssDashboardCard.desc} features={mtssDashboardCard.features}
                isPremium={false} onClick={() => navigate(mtssDashboardRoute)} delay={0.35} />
            )}

            {hasSupportHubAccess && (
              <MethodCard icon={Sparkles} title="Pilot Testing Hub"
                desc="Try upcoming MTSS features before they roll out org-wide."
                features={["Early access to new tools", "Feedback shapes the rollout", "Opt-in, no commitment", "Same login, no extra setup"]}
                isPremium={true} onClick={() => navigate('/mtss/pilot-testing')} delay={0.45} />
            )}

            {(user && ['directorate', 'admin', 'superadmin'].includes(user.role)) && (
              <MethodCard icon={BarChart3} title="User Management"
                desc="Manage users, roles, and organizational structure"
                features={["User account management", "Role and permission settings", "Organizational hierarchy", "Advanced user analytics"]}
                isPremium={false} onClick={() => navigate('/mtss/user-management')} delay={0.55} />
            )}

            {hasNoMtssAccess && (
              <div className="rounded-xl border border-border/30 bg-card/40 p-3 text-center" style={{ animation: 'rs-card-in 0.5s ease-out 0.65s both' }}>
                <p className="text-[10px] text-muted-foreground">You don't have access to any MTSS dashboard yet.</p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">Use the Support Hub button above to go back to Hub, or contact your administrator.</p>
              </div>
            )}

            {loading && (
              <div className="rounded-xl border border-border/30 bg-card/40 p-4 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground">Loading user data...</p>
              </div>
            )}

            {!loading && !user && (
              <div className="rounded-xl border border-border/30 bg-card/40 p-4 text-center">
                <p className="text-[10px] text-muted-foreground">No user data available. Please try logging in again.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 sm:mt-8 rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm p-3" style={{ animation: 'rs-card-in 0.5s ease-out 0.8s both' }}>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed text-center">
              What you see here reflects your current MTSS role and access level.
            </p>
          </div>
          <p className="mt-3 text-center text-[8px] text-muted-foreground/50" style={{ animation: 'rs-card-in 0.4s ease-out 0.9s both' }}>
            Millennia World School • MTSS Support Platform
          </p>
        </div>
      </div>

      <style>{`
        @keyframes rs-card-in {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes rs-blob {
          0%, 100% { transform: scale(1); opacity: 0.04; }
          50% { transform: scale(1.06); opacity: 0.07; }
        }
        @keyframes rs-float {
          from { transform: translateY(0); }
          to { transform: translateY(-6px); }
        }
        .rs-card { transition: transform 0.25s ease, border-color 0.3s ease, box-shadow 0.3s ease; }
        .rs-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.06); }
      `}</style>
    </div>
  );
});

RoleSelection.displayName = 'RoleSelection';
export default RoleSelection;
