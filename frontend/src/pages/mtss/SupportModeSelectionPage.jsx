import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Brain, Handshake, ArrowRight, Sparkles, Shield, Users } from "lucide-react";
import Logo from "../../components/ui/Millennia.webp";
import gsap from "gsap";
import { MWS_STUDENT_CARD_ASSET_IDS } from "@/data/mwsStudentsDesignAssets";
import { getDefaultMtssRoute, getMtssAccessProfile } from "@/utils/mtssAccess";
import "@/pages/styles/landing-minimal.css";

/* Cloudinary helpers */
const CLD = "https://res.cloudinary.com/deldcwiji/image/upload";
const bgPhoto = (id, w = 1920, h = 1080) =>
  `${CLD}/c_fill,w_${w},h_${h},g_auto,f_auto,q_auto/${id}`;
const cutoutPhoto = (id, w = 480) =>
  `${CLD}/e_background_removal/c_scale,w_${w},f_auto,q_auto/${id}`;

/* Deterministic daily shuffle (same as landing page) */
const hashString = (value = "") => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const seededShuffle = (items, seedBase = 1) => {
  const next = [...items];
  let seed = (Math.abs(seedBase) % 2147483647) || 1;
  const random = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

/* Minimal photo layer: 1 background + 2 cutout figures */
const SupportHubPhotoLayer = memo(() => {
  const dayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const daySeed = useMemo(() => hashString(`support-hub-minimal:${dayKey}`), [dayKey]);

  const bgDeck = useMemo(() => seededShuffle(MWS_STUDENT_CARD_ASSET_IDS, daySeed + 23), [daySeed]);
  const cutoutDeck = useMemo(() => seededShuffle(MWS_STUDENT_CARD_ASSET_IDS, daySeed + 61), [daySeed]);

  const backgroundSrc = useMemo(() => bgPhoto(bgDeck[0], 1920, 1080), [bgDeck]);
  const cutoutLeftSrc = useMemo(() => cutoutPhoto(cutoutDeck[0], 480), [cutoutDeck]);
  const cutoutRightSrc = useMemo(() => cutoutPhoto(cutoutDeck[1], 480), [cutoutDeck]);

  const [leftLoaded, setLeftLoaded] = useState(false);
  const [rightLoaded, setRightLoaded] = useState(false);
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  // Warm up Cloudinary CDN — kick off bg-removal processing before <img> mounts
  useEffect(() => {
    const preload = (src) => { const img = new Image(); img.src = src; };
    preload(backgroundSrc);
    preload(cutoutLeftSrc);
    preload(cutoutRightSrc);
  }, [backgroundSrc, cutoutLeftSrc, cutoutRightSrc]);

  // Handle images already in browser cache (onLoad fires before React attaches handler)
  useEffect(() => {
    if (leftRef.current?.complete) setLeftLoaded(true);
    if (rightRef.current?.complete) setRightLoaded(true);
  }, []);

  const handleLeftError = useCallback((e) => {
    const img = e.currentTarget;
    if (img.dataset.fb === "1") { setLeftLoaded(true); return; }
    img.dataset.fb = "1";
    img.src = img.src.replace("e_background_removal/", "");
  }, []);

  const handleRightError = useCallback((e) => {
    const img = e.currentTarget;
    if (img.dataset.fb === "1") { setRightLoaded(true); return; }
    img.dataset.fb = "1";
    img.src = img.src.replace("e_background_removal/", "");
  }, []);

  return (
    <div className="lm-photo-layer" aria-hidden="true">
      <div className="lm-bg" style={{ backgroundImage: `url(${backgroundSrc})` }} />
      <div className="lm-bg-overlay" />
      <figure className="lm-cutout lm-cutout--left">
        <img
          ref={leftRef}
          src={cutoutLeftSrc}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className={leftLoaded ? "lm-img--loaded" : ""}
          onLoad={() => setLeftLoaded(true)}
          onError={handleLeftError}
        />
      </figure>
      <figure className="lm-cutout lm-cutout--right">
        <img
          ref={rightRef}
          src={cutoutRightSrc}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className={rightLoaded ? "lm-img--loaded" : ""}
          onLoad={() => setRightLoaded(true)}
          onError={handleRightError}
        />
      </figure>
    </div>
  );
});
SupportHubPhotoLayer.displayName = "SupportHubPhotoLayer";

/* ── Card config ────────────────────────────────────────── */
const CARDS = [
  {
    id: "mtss",
    title: "MTSS",
    subtitle: "Multi-Tiered System of Support",
    desc: "Tiered interventions, data-driven insights, and mentor collaboration — keeping every learner on track.",
    icon: Brain,
    badge: "For Teachers & Mentors",
    emoji: "🎯",
    gradient: "linear-gradient(135deg, #ff4ec6 0%, #ff7ad9 35%, #ffb347 100%)",
    glowColor: "rgba(255,78,198,0.25)",
    ctaColor: "text-rose-600",
    features: ["Tier tracking", "Mentor tools", "Data dashboards"],
  },
  {
    id: "checkin",
    title: "Emotional Check-in",
    subtitle: "Wellness & Mood Monitoring",
    desc: "Quick mood checks, AI facial analysis, and real-time alerts to caregivers — because feelings matter.",
    icon: Handshake,
    badge: "For Everyone",
    emoji: "💌",
    gradient: "linear-gradient(135deg, #7dd3fc 0%, #60a5fa 30%, #a7f3d0 100%)",
    glowColor: "rgba(96,165,250,0.25)",
    ctaColor: "text-sky-600",
    features: ["Mood tracking", "AI analysis", "Instant alerts"],
  },
];

const TRUST_ITEMS = [
  { icon: Shield, text: "Safe & Secure" },
  { icon: Sparkles, text: "AI-Powered" },
  { icon: Users, text: "Built for Schools" },
];

/* ── OptionCard ─────────────────────────────────────────── */
const OptionCard = memo(({ card, onClick, index }) => (
  <button
    onClick={onClick}
    className="smsp-card group relative w-full overflow-hidden text-left border border-white/40 dark:border-white/10 backdrop-blur-[18px] shadow-2xl hover:shadow-3xl rounded-2xl sm:rounded-[2rem]"
    style={{
      background: card.gradient,
      animation: `smsp-card-in 0.6s cubic-bezier(.21,1.02,.73,1) ${0.4 + index * 0.15}s both`,
    }}
  >
    {/* Glass overlay */}
    <div className="absolute inset-0 bg-white/30 dark:bg-black/25 pointer-events-none" />
    {/* Hover glow */}
    <div className="absolute -right-14 -bottom-10 w-56 h-56 bg-white/0 group-hover:bg-white/40 dark:group-hover:bg-white/10 blur-[120px] transition-all duration-700 pointer-events-none" />

    <div className="relative z-10 p-5 sm:p-9 space-y-3 sm:space-y-5">
      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:gap-2 sm:px-3 sm:py-1.5 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-xl border border-white/50 dark:border-white/15 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em]">
        {card.emoji && <span className="text-sm sm:text-base">{card.emoji}</span>}
        <card.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span>{card.badge}</span>
      </div>

      {/* Title */}
      <div>
        <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-lg">{card.title}</h3>
        <p className="text-[10px] sm:text-xs font-semibold text-white/70 uppercase tracking-wider mt-0.5 sm:mt-1">{card.subtitle}</p>
      </div>

      {/* Description */}
      <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-sm">{card.desc}</p>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {card.features.map(f => (
          <span key={f} className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-white/25 dark:bg-white/10 text-white/90 backdrop-blur-sm border border-white/20">{f}</span>
        ))}
      </div>

      {/* CTA */}
      <div className="pt-1 sm:pt-2">
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider bg-white/95 dark:bg-white/90 border border-white/70 shadow-lg group-hover:shadow-xl ${card.ctaColor} transition-all duration-300`}>
          Start now
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </div>

    {/* Card hover scale */}
    <style>{`
      .smsp-card { transition: transform 0.35s cubic-bezier(.21,1.02,.73,1), box-shadow 0.35s ease; }
      .smsp-card:hover { transform: translateY(-6px) scale(1.01); }
      .smsp-card:active { transform: scale(0.985); }
    `}</style>
  </button>
));
OptionCard.displayName = "OptionCard";

/* ── Main Page ──────────────────────────────────────────── */
const SupportModeSelectionPage = memo(() => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const pageRef = useRef(null);

  /* GSAP entrance timeline */
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.smsp-logo-wrap', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 })
        .fromTo('.smsp-heading', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.2')
        .fromTo('.smsp-sub', { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2')
        .fromTo('.smsp-trust', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.08 }, '-=0.1');
    }, el);
    return () => ctx.revert();
  }, []);

  const canAccessPilotHub = useMemo(() => {
    const profile = getMtssAccessProfile(user);
    return profile.hasAccess && (profile.canAccessAdmin || profile.accessLevel === "observer");
  }, [user]);

  const handleMtssClick = useCallback(() => {
    if (!getMtssAccessProfile(user).hasAccess) {
      navigate('/select-role');
      return;
    }

    const nextRoute = getDefaultMtssRoute(user) || '/select-role';
    navigate(nextRoute);
  }, [navigate, user]);

  return (
    <div ref={pageRef} className="lm-shell min-h-screen relative overflow-hidden text-foreground dark:text-white transition-colors">
      <SupportHubPhotoLayer />

      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 left-0 w-72 h-72 bg-[#ffaae4]/40 blur-[160px] animate-blob-left" />
        <div className="absolute top-16 right-4 w-72 h-72 bg-[#8be8ff]/40 blur-[150px] animate-blob-right" />
        <div className="absolute bottom-16 left-1/3 w-80 h-80 bg-[#c4f1be]/35 blur-[150px]" />
        {/* Floating orb */}
        <div className="absolute top-12 right-1/3 w-10 h-10 rounded-full bg-white/50 dark:bg-white/20" style={{ animation: 'smsp-orb 6s ease-in-out infinite' }} />
      </div>

      <div className="relative z-20 container-tight py-10 sm:py-14 lg:py-20">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 sm:space-y-5 mb-8 sm:mb-12">
          {/* Logo badge */}
          <div className="smsp-logo-wrap inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl shadow-lg">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#ff80b5] via-[#ffb553] to-[#7dd3fc] p-[2px] flex items-center justify-center">
              <span className="w-full h-full rounded-2xl bg-white/90 dark:bg-white/5 flex items-center justify-center">
                <img src={Logo} alt="MWS Logo" className="w-7 h-7 object-contain" loading="lazy" />
              </span>
            </span>
            <div className="text-left">
              <span className="text-[0.6rem] font-black tracking-[0.5em] uppercase text-rose-500 block">MWS</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-white/80">Support Playlab</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="smsp-heading text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f97316] via-[#ec4899] to-[#7c3aed] dark:from-[#fdba74] dark:via-[#f9a8d4] dark:to-[#c4b5fd]">
              Choose a Support Journey
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff58c2] via-[#ffb347] to-[#7dd3fc]">
              for Our Kids
            </span>
          </h1>
          {/* Trust indicators */}
          <div className="smsp-sub flex flex-wrap justify-center gap-4 pt-1">
            {TRUST_ITEMS.map(t => (
              <div key={t.text} className="smsp-trust flex items-center gap-1.5 text-foreground/45 dark:text-white/40 text-xs">
                <t.icon className="w-3.5 h-3.5" />
                <span className="font-medium">{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto px-1 sm:px-0">
          {CARDS.map((card, i) => (
            <OptionCard
              key={card.id}
              card={card}
              index={i}
              onClick={card.id === 'mtss' ? handleMtssClick : () => navigate('/select-role')}
            />
          ))}
        </div>

        {/* Footer hint */}
        <div className="mt-10 space-y-4">
          {canAccessPilotHub && (
            <div className="mx-auto max-w-3xl rounded-[28px] border border-white/40 bg-white/80 p-5 text-left shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500 dark:text-white/55">Pilot testing</p>
                  <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                    Run the MTSS principal pilot with a guided checklist and built-in feedback
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/mtss/pilot-testing')}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f97316] via-[#ec4899] to-[#6366f1] px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5"
                >
                  Open Testing Hub
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-[10px] text-foreground/30 dark:text-white/20 font-medium" style={{ animation: 'smsp-fade-in 0.5s ease-out 1.2s both' }}>
            Millennia World School — Empowering every learner
          </p>
        </div>
      </div>

      <style>{`
        @keyframes smsp-card-in {
          from { transform: translateY(40px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes smsp-orb {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(20deg); }
        }
        @keyframes smsp-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
});

SupportModeSelectionPage.displayName = "SupportModeSelectionPage";
export default SupportModeSelectionPage;
