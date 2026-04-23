import { memo } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, LogIn } from "lucide-react";

const HeroAuthCard = memo(({
  email, password, loading,
  onEmailChange, onPasswordChange,
  showPassword, onToggleShowPassword,
  onSubmitEmail, onGoogleSignIn,
}) => (
  <div className="relative rounded-3xl border border-border/40 bg-card/70 backdrop-blur-2xl shadow-2xl overflow-hidden">
    {/* CSS shine sweep */}
    <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent pointer-events-none z-20" style={{ animation: 'card-shine 3s ease-in-out 1.2s forwards', transform: 'translateX(-100%)' }} />
    {/* Top accent gradient */}
    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-gold to-primary" />

    <div className="relative z-10 p-6 md:p-8 space-y-5">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider mb-2">
          <LogIn className="w-3 h-3" /> Sign In
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Welcome Back</h2>
        <p className="text-xs text-foreground/55">Access your personalized learning dashboard</p>
      </div>

      {/* Google OAuth */}
      <button
        onClick={onGoogleSignIn}
        className="w-full group/btn relative overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/40 shadow-sm hover:shadow-lg hover:scale-[1.015] hover:-translate-y-px active:scale-[0.985] transition-all duration-300"
      >
        <div className="relative z-10 flex items-center justify-center gap-3 px-5 py-3.5">
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-sm font-semibold text-foreground">Continue with Google</span>
          <ArrowRight className="w-4 h-4 text-foreground/40 group-hover/btn:translate-x-1 group-hover/btn:text-primary transition-all duration-300" />
        </div>
        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/30" /></div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-wider"><span className="bg-card/70 backdrop-blur-sm px-3 text-foreground/40 font-medium">or sign in with email</span></div>
      </div>

      {/* Email form */}
      <form onSubmit={onSubmitEmail} className="space-y-3.5">
        <div>
          <label htmlFor="email" className="text-xs font-medium text-foreground/70 mb-1 block">Email</label>
          <input
            id="email" type="email" value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border/40 bg-background/50 text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all duration-200"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="text-xs font-medium text-foreground/70 mb-1 block">Password</label>
          <div className="relative">
            <input
              id="password" type={showPassword ? "text" : "password"}
              value={password} onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-border/40 bg-background/50 text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all duration-200"
              required
            />
            <button type="button" onClick={onToggleShowPassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/85 hover:from-primary/95 hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.015] active:scale-[0.985] transition-all duration-300"
        >
          <div className="relative z-10 flex items-center justify-center gap-2.5 px-5 py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <ArrowRight className="w-4 h-4 text-white" />}
            <span className="text-sm font-semibold text-white">{loading ? "Signing in..." : "Sign In"}</span>
          </div>
        </button>
      </form>

      <p className="text-[9px] md:text-[10px] text-center text-foreground/40 leading-relaxed">
        Secure authentication powered by Google OAuth & JWT.
        <br />By continuing, you agree to our Terms & Privacy Policy.
      </p>
    </div>
  </div>
));

HeroAuthCard.displayName = "HeroAuthCard";
export default HeroAuthCard;
