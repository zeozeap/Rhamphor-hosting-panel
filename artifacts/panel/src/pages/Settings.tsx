import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { usePanelSettings } from "@/contexts/PanelSettingsContext";
import { useUpdateProfile, useListNodes, useListServers } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Shield, HardDrive, Server as ServerIcon, Palette, Lock, Globe, Image } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional().or(z.literal(""))
});
type ProfileForm = z.infer<typeof profileSchema>;

const THEME_PRESETS = [
  { name: "Cyan (Default)", color: "#00BCD4" },
  { name: "Purple", color: "#7C3AED" },
  { name: "Emerald", color: "#10B981" },
  { name: "Rose", color: "#F43F5E" },
  { name: "Orange", color: "#F97316" },
  { name: "Blue", color: "#3B82F6" },
  { name: "Yellow", color: "#EAB308" },
  { name: "Pink", color: "#EC4899" },
];

function InputRow({ label, value, onChange, placeholder, type = "text", helper }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; helper?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-input border border-border rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
      />
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

export function Settings() {
  const { user } = useAuth();
  const { settings, reload } = usePanelSettings();
  const { data: nodes } = useListNodes();
  const { data: servers } = useListServers();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"account" | "personalization" | "security">("account");
  const [saving, setSaving] = useState(false);

  const [panelSettings, setPanelSettings] = useState(() => ({
    panelName: settings.panelName,
    panelTagline: settings.panelTagline,
    primaryColor: settings.primaryColor,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    loginBg: settings.loginBg,
    loginTitle: settings.loginTitle,
    loginSubtitle: settings.loginSubtitle,
    loginLogoUrl: settings.loginLogoUrl,
    recaptchaEnabled: settings.recaptchaEnabled,
    recaptchaSiteKey: settings.recaptchaSiteKey,
    recaptchaSecretKey: "",
    customCss: settings.customCss,
  }));

  const { mutate: updateProfile, isPending } = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        toast.success("Profile updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      },
      onError: (err: any) => toast.error("Failed to update profile: " + (err?.error || "Unknown error"))
    }
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: user?.username || "", email: user?.email || "", password: "" }
  });

  const onProfileSubmit = (data: ProfileForm) => {
    const payload: any = {};
    if (data.username && data.username !== user?.username) payload.username = data.username;
    if (data.email && data.email !== user?.email) payload.email = data.email;
    if (data.password) payload.password = data.password;
    if (Object.keys(payload).length > 0) updateProfile({ data: payload });
  };

  const savePersonalization = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(panelSettings)
      });
      if (r.ok) {
        toast.success("Personalization saved!");
        reload();
      } else {
        toast.error("Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  };

  const setProp = (key: string) => (val: string) => setPanelSettings(p => ({ ...p, [key]: val }));

  const tabs = [
    { id: "account", label: "Account", icon: User },
    ...(user?.role === "admin" ? [{ id: "personalization", label: "Personalization", icon: Palette }, { id: "security", label: "Security", icon: Lock }] : []),
  ] as const;

  return (
    <Layout title="Settings">
      <div className="space-y-6">
        <div className="flex gap-1 border-b border-border">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {tab === "account" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Account Settings</h2>
                </div>
                <form onSubmit={handleSubmit(onProfileSubmit)} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username</label>
                      <input {...register("username")} className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                      {errors.username && <p className="text-destructive text-sm">{errors.username.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <input type="email" {...register("email")} className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                      {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">New Password (leave blank to keep current)</label>
                      <input type="password" {...register("password")} placeholder="••••••••" className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                      {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={isPending} className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50">
                      {isPending ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Panel Information</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-muted-foreground text-sm">Version</span>
                    <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded text-sm">v1.0.0</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-purple-400">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Active Nodes</p>
                      <p className="text-2xl font-bold">{nodes?.length || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-blue-400">
                      <ServerIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Servers</p>
                      <p className="text-2xl font-bold">{servers?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "personalization" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center gap-3">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Panel Branding</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputRow label="Panel Name" value={panelSettings.panelName} onChange={setProp("panelName")} placeholder="VortexPanel" />
                <InputRow label="Panel Tagline" value={panelSettings.panelTagline} onChange={setProp("panelTagline")} placeholder="Minecraft Hosting Platform" />
                <InputRow label="Logo URL" value={panelSettings.logoUrl} onChange={setProp("logoUrl")} placeholder="https://example.com/logo.png" helper="Shown in the sidebar header" />
                <InputRow label="Favicon URL" value={panelSettings.faviconUrl} onChange={setProp("faviconUrl")} placeholder="https://example.com/favicon.ico" helper="Browser tab icon" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center gap-3">
                <Palette className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Theme Color</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {THEME_PRESETS.map(({ name, color }) => (
                    <button
                      key={color}
                      onClick={() => setProp("primaryColor")(color)}
                      title={name}
                      className={cn("w-full aspect-square rounded-xl border-2 transition-all hover:scale-110", panelSettings.primaryColor === color ? "border-white shadow-lg scale-110" : "border-transparent hover:border-white/30")}
                      style={{ background: color, boxShadow: panelSettings.primaryColor === color ? `0 0 20px ${color}60` : "" }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <label className="text-sm font-medium">Custom Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={panelSettings.primaryColor}
                      onChange={e => setProp("primaryColor")(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-border bg-input cursor-pointer"
                    />
                    <input
                      type="text"
                      value={panelSettings.primaryColor}
                      onChange={e => setProp("primaryColor")(e.target.value)}
                      placeholder="#00BCD4"
                      className="bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono w-28 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center gap-3">
                <Image className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Login Page</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputRow label="Login Title" value={panelSettings.loginTitle} onChange={setProp("loginTitle")} placeholder="Welcome Back" />
                <InputRow label="Login Subtitle" value={panelSettings.loginSubtitle} onChange={setProp("loginSubtitle")} placeholder="Sign in to your account" />
                <InputRow label="Login Logo URL" value={panelSettings.loginLogoUrl} onChange={setProp("loginLogoUrl")} placeholder="https://example.com/logo.png" helper="Overrides panel logo on login page" />
                <InputRow label="Background Image URL" value={panelSettings.loginBg} onChange={setProp("loginBg")} placeholder="https://example.com/bg.jpg" helper="Full-page background image for login" />
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium">Custom CSS</label>
                  <textarea
                    value={panelSettings.customCss}
                    onChange={e => setProp("customCss")(e.target.value)}
                    placeholder=".sidebar { background: #0a0a0a; }"
                    rows={5}
                    className="w-full bg-input border border-border rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm font-mono resize-none"
                  />
                  <p className="text-xs text-muted-foreground">Inject custom CSS into all panel pages</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={savePersonalization} disabled={saving} className="px-8 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(0,214,214,0.2)]">
                {saving ? "Saving..." : "Save Personalization"}
              </button>
            </div>
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center gap-3">
                <Lock className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">reCAPTCHA Protection</h2>
                <span className="ml-auto text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">Optional</span>
              </div>
              <div className="p-6 space-y-5">
                <p className="text-sm text-muted-foreground">Add Google reCAPTCHA v2 to the login page to protect against bots. Obtain keys at <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">google.com/recaptcha</a>.</p>
                <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={panelSettings.recaptchaEnabled === "true"}
                        onChange={e => setProp("recaptchaEnabled")(e.target.checked ? "true" : "false")}
                        className="sr-only"
                      />
                      <div className={cn("w-12 h-6 rounded-full transition-colors", panelSettings.recaptchaEnabled === "true" ? "bg-primary" : "bg-secondary border border-border")} >
                        <div className={cn("w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform", panelSettings.recaptchaEnabled === "true" ? "translate-x-6" : "translate-x-0.5")} />
                      </div>
                    </div>
                    <span className="text-sm font-medium">Enable reCAPTCHA on login</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputRow label="Site Key (public)" value={panelSettings.recaptchaSiteKey} onChange={setProp("recaptchaSiteKey")} placeholder="6Lc..." helper="Displayed on the frontend" />
                  <InputRow label="Secret Key (private)" value={panelSettings.recaptchaSecretKey} onChange={setProp("recaptchaSecretKey")} type="password" placeholder="6Lc..." helper="Used server-side for verification" />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={savePersonalization} disabled={saving} className="px-8 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50">
                {saving ? "Saving..." : "Save Security Settings"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
