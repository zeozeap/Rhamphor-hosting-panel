import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Server, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePanelSettings } from "@/contexts/PanelSettingsContext";
import ReCAPTCHA from "react-google-recaptcha";

export function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { settings } = usePanelSettings();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const recaptchaEnabled = settings.recaptchaEnabled === "true" && !!settings.recaptchaSiteKey;
  const primaryColor = settings.primaryColor || "#00BCD4";
  const logoUrl = settings.loginLogoUrl || settings.logoUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recaptchaEnabled && !captchaToken) {
      setError("Please complete the reCAPTCHA verification");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const userData = await login(loginValue, password);
      setLocation(userData?.role === "admin" ? "/" : "/my-servers");
    } catch (err: any) {
      setError(err?.message || "Invalid credentials");
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={
        settings.loginBg
          ? { backgroundImage: `url(${settings.loginBg})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: `radial-gradient(ellipse at 50% 0%, ${primaryColor}12 0%, transparent 60%), hsl(var(--background))` }
      }
    >
      {settings.loginBg && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: `radial-gradient(circle, ${primaryColor}, transparent 70%)` }} />
        <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: `radial-gradient(circle, ${primaryColor}, transparent 70%)` }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div
          className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl overflow-hidden"
          style={{ boxShadow: `0 0 60px ${primaryColor}15, 0 25px 50px rgba(0,0,0,0.5)` }}
        >
          <div className="px-8 pt-8 pb-0 text-center">
            {logoUrl ? (
              <img src={logoUrl} alt={settings.panelName} className="w-20 h-20 mx-auto mb-4 rounded-2xl object-contain" />
            ) : (
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center border"
                style={{ background: `${primaryColor}20`, borderColor: `${primaryColor}40`, boxShadow: `0 0 30px ${primaryColor}30` }}
              >
                <Server className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
            )}
            <h1 className="text-2xl font-bold mt-3">
              {settings.loginTitle || settings.panelName || "Welcome Back"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {settings.loginSubtitle || settings.panelTagline || "Sign in to your hosting account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Username or Email</label>
              <input
                type="text"
                value={loginValue}
                onChange={e => setLoginValue(e.target.value)}
                placeholder="admin"
                required
                autoFocus
                autoComplete="username"
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 pr-12 text-foreground focus:outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {recaptchaEnabled && settings.recaptchaSiteKey && (
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={settings.recaptchaSiteKey}
                  theme="dark"
                  onChange={token => setCaptchaToken(token)}
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading || (recaptchaEnabled && !captchaToken)}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-black"
              style={{ background: primaryColor, boxShadow: `0 0 20px ${primaryColor}40` }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : "Sign In"}
            </button>
          </form>

          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-muted-foreground/50">{settings.panelName} · v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
