import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Server, Users, HardDrive, LayoutDashboard, Settings } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/servers", label: "Servers", icon: Server },
    { href: "/nodes", label: "Nodes", icon: HardDrive },
    { href: "/users", label: "Users", icon: Users },
  ];

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
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
          Management
        </div>
        
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
          
          return (
            <Link key={link.href} href={link.href} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}>
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md" />
              )}
              <Icon className={cn("w-5 h-5", isActive ? "text-primary drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]" : "text-muted-foreground group-hover:text-foreground")} />
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold border border-border">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Admin User</span>
            <span className="text-xs text-muted-foreground">Administrator</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
