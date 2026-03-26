import { Layout } from "@/components/layout/Layout";
import { useListNodes, useCreateNode } from "@workspace/api-client-react";
import { HardDrive, Plus, MapPin, Activity } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatBytes } from "@/lib/utils";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";

const nodeSchema = z.object({
  name: z.string().min(1, "Name required"),
  fqdn: z.string().min(1, "FQDN required"),
  port: z.coerce.number().default(8080),
  memory: z.coerce.number().min(1024),
  disk: z.coerce.number().min(1024),
  location: z.string().optional()
});

type NodeForm = z.infer<typeof nodeSchema>;

export function Nodes() {
  const { data: nodes, isLoading } = useListNodes();
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useCreateNode({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/nodes"] });
        setShowModal(false);
        reset();
      }
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NodeForm>({
    resolver: zodResolver(nodeSchema),
    defaultValues: { port: 8080, memory: 32768, disk: 1024000 }
  });

  return (
    <Layout 
      title="Infrastructure Nodes"
      actions={
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(57,255,20,0.2)] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Node
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="h-24 bg-card border border-border rounded-xl animate-pulse" />
        ) : nodes?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">No nodes configured.</div>
        ) : (
          nodes?.map(node => (
             <div key={node.id} className="bg-card border border-border hover:border-border/80 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
               <div className="flex items-start gap-4">
                 <div className="p-3 bg-secondary rounded-xl text-muted-foreground border border-border shadow-inner">
                   <HardDrive className="w-8 h-8" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                     {node.name}
                     <StatusBadge status={node.status} />
                   </h3>
                   <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                     <span className="font-mono bg-secondary px-2 py-0.5 rounded">{node.fqdn}:{node.port}</span>
                     {node.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {node.location}</span>}
                   </div>
                 </div>
               </div>

               <div className="flex items-center gap-8 md:px-8 md:border-l border-border">
                 <div>
                   <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Memory</p>
                   <p className="font-mono text-lg">{formatBytes(node.memory * 1024 * 1024, 0)}</p>
                 </div>
                 <div>
                   <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Disk</p>
                   <p className="font-mono text-lg">{formatBytes(node.disk * 1024 * 1024, 0)}</p>
                 </div>
                 <div className="text-center">
                   <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Servers</p>
                   <p className="text-xl font-bold text-primary">{node.serversCount || 0}</p>
                 </div>
               </div>
             </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/30">
              <h2 className="text-lg font-bold">Add New Node</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleSubmit(data => mutate({ data }))} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Node Name</label>
                  <input {...register("name")} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">FQDN</label>
                  <input {...register("fqdn")} placeholder="node1.example.com" className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Daemon Port</label>
                  <input type="number" {...register("port")} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total Memory (MB)</label>
                  <input type="number" {...register("memory")} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total Disk (MB)</label>
                  <input type="number" {...register("disk")} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Location</label>
                  <input {...register("location")} placeholder="e.g. New York, US" className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-border hover:bg-secondary">Cancel</button>
                <button type="submit" disabled={isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50">
                  {isPending ? "Creating..." : "Create Node"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
