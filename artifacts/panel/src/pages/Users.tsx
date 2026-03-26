import { Layout } from "@/components/layout/Layout";
import { useListUsers, useCreateUser, useDeleteUser, UserRole } from "@workspace/api-client-react";
import { Plus, User as UserIcon, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const userSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole).default("user")
});

export function Users() {
  const { data: users, isLoading } = useListUsers();
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: createUser, isPending } = useCreateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        setShowModal(false);
        reset();
      }
    }
  });

  const { mutate: deleteUser } = useDeleteUser({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users"] })
    }
  });

  const { register, handleSubmit, reset } = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: "user" }
  });

  return (
    <Layout 
      title="User Management"
      actions={
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(57,255,20,0.2)] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add User
        </button>
      }
    >
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground animate-pulse">Loading users...</td></tr>
              ) : users?.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No users found.</td></tr>
              ) : (
                users?.map(user => (
                  <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-foreground">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => { if(confirm('Delete user?')) deleteUser({ id: user.id }); }}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/30">
              <h2 className="text-lg font-bold">Add New User</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleSubmit(data => createUser({ data }))} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <input {...register("username")} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input type="email" {...register("email")} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input type="password" {...register("password")} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select {...register("role")} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none">
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-border hover:bg-secondary">Cancel</button>
                <button type="submit" disabled={isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50">
                  {isPending ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
