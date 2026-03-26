import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile, useListNodes, useListServers } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Shield, HardDrive, Server as ServerIcon } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional().or(z.literal(''))
});

type ProfileForm = z.infer<typeof profileSchema>;

export function Settings() {
  const { user } = useAuth();
  const { data: nodes } = useListNodes();
  const { data: servers } = useListServers();
  const queryClient = useQueryClient();

  const { mutate: updateProfile, isPending } = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        toast("Profile updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      },
      onError: (err: any) => {
        toast("Failed to update profile: " + (err?.error || 'Unknown error'));
      }
    }
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      password: ""
    }
  });

  const onSubmit = (data: ProfileForm) => {
    const payload: any = {};
    if (data.username && data.username !== user?.username) payload.username = data.username;
    if (data.email && data.email !== user?.email) payload.email = data.email;
    if (data.password) payload.password = data.password;
    
    if (Object.keys(payload).length > 0) {
      updateProfile({ data: payload });
    }
  };

  return (
    <Layout title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Account Settings</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <input 
                    {...register("username")}
                    className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                  />
                  {errors.username && <p className="text-destructive text-sm">{errors.username.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input 
                    type="email"
                    {...register("email")}
                    className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                  />
                  {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">New Password (leave blank to keep current)</label>
                  <input 
                    type="password"
                    {...register("password")}
                    placeholder="••••••••"
                    className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                  />
                  {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(0,214,214,0.2)] disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
             <div className="p-6 border-b border-border flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Panel Information</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-muted-foreground text-sm">Version</span>
                <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded text-sm">v0.1.0-alpha</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-purple-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Active Nodes</p>
                  <p className="text-2xl font-bold">{nodes?.length || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-blue-400">
                  <ServerIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Total Servers</p>
                  <p className="text-2xl font-bold">{servers?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
