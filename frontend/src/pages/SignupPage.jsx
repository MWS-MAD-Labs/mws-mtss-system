// src/pages/SignupPage.jsx
import React, { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Phone } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { isValidEmail } from "@/lib/utils";

export default function SignupPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const reduce = useReducedMotion();

    // form state
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    // animations
    const cardAnim = {
        initial: { opacity: 0, y: reduce ? 0 : 12 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.32 } },
    };

    // validators
    const isPhone = (v) => /^[0-9]{9,15}$/.test(v); // numeric only, 9–15 digits

    const canSubmit = () =>
        name.trim().length > 1 &&
        isPhone(phone) &&
        isValidEmail(email) &&
        password.length >= 8 &&
        password === confirm;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isPhone(phone)) {
            toast({ title: "Invalid phone number", description: "Use digits only (9–15)." });
            return;
        }
        if (!isValidEmail(email)) {
            toast({ title: "Invalid email", description: "Please check your email address." });
            return;
        }
        if (password.length < 8) {
            toast({ title: "Password too short", description: "Use at least 8 characters." });
            return;
        }
        if (password !== confirm) {
            toast({ title: "Passwords do not match", description: "Make sure password and confirm match." });
            return;
        }

        setLoading(true);

        try {
            toast({ title: "Account created", description: "Proceed to verification." });
            setTimeout(() => navigate("/verify"), 500);
        } catch (err) {
            toast({ title: "Failed to create account", description: "Please try again later.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatedPage>
            <Helmet>
                <title>Sign up — MWS IntegraLearn</title>
            </Helmet>

            <div className="min-h-dvh flex items-center justify-center px-4 py-10">
                <motion.div {...cardAnim} className="w-full max-w-md">
                    {/* header */}
                    <div className="mb-6 flex items-center gap-3">
                        <Link
                            to="/"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
                        >
                            &larr; Back
                        </Link>
                        <h1 className="flex-1 text-lg font-semibold text-foreground text-center">Buat Akun</h1>
                        <div className="w-6" aria-hidden />
                    </div>

                    {/* glass card */}
                    <div className="rounded-2xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl shadow-lg">
                        {/* avatar + tagline */}
                        <div className="mb-4 flex items-center gap-4">
                            <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center shadow-sm">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">Welcome aboard 👋</p>
                                <p className="text-xs text-muted-foreground">Fast & secure sign-up to get started</p>
                            </div>
                        </div>

                        {/* form */}
                        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                            {/* nama */}
                            <Field
                                label="Nama Lengkap"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Contoh: Budi Santoso"
                                icon={<User className="h-4 w-4" />}
                                required
                                sanitize="strong"
                            />

                            {/* phone */}
                            <Field
                                label="Nomor HP"
                                value={phone}
                                onChange={(e) => setPhone((e.target.value || "").replace(/\D/g, ""))}
                                placeholder="081234567890"
                                type="tel"
                                icon={<Phone className="h-4 w-4" />}
                                required
                                // keep custom digits-only logic; skip sanitizer here
                                sanitize={false}
                                inputMode="numeric"
                            />

                            {/* email */}
                            <Field
                                label="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@contoh.com"
                                type="email"
                                icon={<Mail className="h-4 w-4" />}
                                required
                                sanitize="strong"
                                inputMode="email"
                                autoComplete="email"
                            />

                            {/* password */}
                            <PasswordField
                                label="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                showPass={showPass}
                                setShowPass={setShowPass}
                                placeholder="Minimal 8 karakter"
                                sanitize="strong"
                            />

                            {/* confirm */}
                            <Field
                                label="Konfirmasi Password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Ketik ulang password"
                                type={showPass ? "text" : "password"}
                                required
                                sanitize="strong"
                            />

                            <div className="text-xs text-muted-foreground mt-2">
                                Dengan mendaftar Anda setuju ke{" "}
                                <Link to="/terms" className="text-accent hover:underline">
                                    Syarat & Ketentuan
                                </Link>{" "}
                                kami.
                            </div>

                            {/* submit */}
                            <Button
                                type="submit"
                                className="w-full rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-md hover:scale-[1.01] transition-all duration-320"
                                disabled={!canSubmit() || loading}
                            >
                                {loading ? (
                                    "Memproses..."
                                ) : (
                                    <span className="inline-flex items-center gap-2">
                                        Sign up
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                        </form>

                        {/* footer */}
                        <div className="mt-4 text-center text-xs text-muted-foreground">
                            Sudah punya akun?{" "}
                            <Link to="/" className="text-accent font-medium hover:underline">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatedPage>
    );
}

/* ---------- Reusable field components ---------- */
function Field({ label, icon, sanitize = "light", className = "", ...props }) {
    return (
        <div>
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <div className="mt-1 relative">
                <Input {...props} sanitize={sanitize} className={`pl-10 pr-3 ${className}`} />
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {icon}
                </div>
            </div>
        </div>
    );
}

function PasswordField({ label, value, onChange, showPass, setShowPass, placeholder, sanitize = "light" }) {
    return (
        <div>
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <div className="mt-1 relative">
                <Input
                    value={value}
                    onChange={onChange}
                    type={showPass ? "text" : "password"}
                    placeholder={placeholder}
                    className="pl-10 pr-10"
                    required
                    sanitize={sanitize}
                />
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                </div>
                <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded transition-colors duration-300"
                >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Gunakan kombinasi huruf, angka, & simbol untuk keamanan.</p>
        </div>
    );
}
