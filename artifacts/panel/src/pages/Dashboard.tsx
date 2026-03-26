import { Layout } from "@/components/layout/Layout";
import { useListServers, useListNodes, useListUsers } from "@workspace/api-client-react";
import { Server, Users, HardDrive, Activity, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export function Dashboard() {
  const { data: servers, isLoading: loadingServers } = useListServers();
  const { data: nodes, isLoading: loadingNodes } = useListNodes();
  const { data: users, isLoading: loadingUsers } = useListUsers();

  const activeServers = servers?.filter(s => s.status === 'running')?.length || 0;
  
  const stats = [
    { 
      label: "Total Servers", 
      value: loadingServers ? "-" : servers?.length || 0, 
      icon: Server,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      link: "/servers"
    },
    { 
      label: "Online Servers", 
      value: loadingServers ? "-" : activeServers, 
      icon: Activity,
      color: "text-primary",
      bg: "bg-primary/10",
      link: "/servers"
    },
    { 
      label: "Total Nodes", 
      value: loadingNodes ? "-" : nodes?.length || 0, 
      icon: HardDrive,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      link: "/nodes"
    },
    { 
      label: "Total Users", 
      value: loadingUsers ? "-" : users?.length || 0, 
      icon: Users,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      link: "/users"
    },
  ];

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 relative overflow-hidden group hover:border-border/80 transition-colors"
            >
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} blur-2xl group-hover:bg-opacity-20 transition-all`} />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">{stat.label}</p>
              </div>

              <Link href={stat.link} className="absolute inset-0 z-20 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-xl" aria-label={`View ${stat.label}`} />
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Servers</h2>
            <Link href="/servers" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loadingServers ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : servers?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No servers created yet.</div>
            ) : (
              servers?.slice(0, 5).map(server => (
                <div key={server.id} className="p-4 hover:bg-secondary/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${server.status === 'running' ? 'bg-primary shadow-[0_0_5px_rgba(57,255,20,0.8)]' : 'bg-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold text-foreground">{server.name}</p>
                      <p className="text-xs text-muted-foreground">{server.serverType} • {server.version}</p>
                    </div>
                  </div>
                  <Link href={`/servers/${server.id}`} className="px-4 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                    Manage
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
           <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">System Information</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Global Memory Allocation</span>
                <span className="font-medium">12 GB / 32 GB</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '37.5%' }} />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Global Disk Usage</span>
                <span className="font-medium">150 GB / 1000 GB</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '15%' }} />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Panel Version</span>
                <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">v0.1.0-alpha</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
