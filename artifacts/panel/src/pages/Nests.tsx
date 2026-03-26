import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { Package, Plus, Trash2, ChevronDown, ChevronRight, Edit2, Check, X, Egg, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Nest {
  id: string;
  name: string;
  description: string;
  author: string;
  createdAt: string;
}

interface Egg {
  id: string;
  nestId: string;
  name: string;
  description: string;
  dockerImage: string;
  startupCommand: string;
  createdAt: string;
}

const PRESET_NESTS = [
  {
    name: "Minecraft Java", description: "Java Edition Minecraft servers", author: "VortexPanel",
    eggs: [
      { name: "Paper", description: "High-performance Paper Minecraft server", dockerImage: "eclipse-temurin:21-jre", startupCommand: "java -Xms{{SERVER_MEMORY}}M -Xmx{{SERVER_MEMORY}}M -jar server.jar nogui" },
      { name: "Forge", description: "Modded Minecraft with Forge", dockerImage: "eclipse-temurin:17-jre", startupCommand: "java -Xms{{SERVER_MEMORY}}M -Xmx{{SERVER_MEMORY}}M -jar forge.jar nogui" },
      { name: "Vanilla", description: "Official Mojang Minecraft server", dockerImage: "eclipse-temurin:21-jre", startupCommand: "java -Xms{{SERVER_MEMORY}}M -Xmx{{SERVER_MEMORY}}M -jar server.jar nogui" },
      { name: "Fabric", description: "Fabric mod loader for Minecraft", dockerImage: "eclipse-temurin:21-jre", startupCommand: "java -Xms{{SERVER_MEMORY}}M -Xmx{{SERVER_MEMORY}}M -jar fabric-server-launch.jar nogui" },
    ]
  },
  {
    name: "Discord Bots", description: "Discord bot hosting", author: "VortexPanel",
    eggs: [
      { name: "Discord.js Bot", description: "Node.js Discord bot using Discord.js", dockerImage: "node:20-alpine", startupCommand: "node index.js" },
      { name: "Python Bot (discord.py)", description: "Python Discord bot using discord.py", dockerImage: "python:3.11-slim", startupCommand: "python bot.py" },
      { name: "JDA Bot", description: "Java Discord bot using JDA", dockerImage: "eclipse-temurin:17-jre", startupCommand: "java -jar bot.jar" },
    ]
  },
  {
    name: "Generic", description: "Generic server types", author: "VortexPanel",
    eggs: [
      { name: "Node.js", description: "Generic Node.js application", dockerImage: "node:20-alpine", startupCommand: "node {{MAIN_FILE}}" },
      { name: "Python", description: "Generic Python application", dockerImage: "python:3.11-slim", startupCommand: "python {{MAIN_FILE}}" },
      { name: "Go", description: "Generic Go application", dockerImage: "golang:1.22-alpine", startupCommand: "./app" },
    ]
  },
];

export function Nests() {
  const [nests, setNests] = useState<Nest[]>([]);
  const [eggs, setEggs] = useState<Record<string, Egg[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [newNestName, setNewNestName] = useState("");
  const [newNestDesc, setNewNestDesc] = useState("");
  const [showNewNest, setShowNewNest] = useState(false);
  const [editingNest, setEditingNest] = useState<string | null>(null);
  const [editNestName, setEditNestName] = useState("");
  const [newEggData, setNewEggData] = useState<Record<string, { name: string; description: string; dockerImage: string; startupCommand: string }>>({});
  const [showNewEgg, setShowNewEgg] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const fetchNests = async () => {
    try {
      const r = await fetch("/api/nests", { credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setNests(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEggs = async (nestId: string) => {
    const r = await fetch(`/api/nests/${nestId}/eggs`, { credentials: "include" });
    if (r.ok) {
      const data = await r.json();
      setEggs(prev => ({ ...prev, [nestId]: data }));
    }
  };

  useEffect(() => { fetchNests(); }, []);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else {
        next.add(id);
        if (!eggs[id]) fetchEggs(id);
      }
      return next;
    });
  };

  const createNest = async () => {
    if (!newNestName.trim()) return;
    const r = await fetch("/api/nests", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newNestName, description: newNestDesc }) });
    if (r.ok) {
      toast("Nest created");
      setNewNestName(""); setNewNestDesc(""); setShowNewNest(false);
      fetchNests();
    }
  };

  const deleteNest = async (id: string) => {
    if (!confirm("Delete this nest and all its eggs?")) return;
    const r = await fetch(`/api/nests/${id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) { toast("Nest deleted"); fetchNests(); setEggs(p => { const n = { ...p }; delete n[id]; return n; }); }
  };

  const saveNestName = async (id: string) => {
    const r = await fetch(`/api/nests/${id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editNestName }) });
    if (r.ok) { toast("Nest updated"); setEditingNest(null); fetchNests(); }
  };

  const createEgg = async (nestId: string) => {
    const data = newEggData[nestId];
    if (!data?.name) return;
    const r = await fetch(`/api/nests/${nestId}/eggs`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, description: data.description, dockerImage: data.dockerImage, startupCommand: data.startupCommand })
    });
    if (r.ok) {
      toast("Egg created");
      setShowNewEgg(null);
      setNewEggData(p => { const n = { ...p }; delete n[nestId]; return n; });
      fetchEggs(nestId);
    }
  };

  const deleteEgg = async (eggId: string, nestId: string) => {
    const r = await fetch(`/api/eggs/${eggId}`, { method: "DELETE", credentials: "include" });
    if (r.ok) { toast("Egg deleted"); fetchEggs(nestId); }
  };

  const seedPresets = async () => {
    setSeeding(true);
    try {
      for (const preset of PRESET_NESTS) {
        const nr = await fetch("/api/nests", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: preset.name, description: preset.description, author: preset.author })
        });
        if (!nr.ok) continue;
        const nest = await nr.json();
        for (const egg of preset.eggs) {
          await fetch(`/api/nests/${nest.id}/eggs`, {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(egg)
          });
        }
      }
      toast("Presets imported successfully!");
      fetchNests();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Layout title="Nests & Eggs">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-muted-foreground text-sm">Manage server software configurations. Nests are categories; Eggs are server types within them.</p>
          <div className="flex gap-3">
            {nests.length === 0 && (
              <button
                onClick={seedPresets}
                disabled={seeding}
                className="px-4 py-2 bg-secondary rounded-lg text-sm font-medium hover:bg-secondary/70 transition-all flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                {seeding ? "Importing..." : "Import Presets"}
              </button>
            )}
            <button
              onClick={() => setShowNewNest(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,214,214,0.2)]"
            >
              <Plus className="w-4 h-4" /> New Nest
            </button>
          </div>
        </div>

        {showNewNest && (
          <div className="bg-card border border-primary/30 rounded-xl p-6 space-y-4 shadow-[0_0_20px_rgba(0,214,214,0.1)]">
            <h3 className="font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Create Nest</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={newNestName} onChange={e => setNewNestName(e.target.value)} placeholder="Nest name (e.g. Minecraft Java)" className="bg-input border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
              <input value={newNestDesc} onChange={e => setNewNestDesc(e.target.value)} placeholder="Description (optional)" className="bg-input border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowNewNest(false)} className="px-4 py-2 bg-secondary rounded-lg text-sm hover:bg-secondary/70">Cancel</button>
              <button onClick={createNest} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Create</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          </div>
        ) : nests.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-16 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold mb-2">No Nests Yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Import presets (Minecraft, Discord bots, etc.) or create your own nests.</p>
            <button onClick={seedPresets} disabled={seeding} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all">
              {seeding ? "Importing..." : "Import Presets"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {nests.map((nest) => (
              <div key={nest.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 transition-colors">
                <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => toggleExpand(nest.id)}>
                  <button className="text-muted-foreground">
                    {expanded.has(nest.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingNest === nest.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input value={editNestName} onChange={e => setEditNestName(e.target.value)} className="bg-input border border-primary rounded px-2 py-1 text-sm outline-none" autoFocus onKeyDown={e => { if (e.key === "Enter") saveNestName(nest.id); if (e.key === "Escape") setEditingNest(null); }} />
                        <button onClick={() => saveNestName(nest.id)} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingNest(null)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <p className="font-semibold">{nest.name}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{nest.description} · {nest.author}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-auto" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditingNest(nest.id); setEditNestName(nest.name); }} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteNest(nest.id)} className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expanded.has(nest.id) && (
                  <div className="border-t border-border bg-background/30">
                    {(eggs[nest.id] || []).map((egg) => (
                      <div key={egg.id} className="flex items-start gap-4 px-6 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Egg className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{egg.name}</p>
                          <p className="text-xs text-muted-foreground">{egg.description}</p>
                          {egg.dockerImage && <p className="text-xs text-primary/70 font-mono mt-1">{egg.dockerImage}</p>}
                        </div>
                        <button onClick={() => deleteEgg(egg.id, nest.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10 transition-colors flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {showNewEgg === nest.id ? (
                      <div className="px-6 py-4 space-y-3 bg-primary/5 border-t border-primary/20">
                        <p className="text-sm font-medium flex items-center gap-2"><Egg className="w-4 h-4 text-primary" /> New Egg</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input value={newEggData[nest.id]?.name || ""} onChange={e => setNewEggData(p => ({ ...p, [nest.id]: { ...p[nest.id], name: e.target.value } }))} placeholder="Egg name *" className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                          <input value={newEggData[nest.id]?.description || ""} onChange={e => setNewEggData(p => ({ ...p, [nest.id]: { ...p[nest.id], description: e.target.value } }))} placeholder="Description" className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                          <input value={newEggData[nest.id]?.dockerImage || ""} onChange={e => setNewEggData(p => ({ ...p, [nest.id]: { ...p[nest.id], dockerImage: e.target.value } }))} placeholder="Docker image (e.g. node:20-alpine)" className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                          <input value={newEggData[nest.id]?.startupCommand || ""} onChange={e => setNewEggData(p => ({ ...p, [nest.id]: { ...p[nest.id], startupCommand: e.target.value } }))} placeholder="Startup command" className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setShowNewEgg(null)} className="px-3 py-1.5 bg-secondary rounded text-sm hover:bg-secondary/70">Cancel</button>
                          <button onClick={() => createEgg(nest.id)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium">Add Egg</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setShowNewEgg(nest.id); if (!eggs[nest.id]) fetchEggs(nest.id); }} className="w-full flex items-center gap-2 px-6 py-3 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                        <Plus className="w-4 h-4" /> Add Egg
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
