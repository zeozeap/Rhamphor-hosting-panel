import { Layout } from "@/components/layout/Layout";
import { useGetServer, useServerPowerAction, useSendServerCommand, useGetServerStats, useDeleteServer } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useParams, useLocation } from "wouter";
import { Play, Square, RotateCcw, Power, Terminal as TerminalIcon, BarChart2, Settings, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { formatBytes, cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useQueryClient } from "@tanstack/react-query";

// Mock historical data since API only returns current point
const generateMockHistory = (currentValue: number) => {
  return Array.from({ length: 20 }).map((_, i) => ({
    time: i,
    value: Math.max(0, currentValue + (Math.random() * 20 - 10))
  }));
};

export function ServerDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"console" | "stats" | "settings">("console");
  
  const { data: server, isLoading } = useGetServer(id || "");
  const { data: stats } = useGetServerStats(id || "", {
    query: { refetchInterval: 5000, enabled: activeTab === "stats" && !!id }
  });
  
  const { mutate: powerAction, isPending: actionPending } = useServerPowerAction({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers", id] })
    }
  });

  const { mutate: deleteServer } = useDeleteServer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
        setLocation("/servers");
      }
    }
  });

  const handlePower = (action: "start" | "stop" | "restart" | "kill") => {
    if (id) powerAction({ id, data: { action } });
  };

  if (isLoading || !server) return <Layout title="Loading..."><div className="animate-pulse h-96 bg-card rounded-xl" /></Layout>;

  return (
    <Layout 
      title={server.name}
      actions={
        <div className="flex bg-secondary p-1 rounded-lg border border-border">
          <button onClick={() => handlePower('start')} disabled={actionPending || server.status === 'running'} className="p-2 rounded hover:bg-background text-green-500 disabled:opacity-30 transition-colors" title="Start">
            <Play className="w-5 h-5 fill-current" />
          </button>
          <button onClick={() => handlePower('restart')} disabled={actionPending} className="p-2 rounded hover:bg-background text-blue-500 disabled:opacity-30 transition-colors" title="Restart">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={() => handlePower('stop')} disabled={actionPending || server.status === 'stopped'} className="p-2 rounded hover:bg-background text-orange-500 disabled:opacity-30 transition-colors" title="Stop">
            <Square className="w-5 h-5 fill-current" />
          </button>
          <button onClick={() => handlePower('kill')} disabled={actionPending} className="p-2 rounded hover:bg-background text-destructive disabled:opacity-30 transition-colors" title="Kill">
            <Power className="w-5 h-5" />
          </button>
        </div>
      }
    >
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
        <StatusBadge status={server.status} className="px-4 py-1.5 text-sm" />
        <span className="text-muted-foreground font-mono text-sm">{server.id}</span>
        <span className="text-muted-foreground text-sm flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Node: {server.nodeId}</span>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border">
        <button 
          onClick={() => setActiveTab("console")}
          className={cn("px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors", activeTab === "console" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border")}
        >
          <TerminalIcon className="w-4 h-4" /> Console
        </button>
        <button 
          onClick={() => setActiveTab("stats")}
          className={cn("px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors", activeTab === "stats" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border")}
        >
          <BarChart2 className="w-4 h-4" /> Statistics
        </button>
        <button 
          onClick={() => setActiveTab("settings")}
          className={cn("px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors", activeTab === "settings" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border")}
        >
          <Settings className="w-4 h-4" /> Settings
        </button>
      </div>

      <div>
        {activeTab === "console" && <ConsoleTab serverId={server.id} />}
        {activeTab === "stats" && stats && <StatsTab stats={stats} server={server} />}
        {activeTab === "settings" && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Allocation Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Minecraft Version</p>
                  <p className="font-medium">{server.version} ({server.serverType})</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Port</p>
                  <p className="font-mono bg-secondary inline-block px-2 py-1 rounded">{server.port}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Memory Limit</p>
                  <p className="font-medium">{server.memory} MB</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Disk Limit</p>
                  <p className="font-medium">{server.disk} MB</p>
                </div>
              </div>
            </div>

            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-destructive flex items-center gap-2 mb-2">
                <Trash2 className="w-5 h-5" /> Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Deleting this server is permanent and cannot be undone. All files and data will be removed from the node.</p>
              <button 
                onClick={() => {
                  if(confirm('Are you absolutely sure you want to delete this server?')) {
                    if(id) deleteServer({ id });
                  }
                }}
                className="px-4 py-2 bg-destructive text-destructive-foreground font-medium rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Delete Server
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function ConsoleTab({ serverId }: { serverId: string }) {
  const { messages, isConnected } = useWebSocket(`/ws/servers/${serverId}/console`);
  const { mutate: sendCommand } = useSendServerCommand();
  const [cmd, setCmd] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmd.trim()) return;
    sendCommand({ id: serverId, data: { command: cmd } });
    setCmd("");
  };

  // Very basic ANSI to HTML converter for the console
  const renderMessage = (msg: string, idx: number) => {
    let clean = msg.replace(/\x1b\[[0-9;]*m/g, ""); // Strip ANSI for now for simplicity, ideally we parse it
    // If it contained a red color code, make it red
    const isRed = msg.includes('\x1b[31m');
    const isGreen = msg.includes('\x1b[32m');
    
    return (
      <div key={idx} className={cn("hover:bg-white/5 px-2 py-0.5 whitespace-pre-wrap break-all", isRed ? "text-red-400" : isGreen ? "text-green-400" : "text-gray-300")}>
        {clean}
      </div>
    );
  };

  return (
    <div className="bg-[#0c0c0c] border border-border rounded-xl overflow-hidden flex flex-col h-[600px] shadow-2xl">
      <div className="bg-secondary/50 px-4 py-2 border-b border-border flex justify-between items-center text-xs text-muted-foreground font-mono">
        <span>root@server:~#</span>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
            <span className={cn("relative inline-flex rounded-full h-2 w-2", isConnected ? "bg-primary" : "bg-red-500")}></span>
          </span>
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 terminal-output bg-black/50">
        {messages.length === 0 && <div className="text-muted-foreground italic">Waiting for console output...</div>}
        {messages.map(renderMessage)}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-secondary/30 flex gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-mono select-none">&gt;</span>
          <input 
            type="text"
            value={cmd}
            onChange={e => setCmd(e.target.value)}
            disabled={!isConnected}
            placeholder="Enter command..."
            className="w-full bg-background border border-border rounded-lg py-2.5 pl-8 pr-4 font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
          />
        </div>
        <button type="submit" disabled={!isConnected || !cmd.trim()} className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors">
          Send
        </button>
      </form>
    </div>
  );
}

function StatsTab({ stats, server }: { stats: any, server: any }) {
  const cpuHistory = generateMockHistory(stats.cpuPercent);
  const memHistory = generateMockHistory(stats.memoryUsed);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm text-muted-foreground font-medium mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" /> CPU Usage
          </h3>
          <div className="text-3xl font-bold mb-4">{stats.cpuPercent.toFixed(1)}%</div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpuHistory}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(110 100% 54%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(110 100% 54%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="hsl(110 100% 54%)" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm text-muted-foreground font-medium mb-4 flex items-center gap-2">
            <MemoryStick className="w-4 h-4 text-purple-500" /> Memory Usage
          </h3>
          <div className="text-3xl font-bold mb-1">{formatBytes(stats.memoryUsed * 1024 * 1024)}</div>
          <div className="text-xs text-muted-foreground mb-4">/ {formatBytes(stats.memoryLimit * 1024 * 1024)}</div>
          <div className="h-20">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={memHistory}>
                <defs>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#a855f7" fillOpacity={1} fill="url(#colorMem)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm text-muted-foreground font-medium mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-500" /> Disk Usage
          </h3>
          <div className="text-3xl font-bold mb-1">{formatBytes(stats.diskUsed * 1024 * 1024)}</div>
          <div className="text-xs text-muted-foreground mb-6">/ {formatBytes(stats.diskLimit * 1024 * 1024)}</div>
          
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-500", (stats.diskUsed / stats.diskLimit) > 0.8 ? "bg-destructive" : "bg-blue-500")}
              style={{ width: `${Math.min(100, (stats.diskUsed / stats.diskLimit) * 100)}%` }} 
            />
          </div>
          <div className="text-xs text-right mt-2 text-muted-foreground">
            {((stats.diskUsed / stats.diskLimit) * 100).toFixed(1)}% Used
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between">
           <div>
             <p className="text-sm text-muted-foreground mb-1">Network In (Rx)</p>
             <p className="text-2xl font-bold font-mono">{formatBytes(stats.networkRx)}</p>
           </div>
           <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
             <ArrowDown className="w-6 h-6 text-green-500" />
           </div>
         </div>
         <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between">
           <div>
             <p className="text-sm text-muted-foreground mb-1">Network Out (Tx)</p>
             <p className="text-2xl font-bold font-mono">{formatBytes(stats.networkTx)}</p>
           </div>
           <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
             <ArrowUp className="w-6 h-6 text-blue-500" />
           </div>
         </div>
      </div>
    </div>
  );
}

function ArrowDown(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>;
}
function ArrowUp(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>;
}
