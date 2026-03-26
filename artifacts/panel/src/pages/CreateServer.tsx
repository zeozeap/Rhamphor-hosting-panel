import { Layout } from "@/components/layout/Layout";
import { useCreateServer, useListNodes, useListUsers, ServerServerType } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { Server } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  version: z.string().min(1, "Version is required"),
  port: z.coerce.number().min(1024).max(65535),
  memory: z.coerce.number().min(512, "Min 512MB"),
  disk: z.coerce.number().min(1024, "Min 1024MB"),
  nodeId: z.string().min(1, "Node is required"),
  userId: z.string().min(1, "Owner is required"),
  maxPlayers: z.coerce.number().optional().default(20),
  javaVersion: z.string().optional().default("17"),
  serverType: z.nativeEnum(ServerServerType)
});

type FormValues = z.infer<typeof formSchema>;

export function CreateServer() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: nodes } = useListNodes();
  const { data: users } = useListUsers();
  
  const { mutate, isPending } = useCreateServer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
        setLocation("/servers");
      }
    }
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      port: 25565,
      memory: 2048,
      disk: 10240,
      serverType: "paper",
      version: "1.20.4",
      javaVersion: "17",
      maxPlayers: 20
    }
  });

  const onSubmit = (data: FormValues) => {
    mutate({ data });
  };

  return (
    <Layout title="Create Server">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Server className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold">Core Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Server Name</label>
                <input {...register("name")} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none" placeholder="My Awesome Server" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Owner (User)</label>
                <select {...register("userId")} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none">
                  <option value="">Select User...</option>
                  {users?.map(u => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
                </select>
                {errors.userId && <p className="text-xs text-destructive">{errors.userId.message}</p>}
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea {...register("description")} rows={3} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none resize-none" placeholder="Optional description..." />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-border">Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Server Type</label>
                <select {...register("serverType")} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none capitalize">
                  {Object.values(ServerServerType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.serverType && <p className="text-xs text-destructive">{errors.serverType.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Minecraft Version</label>
                <input {...register("version")} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none" placeholder="1.20.4" />
                {errors.version && <p className="text-xs text-destructive">{errors.version.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Node</label>
                <select {...register("nodeId")} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none">
                  <option value="">Select Node...</option>
                  {nodes?.map(n => <option key={n.id} value={n.id}>{n.name} - {n.fqdn}</option>)}
                </select>
                {errors.nodeId && <p className="text-xs text-destructive">{errors.nodeId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Port</label>
                <input type="number" {...register("port")} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none" />
                {errors.port && <p className="text-xs text-destructive">{errors.port.message}</p>}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-border">Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex justify-between">
                  Memory (MB) <span className="text-primary">{2048}</span>
                </label>
                <input type="number" {...register("memory")} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none" />
                {errors.memory && <p className="text-xs text-destructive">{errors.memory.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex justify-between">
                  Disk (MB) <span className="text-primary">{10240}</span>
                </label>
                <input type="number" {...register("disk")} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none" />
                {errors.disk && <p className="text-xs text-destructive">{errors.disk.message}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Link href="/servers" className="px-6 py-3 rounded-xl font-medium border border-border hover:bg-secondary transition-colors">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={isPending}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(57,255,20,0.2)] disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create Server"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
