import { Layout } from "@/components/layout/Layout";
import { useListServers, useServerPowerAction } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Link } from "wouter";
import { Server, MemoryStick, HardDrive, Cpu, Play, Square, RotateCcw, Plus, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function MyServers() {
  const { user } = useAuth();
  const { data: allServers, isLoading } = useListServers();
  const queryClient = useQueryClient();

  const { mutate: powerAction } = useServerPowerAction({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers"] })
    }
  });

  const servers = allServers?.filter(s => s.userId === user?.id);

  const handlePower = (id: string, action: "start" | "stop" | "restart") => {
    powerAction({ id, data: { action } });
  };

  return (
    <Layout
      title="My Servers"
      actions={
        <Link
          href="/servers/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(0,214,214,0.2)] hover:shadow-[0_0_20px_rgba(0,214,214,0.4)] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Server
        </Link>
      }
    >
      <div className="mb-6 bg-card border border-border rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold border border-primary/30">
          {user?.username?.substring(0, 2).toUpperCase() || 'U'}
        </div>
        <div>
          <p className="font-semibold">{user?.username}</p>
          <p className="text-sm text-muted-foreground">{user?.email} · <span className="capitalize">{user?.role}</span></p>
        </div>
        <div className="ml-auto flex items-center gap-6 text-sm text-muted-foreground">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{servers?.length ?? 0}</p>
            <p className="text-xs">Servers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{servers?.filter(s => s.status === 'running').length ?? 0}</p>
            <p className="text-xs">Running</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">{servers?.filter(s => s.status === 'stopped').length ?? 0}</p>
            <p className="text-xs">Stopped</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="bg-card border border-border rounded-xl p-6 h-48 animate-pulse" />)}
        </div>
      ) : !servers?.length ? (
        <div className="bg-card border border-border border-dashed rounded-xl p-16 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
            <Server className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No servers yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            You don't have any servers assigned to your account. Create your first Minecraft server to get started.
          </p>
          <Link href="/servers/new" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(0,214,214,0.2)]">
            Create My First Server
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {servers.map((server, i) => (
            <motion.div
              key={server.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border hover:border-primary/50 rounded-xl overflow-hidden transition-all duration-300 group hover:shadow-[0_8px_30px_rgba(0,214,214,0.12)] relative"
            >
              <div className="h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{server.name}</h3>
                    {server.description && <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{server.description}</p>}
                    <p className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded-md inline-block">{server.id.substring(0, 8)}</p>
                  </div>
                  <StatusBadge status={server.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MemoryStick className="w-4 h-4 text-purple-400" />
                    <span>{server.memory} MB</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <HardDrive className="w-4 h-4 text-blue-400" />
                    <span>{server.disk} MB</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Cpu className="w-4 h-4 text-orange-400 capitalize" />
                    <span className="capitalize">{server.serverType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4 text-green-400" />
                    <span>{server.playerCount ?? 0}/{server.maxPlayers ?? 20}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/servers/${server.id}`}
                    className="flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-lg bg-secondary text-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-all text-sm"
                  >
                    Manage
                  </Link>
                  <div className="flex items-center bg-secondary rounded-lg border border-border overflow-hidden">
                    <button onClick={() => handlePower(server.id, 'start')} disabled={server.status === 'running'} className="p-2.5 text-green-500 hover:bg-background transition-colors disabled:opacity-30" title="Start"><Play className="w-4 h-4 fill-current" /></button>
                    <button onClick={() => handlePower(server.id, 'restart')} className="p-2.5 text-blue-500 hover:bg-background transition-colors border-l border-border" title="Restart"><RotateCcw className="w-4 h-4" /></button>
                    <button onClick={() => handlePower(server.id, 'stop')} disabled={server.status === 'stopped'} className="p-2.5 text-orange-500 hover:bg-background transition-colors border-l border-border disabled:opacity-30" title="Stop"><Square className="w-4 h-4 fill-current" /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  );
}
