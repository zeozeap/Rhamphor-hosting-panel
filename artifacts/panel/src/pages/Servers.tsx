import { Layout } from "@/components/layout/Layout";
import { useListServers, useServerPowerAction, useDeleteServer } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Link } from "wouter";
import { Server, MemoryStick, HardDrive, Cpu, Plus, Search, Play, Square, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export function Servers() {
  const { data: servers, isLoading } = useListServers();
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { mutate: powerAction } = useServerPowerAction({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers"] })
    }
  });

  const { mutate: deleteServer } = useDeleteServer({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers"] })
    }
  });

  const filteredServers = servers?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  const handlePower = (id: string, action: "start" | "stop" | "restart") => {
    powerAction({ id, data: { action } });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you absolutely sure you want to delete this server?")) {
      deleteServer({ id });
    }
  };

  return (
    <Layout 
      title="Servers"
      actions={
        <Link href="/servers/new" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(0,214,214,0.2)] hover:shadow-[0_0_20px_rgba(0,214,214,0.4)] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Server
        </Link>
      }
    >
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input 
          type="text"
          placeholder="Search servers by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 h-48 animate-pulse" />
          ))}
        </div>
      ) : filteredServers?.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <Server className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No servers found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            You don't have any servers matching this criteria. Create a new server to get started.
          </p>
          <Link href="/servers/new" className="px-6 py-2.5 bg-secondary text-foreground rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-all">
            Create New Server
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServers?.map((server, i) => (
            <motion.div 
              key={server.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border hover:border-primary/50 rounded-xl overflow-hidden transition-all duration-300 group hover:shadow-[0_8px_30px_rgba(0,214,214,0.12)] relative"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{server.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded-md inline-block">{server.id.substring(0, 8)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={server.status} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MemoryStick className="w-4 h-4 text-purple-400" />
                    <span>{server.memory} MB RAM</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <HardDrive className="w-4 h-4 text-blue-400" />
                    <span>{server.disk} MB Disk</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Cpu className="w-4 h-4 text-orange-400" />
                    <span className="capitalize">{server.serverType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Server className="w-4 h-4 text-green-400" />
                    <span>v{server.version}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/servers/${server.id}`} className="flex-1 flex justify-center py-2.5 rounded-lg bg-secondary text-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-all">
                    Manage Server
                  </Link>
                  <div className="flex items-center bg-secondary rounded-lg border border-border overflow-hidden">
                    <button onClick={() => handlePower(server.id, 'start')} className="p-2.5 text-green-500 hover:bg-background transition-colors" title="Start">
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                    <button onClick={() => handlePower(server.id, 'restart')} className="p-2.5 text-blue-500 hover:bg-background transition-colors border-l border-border" title="Restart">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={() => handlePower(server.id, 'stop')} className="p-2.5 text-orange-500 hover:bg-background transition-colors border-l border-border" title="Stop">
                      <Square className="w-4 h-4 fill-current" />
                    </button>
                    <button onClick={() => handleDelete(server.id)} className="p-2.5 text-destructive hover:bg-background transition-colors border-l border-border" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
