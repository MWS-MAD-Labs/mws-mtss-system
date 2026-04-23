import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import HeroSection from "../components/ui/HeroSection";
import Footer from "../components/ui/Footer";
import InstallButton from "../components/ui/InstallButton";
import { consumePendingRedirect, getDefaultPostLoginPath } from "@/utils/authRedirect";
import {
  MWS_STUDENT_CARD_ASSET_IDS,
} from "@/data/mwsStudentsDesignAssets";
import "@/pages/styles/landing-minimal.css";

const CLD_BASE = "https://res.cloudinary.com/deldcwiji/image/upload";
const bgPhoto = (id, w = 1920, h = 1080) =>
  `${CLD_BASE}/c_fill,w_${w},h_${h},g_auto,f_auto,q_auto/${id}`;
// Cloudinary AI Background Removal — auto-removes background on the fly
const cutoutPhoto = (id, w = 480) =>
  `${CLD_BASE}/e_background_removal/c_scale,w_${w},f_auto,q_auto/${id}`;

/* ── Deterministic daily shuffle ── */
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
  const random = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

/* ── Minimal photo layer: 1 background + 2 cutout figures ── */
const MinimalPhotoLayer = memo(() => {
  const dayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const daySeed = useMemo(() => hashString(`landing-minimal:${dayKey}`), [dayKey]);

  const bgDeck = useMemo(
    () => seededShuffle(MWS_STUDENT_CARD_ASSET_IDS, daySeed + 11),
    [daySeed],
  );
  const cutoutDeck = useMemo(
    () => seededShuffle(MWS_STUDENT_CARD_ASSET_IDS, daySeed + 47),
    [daySeed],
  );

  const backgroundSrc = useMemo(() => bgPhoto(bgDeck[0], 1920, 1080), [bgDeck]);
  const cutoutLeftSrc = useMemo(() => cutoutPhoto(cutoutDeck[0], 480), [cutoutDeck]);
  const cutoutRightSrc = useMemo(() => cutoutPhoto(cutoutDeck[1], 480), [cutoutDeck]);

  const [leftLoaded, setLeftLoaded] = useState(false);
  const [rightLoaded, setRightLoaded] = useState(false);
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  // Kick off Cloudinary processing early — before React even attaches the <img> elements.
  // This warms the CDN cache so bg-removal is ready when the real <img> fires its request.
  useEffect(() => {
    const preload = (src) => { const img = new Image(); img.src = src; };
    preload(backgroundSrc);
    preload(cutoutLeftSrc);
    preload(cutoutRightSrc);
  }, [backgroundSrc, cutoutLeftSrc, cutoutRightSrc]);

  // Handle images that are already cached and fire `load` before React attaches onLoad
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
MinimalPhotoLayer.displayName = "MinimalPhotoLayer";

/* ── Landing Page ── */
const LandingPage = memo(function LandingPage() {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) return;
    const pendingRedirect = consumePendingRedirect();
    const fallbackPath = (user?.role || "").toLowerCase() === "student"
      ? "/profile"
      : getDefaultPostLoginPath(user);
    navigate(pendingRedirect || fallbackPath, { replace: true });
  }, [isAuthenticated, user, navigate]);

  return (
    <div ref={containerRef} className="lm-shell min-h-screen relative overflow-hidden">
      <title>MWS IntegraLearn - Premium Education Platform</title>

      <MinimalPhotoLayer />

      <div className="relative z-20">
        <HeroSection />
        <div data-aos="fade-up" data-aos-delay="120">
          <InstallButton />
        </div>
        <div data-aos="fade-up" data-aos-delay="160">
          <Footer />
        </div>
      </div>
    </div>
  );
});

LandingPage.displayName = "LandingPage";
export default LandingPage;
