import { Layout } from "@/components/layout/Layout";
import { useEffect, useRef, useState } from "react";
import { Activity, User, Server, Shield, Trash2, Play, Square, RefreshCw, Settings, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  userId: string | null;
  username: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
  level: string;
  createdAt: string;
}

const ACTION_ICONS: Record<string, any> = {
  "server.start": Play,
  "server.stop": Square,
  "server.restart": RefreshCw,
  "server.kill": Shield,
  "server.create": Server,
  "server.delete": Trash2,
  "server.update": Settings,
  "user.login": User,
  "nest.create": Activity,
  "egg.create": Activity,
};

const ACTION_COLORS: Record<string, string> = {
  "server.start": "text-green-400 bg-green-400/10",
  "server.stop": "text-yellow-400 bg-yellow-400/10",
  "server.restart": "text-blue-400 bg-blue-400/10",
  "server.kill": "text-red-400 bg-red-400/10",
  "server.create": "text-primary bg-primary/10",
  "server.delete": "text-red-400 bg-red-400/10",
  "server.update": "text-purple-400 bg-purple-400/10",
  "user.login": "text-green-400 bg-green-400/10",
  "nest.create": "text-primary bg-primary/10",
  "egg.create": "text-primary bg-primary/10",
};

const LEVEL_COLORS: Record<string, string> = {
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  warn: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
};

function ActionBadge({ action }: { action: string }) {
  const Icon = ACTION_ICONS[action] || Activity;
  const color = ACTION_COLORS[action] || "text-muted-foreground bg-secondary";
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium", color)}>
      <Icon className="w-3 h-3" />
      {action}
    </span>
  );
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ActivityLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [live, setLive] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const r = await fetch("/api/audit?limit=100", { credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setLogs(data.logs.map((l: any) => ({ ...l, metadata: JSON.parse(l.metadata || "{}") })));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!live) {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/ws/activity`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "activity" && msg.event) {
          const event = msg.event;
          setLogs(prev => [{
            ...event,
            metadata: typeof event.metadata === "string" ? JSON.parse(event.metadata || "{}") : (event.metadata ?? {}),
          }, ...prev.slice(0, 199)]);
        }
      } catch (_) {}
    };

    return () => ws.close();
  }, [live]);

  const filtered = filter
    ? logs.filter(l => l.action.includes(filter) || l.username?.includes(filter) || l.resourceName?.includes(filter) || l.resourceType?.includes(filter))
    : logs;

  return (
    <Layout title="Activity Log">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={cn("w-2 h-2 rounded-full", live ? "bg-green-400 animate-pulse" : "bg-muted-foreground")} />
            <span className="text-sm text-muted-foreground">{live ? "Live feed active" : "Live feed paused"}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Filter events..."
                className="bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none w-56"
              />
            </div>
            <button
              onClick={() => setLive(v => !v)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", live ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30" : "bg-secondary text-muted-foreground hover:text-foreground")}
            >
              {live ? "Pause" : "Resume"} Live
            </button>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-secondary rounded-lg text-sm font-medium hover:bg-secondary/70 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Event Stream</h2>
            <span className="ml-auto text-xs text-muted-foreground">{filtered.length} events</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading activity logs...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No events recorded yet</p>
              <p className="text-sm mt-1">Activity will appear here as actions are taken</p>
            </div>
          ) : (
            <div ref={containerRef} className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {filtered.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-full", ACTION_COLORS[log.action] || "text-muted-foreground bg-secondary")}>
                      {(() => { const Icon = ACTION_ICONS[log.action] || Activity; return <Icon className="w-4 h-4" />; })()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ActionBadge action={log.action} />
                      <span className={cn("text-xs px-2 py-0.5 rounded border", LEVEL_COLORS[log.level] || LEVEL_COLORS.info)}>{log.level}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {log.username && <span className="text-foreground font-medium">{log.username}</span>}
                      {log.resourceName && <> → <span className="text-primary">{log.resourceName}</span></>}
                      {log.ip && <span className="text-xs ml-2 opacity-50">from {log.ip}</span>}
                    </p>
                    {Object.keys(log.metadata || {}).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-xs text-muted-foreground">{timeAgo(log.createdAt)}</span>
                    <p className="text-xs text-muted-foreground/50 mt-0.5">{new Date(log.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
