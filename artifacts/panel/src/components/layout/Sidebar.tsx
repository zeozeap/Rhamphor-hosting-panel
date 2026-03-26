import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Server, Users, HardDrive, LayoutDashboard, Settings, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  const adminLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/servers", label: "All Servers", icon: Server },
    { href: "/nodes", label: "Nodes", icon: HardDrive },
    { href: "/users", label: "Users", icon: Users },
  ];

  const userLinks = [
    { href: "/my-servers", label: "My Servers", icon: Server },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const NavLink = ({ href, label, Icon }: { href: string; label: string; Icon: any }) => (
    <Link key={href} href={href} className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
      isActive(href)
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    )}>
      {isActive(href) && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md" />}
      <Icon className={cn("w-5 h-5", isActive(href) ? "text-primary drop-shadow-[0_0_8px_rgba(0,214,214,0.5)]" : "text-muted-foreground group-hover:text-foreground")} />
      {label}
    </Link>
  );

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar h-screen sticky top-0 flex flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3 text-foreground">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/30 neon-glow">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">Vortex<span className="text-primary">Panel</span></span>
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
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold border border-primary/30">
              {user?.username?.substring(0, 2).toUpperCase() || 'U'}
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
