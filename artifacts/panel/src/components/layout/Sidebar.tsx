import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Server, Users, HardDrive, LayoutDashboard, Settings, LogOut, Package, Activity, Egg } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePanelSettings } from "@/contexts/PanelSettingsContext";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { settings } = usePanelSettings();
  const isAdmin = user?.role === "admin";

  const userLinks = [
    { href: "/my-servers", label: "My Servers", icon: Server },
  ];

  const adminLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/servers", label: "All Servers", icon: Server },
    { href: "/nodes", label: "Nodes", icon: HardDrive },
    { href: "/users", label: "Users", icon: Users },
    { href: "/nests", label: "Nests & Eggs", icon: Egg },
    { href: "/activity", label: "Activity Log", icon: Activity },
  ];

  const isActive = (href: string) => href === "/" ? location === "/" : location.startsWith(href);

  const primaryColor = settings.primaryColor || "#00BCD4";
  const panelName = settings.panelName || "VortexPanel";
  const logoUrl = settings.logoUrl;

  const NavLink = ({ href, label, Icon }: { href: string; label: string; Icon: any }) => (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
      isActive(href) ? "text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    )} style={isActive(href) ? { background: `${primaryColor}15`, color: primaryColor } : {}}>
      {isActive(href) && (
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md" style={{ background: primaryColor }} />
      )}
      <Icon className={cn("w-5 h-5")} style={isActive(href) ? { color: primaryColor, filter: `drop-shadow(0 0 6px ${primaryColor}80)` } : {}} />
      {label}
    </Link>
  );

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar h-screen sticky top-0 flex flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3 text-foreground">
          {logoUrl ? (
            <img src={logoUrl} alt={panelName} className="w-8 h-8 rounded object-contain" />
          ) : (
            <div className="w-8 h-8 rounded flex items-center justify-center border" style={{ background: `${primaryColor}20`, borderColor: `${primaryColor}40` }}>
              <Server className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
          )}
          <span className="font-bold text-lg tracking-tight">{panelName}</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">My Account</div>
        {userLinks.map(({ href, label, icon: Icon }) => (
          <NavLink key={href} href={href} label={label} Icon={Icon} />
        ))}

        {isAdmin && (
          <>
            <div className="mt-6 mb-3 pt-4 border-t border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
              Administration
            </div>
            {adminLinks.map(({ href, label, icon: Icon }) => (
              <NavLink key={href} href={href} label={label} Icon={Icon} />
            ))}
          </>
        )}

        <div className="mt-6 pt-4 border-t border-border/50">
          <NavLink href="/settings" label="Settings" Icon={Settings} />
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border"
              style={{ background: `${primaryColor}20`, borderColor: `${primaryColor}40`, color: primaryColor }}
            >
              {user?.username?.substring(0, 2).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium truncate max-w-[100px]">{user?.username}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
