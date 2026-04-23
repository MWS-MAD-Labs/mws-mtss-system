import { memo, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../store/slices/authSlice";
import { useToast } from "../ui/use-toast";
import HeroAuthCard from "@/components/ui/HeroAuthCard";
import Logo from "./Millennia.webp";
import { Sparkles, ShieldCheck, Smartphone } from "lucide-react";
import { consumePendingRedirect, getDefaultPostLoginPath } from "@/utils/authRedirect";

const FEATURES = [
  { icon: '🧠', label: 'AI Emotional Wellness' },
  { icon: '📊', label: 'Real-time Analytics' },
  { icon: '💬', label: 'Smart AI Assistants' },
  { icon: '🛡️', label: 'MTSS Support' },
];

const TRUST = [
  { icon: ShieldCheck, text: 'Secure & Encrypted' },
  { icon: Sparkles, text: 'AI-Powered' },
  { icon: Smartphone, text: 'PWA Ready' },
];

const HeroSection = memo(() => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = useCallback(() => {
    const apiBase = import.meta.env.VITE_API_BASE || "/api/v1";
    const backendUrl = apiBase.replace(/\/api(?:\/v\d+)?\/?$/, "");
    window.location.href = `${backendUrl}/auth/google`;
  }, []);

  const handleEmailLogin = useCallback(async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Validation Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    try {
      const resultAction = await dispatch(loginUser({ email, password }));
      if (loginUser.fulfilled.match(resultAction)) {
        const redirectPath = consumePendingRedirect() || getDefaultPostLoginPath(resultAction.payload?.user);
        toast({ title: "Login Successful! 🎉", description: "Welcome back! Redirecting...", duration: 3000 });
        setEmail(""); setPassword("");
        setTimeout(() => navigate(redirectPath), 1000);
        return;
      }
      toast({ title: "Login Failed", description: resultAction.payload || "Invalid credentials. Please try again.", variant: "destructive" });
    } catch {
      toast({ title: "Login Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    }
  }, [dispatch, email, navigate, password, toast]);

  return (
    <section className="landing-pointer-shell relative min-h-screen flex items-center justify-center px-4 py-10 md:py-16">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left — Branding */}
        <div className="landing-gsap-left text-center lg:text-left space-y-6">
          <div className="landing-gsap-logo inline-block" data-landing-depth="12">
            <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary via-gold to-gold p-[2px] shadow-2xl">
              <div className="w-full h-full rounded-2xl md:rounded-3xl bg-card flex items-center justify-center overflow-hidden">
                <img src={Logo} alt="Millennia Logo" className="w-24 h-24 md:w-32 md:h-32 object-contain" loading="eager" fetchPriority="high" />
              </div>
              <div className="absolute -inset-1 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/30 via-gold/20 to-transparent blur-lg -z-10 animate-pulse" />
            </div>
          </div>

          <div>
            <h1 className="landing-gsap-title text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-primary via-gold to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient-shift_4s_ease-in-out_infinite]">
                MWS IntegraLearn
              </span>
            </h1>
            <p className="landing-gsap-copy mt-3 text-sm md:text-base lg:text-lg text-foreground/65 max-w-lg leading-relaxed">
              Your gateway to world-class integrated education. AI-powered emotional wellness, smart analytics, and personalized learning.
            </p>
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-2">
            {FEATURES.map((f, i) => (
              <span key={f.label} className="landing-anime-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-card/80 border border-border/40 text-foreground/80 backdrop-blur-sm shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-default"
                data-aos="zoom-in-up" data-aos-delay={90 + i * 70} data-aos-duration="580">
                <span className="text-sm">{f.icon}</span> {f.label}
              </span>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2">
            {TRUST.map((t, i) => (
              <div key={t.text} className="flex items-center gap-1.5 text-foreground/50 text-xs"
                data-aos="fade-up" data-aos-delay={180 + i * 80} data-aos-duration="580">
                <t.icon className="w-3.5 h-3.5" />
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Auth Card */}
        <div className="landing-gsap-card flex justify-center lg:justify-end" data-landing-depth="10">
          <div className="w-full max-w-md">
            <HeroAuthCard
              email={email}
              password={password}
              loading={loading}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              showPassword={showPassword}
              onToggleShowPassword={() => setShowPassword(p => !p)}
              onSubmitEmail={handleEmailLogin}
              onGoogleSignIn={handleGoogleSignIn}
            />
          </div>
        </div>
      </div>
    </section>
  );
});

HeroSection.displayName = "HeroSection";
export default HeroSection;
