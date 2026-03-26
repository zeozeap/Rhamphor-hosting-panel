import { Layout } from "@/components/layout/Layout";
import {
  useGetServer, useServerPowerAction, useSendServerCommand, useGetServerStats,
  useDeleteServer, useGetServerLogs, useUpdateServer,
  useListServerFiles, useReadServerFile, useWriteServerFile, useDeleteServerFile,
  useListServerPlugins, useInstallServerPlugin, useToggleServerPlugin, useRemoveServerPlugin,
  useListServerSubdomains, useCreateServerSubdomain, useDeleteServerSubdomain,
} from "@workspace/api-client-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useParams, useLocation } from "wouter";
import {
  Play, Square, RotateCcw, Power, Terminal as TerminalIcon, BarChart2,
  Settings, Trash2, Cpu, MemoryStick, HardDrive, FolderOpen, Puzzle,
  Globe, ChevronRight, ChevronDown, File, Folder, Save, ArrowLeft,
  Plus, Check, X, Copy, Pencil, ToggleLeft, ToggleRight, RefreshCw,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { formatBytes, cn } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar } from "recharts";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "console" | "files" | "plugins" | "subdomains" | "stats" | "settings";

export function ServerDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("console");

  const { data: server, isLoading } = useGetServer(id || "", { query: { enabled: !!id } });
  const { data: stats } = useGetServerStats(id || "", {
    query: { refetchInterval: 3000, enabled: activeTab === "stats" && !!id }
  });

  const { mutate: powerAction, isPending: actionPending } = useServerPowerAction({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers", id] }) }
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

  if (isLoading || !server) return (
    <Layout title="Loading...">
      <div className="animate-pulse h-96 bg-card rounded-xl" />
    </Layout>
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "console", label: "Console", icon: <TerminalIcon className="w-4 h-4" /> },
    { key: "files", label: "Files", icon: <FolderOpen className="w-4 h-4" /> },
    { key: "plugins", label: "Plugins", icon: <Puzzle className="w-4 h-4" /> },
    { key: "subdomains", label: "Subdomains", icon: <Globe className="w-4 h-4" /> },
    { key: "stats", label: "Statistics", icon: <BarChart2 className="w-4 h-4" /> },
    { key: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <Layout
      title={server.name}
      actions={
        <div className="flex bg-secondary p-1 rounded-lg border border-border gap-0.5">
          <button onClick={() => handlePower('start')} disabled={actionPending || server.status === 'running'} className="p-2 rounded hover:bg-background text-green-500 disabled:opacity-30 transition-colors" title="Start"><Play className="w-5 h-5 fill-current" /></button>
          <button onClick={() => handlePower('restart')} disabled={actionPending} className="p-2 rounded hover:bg-background text-blue-500 disabled:opacity-30 transition-colors" title="Restart"><RotateCcw className="w-5 h-5" /></button>
          <button onClick={() => handlePower('stop')} disabled={actionPending || server.status === 'stopped'} className="p-2 rounded hover:bg-background text-orange-500 disabled:opacity-30 transition-colors" title="Stop"><Square className="w-5 h-5 fill-current" /></button>
          <button onClick={() => handlePower('kill')} disabled={actionPending} className="p-2 rounded hover:bg-background text-destructive disabled:opacity-30 transition-colors" title="Kill"><Power className="w-5 h-5" /></button>
        </div>
      }
    >
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
        <StatusBadge status={server.status} className="px-4 py-1.5 text-sm" />
        <span className="text-muted-foreground font-mono text-xs bg-secondary px-2 py-1 rounded">{server.id.substring(0, 12)}…</span>
        <span className="text-muted-foreground text-sm">Port: <span className="font-mono text-foreground">{server.port}</span></span>
        <span className="text-muted-foreground text-sm capitalize">{server.serverType} {server.version}</span>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn("px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "console" && <ConsoleTab serverId={server.id} />}
        {activeTab === "files" && <FilesTab serverId={server.id} />}
        {activeTab === "plugins" && <PluginsTab serverId={server.id} />}
        {activeTab === "subdomains" && <SubdomainsTab serverId={server.id} serverPort={server.port} />}
        {activeTab === "stats" && stats && <StatsTab stats={stats} />}
        {activeTab === "stats" && !stats && <div className="text-muted-foreground">Loading stats...</div>}
        {activeTab === "settings" && (
          <SettingsTab
            server={server}
            onDeleted={() => { if (id) deleteServer({ id }); }}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ["/api/servers", id] })}
          />
        )}
      </div>
    </Layout>
  );
}

function ConsoleTab({ serverId }: { serverId: string }) {
  const wsUrl = window.location.protocol === 'https:'
    ? `wss://${window.location.host}/ws/servers/${serverId}/console`
    : `ws://${window.location.host}/ws/servers/${serverId}/console`;
  const { messages: wsMessages, isConnected } = useWebSocket(wsUrl);
  const { data: initialLogs } = useGetServerLogs(serverId, { lines: 100 }, { query: { enabled: !!serverId } });
  const { mutate: sendCommand } = useSendServerCommand();
  const [cmd, setCmd] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [allMessages, setAllMessages] = useState<string[]>([]);

  useEffect(() => {
    if (initialLogs?.logs) setAllMessages(initialLogs.logs);
  }, [initialLogs?.logs]);

  useEffect(() => {
    if (wsMessages.length > 0) {
      setAllMessages(prev => [...prev, wsMessages[wsMessages.length - 1]]);
    }
  }, [wsMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [allMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmd.trim()) return;
    sendCommand({ id: serverId, data: { command: cmd } });
    setAllMessages(prev => [...prev, `> ${cmd}`]);
    setCmd("");
  };

  const renderMessage = (msg: string, idx: number) => {
    const clean = msg.replace(/\x1b\[[0-9;]*m/g, "");
    const isCmd = clean.startsWith('> ');
    const isWarn = clean.includes('/WARN') || clean.includes('[WARN]');
    const isError = clean.includes('/ERROR') || clean.includes('[ERROR]') || clean.includes('/FATAL');
    return (
      <div key={idx} className={cn("hover:bg-white/5 px-2 py-0.5 whitespace-pre-wrap break-all font-mono text-xs leading-relaxed",
        isCmd ? "text-cyan-400" : isError ? "text-red-400" : isWarn ? "text-yellow-400" : "text-green-300"
      )}>
        {clean}
      </div>
    );
  };

  return (
    <div className="bg-black/90 border border-border rounded-xl overflow-hidden flex flex-col h-[600px] shadow-2xl">
      <div className="bg-secondary/50 px-4 py-2 border-b border-border flex justify-between items-center text-xs text-muted-foreground font-mono">
        <span>root@vortex-node:~#</span>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
            <span className={cn("relative inline-flex rounded-full h-2 w-2", isConnected ? "bg-primary" : "bg-red-500")}></span>
          </span>
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {allMessages.length === 0 && <div className="text-muted-foreground italic text-sm">Waiting for console output...</div>}
        {allMessages.map(renderMessage)}
      </div>
      <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-secondary/30 flex gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-mono select-none">&gt;</span>
          <input
            type="text" value={cmd} onChange={e => setCmd(e.target.value)} disabled={!isConnected}
            placeholder="Enter command..." autoComplete="off"
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

function FilesTab({ serverId }: { serverId: string }) {
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState("/");
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const { data: fileList, isLoading: listLoading } = useListServerFiles(serverId, { path: currentPath }, { query: { enabled: !!serverId } });
  const { data: fileContent, isLoading: contentLoading } = useReadServerFile(serverId, { path: selectedFile?.path ?? "" }, {
    query: { enabled: !!selectedFile?.path }
  });

  const { mutate: writeFile } = useWriteServerFile({
    mutation: {
      onSuccess: () => {
        setSaveStatus("saved");
        setIsDirty(false);
        setTimeout(() => setSaveStatus("idle"), 2000);
        queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "/files"] });
      },
      onError: () => { setSaveStatus("error"); setTimeout(() => setSaveStatus("idle"), 2000); }
    }
  });

  const { mutate: deleteFile } = useDeleteServerFile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "/files"] });
        if (selectedFile) setSelectedFile(null);
      }
    }
  });

  useEffect(() => {
    if (fileContent?.content !== undefined) {
      setEditorContent(fileContent.content);
      setIsDirty(false);
    }
  }, [fileContent?.content]);

  const openFile = (path: string) => {
    setSelectedFile({ path, content: "" });
    setEditorContent("");
    setIsDirty(false);
    setSaveStatus("idle");
  };

  const handleSave = () => {
    if (!selectedFile) return;
    setSaveStatus("saving");
    writeFile({ id: serverId, params: { path: selectedFile.path }, data: { content: editorContent } });
  };

  const breadcrumbs = currentPath === "/" ? ["/"] : ["", ...currentPath.split("/").filter(Boolean)];
  const navigateUp = () => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length === 0 ? "/" : "/" + parts.join("/"));
  };

  const isBinary = (name: string) => /\.(jar|zip|gz|png|jpg|jpeg|gif|ico|class|dat|mca|mcr)$/i.test(name);
  const getFileIcon = (name: string, isDir: boolean) => {
    if (isDir) return <Folder className="w-4 h-4 text-yellow-400" />;
    if (/\.(yml|yaml)$/i.test(name)) return <File className="w-4 h-4 text-green-400" />;
    if (/\.properties$/i.test(name)) return <File className="w-4 h-4 text-blue-400" />;
    if (/\.json$/i.test(name)) return <File className="w-4 h-4 text-orange-400" />;
    if (/\.jar$/i.test(name)) return <File className="w-4 h-4 text-red-400" />;
    if (/\.log$/i.test(name)) return <File className="w-4 h-4 text-gray-400" />;
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="grid grid-cols-5 gap-4 h-[600px]">
      <div className="col-span-2 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
            {currentPath !== "/" && (
              <button onClick={navigateUp} className="p-1 hover:text-foreground hover:bg-secondary rounded">
                <ArrowLeft className="w-3 h-3" />
              </button>
            )}
            {breadcrumbs.map((seg, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>{seg || "/"}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="p-4 space-y-2">{[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-secondary rounded animate-pulse" />)}</div>
          ) : fileList?.entries.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Empty directory</div>
          ) : (
            fileList?.entries.map(entry => (
              <div
                key={entry.path}
                onClick={() => {
                  if (entry.isDir) { setCurrentPath(entry.path); setSelectedFile(null); }
                  else if (!isBinary(entry.name)) openFile(entry.path);
                }}
                className={cn("flex items-center gap-2 px-3 py-2 hover:bg-secondary cursor-pointer transition-colors text-sm group",
                  selectedFile?.path === entry.path && "bg-primary/10 text-primary"
                )}
              >
                {getFileIcon(entry.name, entry.isDir)}
                <span className="flex-1 truncate">{entry.name}</span>
                {!entry.isDir && !isBinary(entry.name) && (
                  <span className="text-xs text-muted-foreground">{entry.size > 1024 ? `${(entry.size / 1024).toFixed(1)}KB` : `${entry.size}B`}</span>
                )}
                {isBinary(entry.name) && <span className="text-xs text-muted-foreground italic">binary</span>}
                {!entry.isDir && (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${entry.name}?`)) deleteFile({ id: serverId, params: { path: entry.path } }); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="col-span-3 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
        {!selectedFile ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Select a file to view and edit its contents</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(selectedFile.path.split("/").pop()!, false)}
                <span className="text-sm font-medium truncate">{selectedFile.path.split("/").pop()}</span>
                {isDirty && <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" title="Unsaved changes" />}
              </div>
              <button
                onClick={handleSave}
                disabled={!isDirty || saveStatus === "saving"}
                className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0",
                  saveStatus === "saved" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                    saveStatus === "error" ? "bg-destructive/20 text-destructive border border-destructive/30" :
                      isDirty ? "bg-primary text-primary-foreground hover:bg-primary/90" :
                        "bg-secondary text-muted-foreground cursor-not-allowed"
                )}
              >
                {saveStatus === "saving" ? <><RefreshCw className="w-3 h-3 animate-spin" /> Saving...</> :
                  saveStatus === "saved" ? <><Check className="w-3 h-3" /> Saved!</> :
                    saveStatus === "error" ? <><X className="w-3 h-3" /> Error</> :
                      <><Save className="w-3 h-3" /> Save</>}
              </button>
            </div>
            {contentLoading ? (
              <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <textarea
                value={editorContent}
                onChange={e => { setEditorContent(e.target.value); setIsDirty(true); setSaveStatus("idle"); }}
                onKeyDown={e => { if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave(); } }}
                spellCheck={false}
                className="flex-1 bg-transparent p-4 font-mono text-xs resize-none focus:outline-none text-foreground leading-relaxed"
                placeholder="File contents..."
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

const POPULAR_PLUGINS = [
  "EssentialsX", "WorldGuard", "WorldEdit", "LuckPerms", "Vault",
  "ProtocolLib", "ViaVersion", "CoreProtect", "GriefPrevention",
  "PlaceholderAPI", "Citizens", "DiscordSRV",
];

function PluginsTab({ serverId }: { serverId: string }) {
  const queryClient = useQueryClient();
  const [showInstall, setShowInstall] = useState(false);
  const [search, setSearch] = useState("");
  const [installName, setInstallName] = useState("");

  const { data: plugins, isLoading } = useListServerPlugins(serverId, { query: { enabled: !!serverId } });
  const { mutate: installPlugin, isPending: installing } = useInstallServerPlugin({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "/plugins"] }); setShowInstall(false); setInstallName(""); } }
  });
  const { mutate: togglePlugin } = useToggleServerPlugin({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "/plugins"] }) }
  });
  const { mutate: removePlugin } = useRemoveServerPlugin({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "/plugins"] }) }
  });

  const filtered = plugins?.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const notInstalled = POPULAR_PLUGINS.filter(n => !plugins?.some(p => p.name === n));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text" placeholder="Search plugins..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl py-2 pl-4 pr-4 text-sm focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <button
          onClick={() => setShowInstall(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Install Plugin
        </button>
      </div>

      {showInstall && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Puzzle className="w-4 h-4 text-primary" /> Install Plugin</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
            {notInstalled.map(name => (
              <button
                key={name}
                onClick={() => setInstallName(name)}
                className={cn("px-3 py-2 rounded-lg text-sm border transition-all text-left",
                  installName === name ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 hover:bg-secondary"
                )}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text" placeholder="Or type a custom plugin name..." value={installName}
              onChange={e => setInstallName(e.target.value)}
              className="flex-1 bg-background border border-border rounded-lg py-2 px-4 text-sm focus:outline-none focus:border-primary"
            />
            <button
              onClick={() => installName && installPlugin({ id: serverId, data: { name: installName } })}
              disabled={!installName || installing}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90"
            >
              {installing ? "Installing..." : "Install"}
            </button>
            <button onClick={() => { setShowInstall(false); setInstallName(""); }} className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />)}</div>
      ) : filtered?.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center">
          <Puzzle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">No plugins installed</p>
          <p className="text-muted-foreground text-sm">Click "Install Plugin" to add plugins to your server</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered?.map(plugin => (
            <div key={plugin.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Puzzle className={cn("w-5 h-5", plugin.enabled ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{plugin.name}</span>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded font-mono">v{plugin.version}</span>
                  {!plugin.enabled && <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">Disabled</span>}
                </div>
                {plugin.description && <p className="text-sm text-muted-foreground truncate mt-0.5">{plugin.description}</p>}
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {plugin.author && <span>by {plugin.author}</span>}
                  <span>{(plugin.fileSize / 1024).toFixed(0)}KB</span>
                  <span className="font-mono">{plugin.filename}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => togglePlugin({ id: serverId, pluginId: plugin.id, data: { enabled: !plugin.enabled } })}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                    plugin.enabled ? "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10" : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
                  )}
                >
                  {plugin.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  {plugin.enabled ? "Enabled" : "Disabled"}
                </button>
                <button
                  onClick={() => confirm(`Remove ${plugin.name}?`) && removePlugin({ id: serverId, pluginId: plugin.id })}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubdomainsTab({ serverId, serverPort }: { serverId: string; serverPort: number }) {
  const queryClient = useQueryClient();
  const [newSub, setNewSub] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const { data: subdomains, isLoading } = useListServerSubdomains(serverId, { query: { enabled: !!serverId } });
  const { mutate: createSub, isPending: creating, error: createError } = useCreateServerSubdomain({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "/subdomains"] }); setNewSub(""); }
    }
  });
  const { mutate: deleteSub } = useDeleteServerSubdomain({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "/subdomains"] }) }
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000); });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-1 flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Add Subdomain</h3>
        <p className="text-sm text-muted-foreground mb-4">Create a subdomain pointing to your Minecraft server's port</p>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-background border border-border rounded-lg overflow-hidden focus-within:border-primary transition-colors">
            <input
              type="text" value={newSub} onChange={e => setNewSub(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="my-server"
              className="flex-1 py-2.5 px-4 bg-transparent text-sm focus:outline-none"
              onKeyDown={e => e.key === "Enter" && newSub && createSub({ id: serverId, data: { subdomain: newSub } })}
            />
            <span className="px-3 py-2.5 text-sm text-muted-foreground bg-secondary border-l border-border whitespace-nowrap">.vortexpanel.io</span>
          </div>
          <button
            onClick={() => newSub && createSub({ id: serverId, data: { subdomain: newSub } })}
            disabled={!newSub || creating}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {creating ? "Adding..." : "Add"}
          </button>
        </div>
        {createError && (
          <p className="text-sm text-destructive mt-2">{(createError as any)?.data?.error ?? "Failed to create subdomain"}</p>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Active Subdomains</h3>
        {isLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />)}</div>
        ) : !subdomains?.length ? (
          <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center">
            <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">No subdomains configured</p>
            <p className="text-muted-foreground text-sm">Add a subdomain above to make your server easier to connect to</p>
          </div>
        ) : (
          subdomains.map(sub => {
            const full = `${sub.subdomain}.vortexpanel.io:${sub.targetPort}`;
            return (
              <div key={sub.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-primary">{sub.subdomain}<span className="text-muted-foreground font-normal">.vortexpanel.io</span></div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span>→ port {sub.targetPort}</span>
                    <span className="text-xs text-green-500">● Active</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(full, sub.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-lg text-xs hover:bg-secondary/80 transition-colors"
                  >
                    {copied === sub.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied === sub.id ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={() => confirm(`Delete ${sub.subdomain}.vortexpanel.io?`) && deleteSub({ id: serverId, subId: sub.id })}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-secondary/50 border border-border rounded-xl p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How subdomains work</p>
        <p>Subdomains are aliases that point to your server's port. Players can connect using <span className="font-mono text-primary">yoursubdomain.vortexpanel.io:{serverPort}</span> instead of the IP address.</p>
      </div>
    </div>
  );
}

function StatsTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm text-muted-foreground font-medium mb-4 flex items-center gap-2"><Cpu className="w-4 h-4 text-primary" /> CPU Usage</h3>
          <div className="text-3xl font-bold mb-2 text-primary">{stats.cpuPercent.toFixed(1)}%</div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stats.cpuPercent)}%` }} />
          </div>
          <div className="h-24 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ v: stats.cpuPercent }]} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Bar dataKey="v" fill="hsl(187 100% 42%)" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm text-muted-foreground font-medium mb-4 flex items-center gap-2"><MemoryStick className="w-4 h-4 text-purple-500" /> Memory Usage</h3>
          <div className="text-3xl font-bold mb-0.5 text-purple-400">{formatBytes(stats.memoryUsed * 1024 * 1024)}</div>
          <div className="text-xs text-muted-foreground mb-3">/ {formatBytes(stats.memoryLimit * 1024 * 1024)}</div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (stats.memoryUsed / stats.memoryLimit) * 100)}%` }} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm text-muted-foreground font-medium mb-4 flex items-center gap-2"><HardDrive className="w-4 h-4 text-blue-500" /> Disk Usage</h3>
          <div className="text-3xl font-bold mb-0.5 text-blue-400">{formatBytes(stats.diskUsed * 1024 * 1024)}</div>
          <div className="text-xs text-muted-foreground mb-3">/ {formatBytes(stats.diskLimit * 1024 * 1024)}</div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-500", (stats.diskUsed / stats.diskLimit) > 0.8 ? "bg-destructive" : "bg-blue-500")}
              style={{ width: `${Math.min(100, (stats.diskUsed / stats.diskLimit) * 100)}%` }} />
          </div>
          <div className="text-xs text-right mt-1 text-muted-foreground">{((stats.diskUsed / stats.diskLimit) * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Uptime</p>
          <p className="text-xl font-bold font-mono">{formatUptime(stats.uptime)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Players</p>
          <p className="text-xl font-bold">{stats.playerCount} <span className="text-sm text-muted-foreground font-normal">online</span></p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Network In</p>
          <p className="text-xl font-bold font-mono text-green-400">{formatBytes(stats.networkRx)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Network Out</p>
          <p className="text-xl font-bold font-mono text-blue-400">{formatBytes(stats.networkTx)}</p>
        </div>
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds === 0) return "Offline";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function SettingsTab({ server, onDeleted, onSaved }: { server: any; onDeleted: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: server.name,
    description: server.description ?? "",
    memory: String(server.memory),
    disk: String(server.disk),
    maxPlayers: String(server.maxPlayers ?? 20),
    port: String(server.port),
  });
  const [saved, setSaved] = useState(false);

  const { mutate: updateServer, isPending } = useUpdateServer({
    mutation: {
      onSuccess: () => { setSaved(true); onSaved(); setTimeout(() => setSaved(false), 2000); },
    }
  });

  const handleSave = () => {
    updateServer({
      id: server.id,
      data: {
        name: form.name,
        description: form.description,
        memory: Number(form.memory),
        disk: Number(form.disk),
        maxPlayers: Number(form.maxPlayers),
        port: Number(form.port),
      }
    });
  };

  const field = (label: string, key: keyof typeof form, type = "text", hint?: string) => (
    <div>
      <label className="text-sm font-medium text-muted-foreground block mb-1.5">{label}</label>
      {key === "description" ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={2}
          className="w-full bg-background border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all resize-none"
        />
      ) : (
        <input
          type={type} value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full bg-background border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
        />
      )}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-5 flex items-center gap-2"><Pencil className="w-4 h-4 text-primary" /> Server Settings</h3>
        <div className="space-y-4">
          {field("Server Name", "name")}
          {field("Description", "description")}
          <div className="grid grid-cols-2 gap-4">
            {field("Memory (MB)", "memory", "number", "RAM allocated to this server")}
            {field("Disk (MB)", "disk", "number", "Maximum disk space")}
            {field("Max Players", "maxPlayers", "number", "Maximum concurrent players")}
            {field("Port", "port", "number", "Server port (must be unique)")}
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-border flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className={cn("px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2",
              saved ? "bg-green-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : isPending ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
          <div className="text-xs text-muted-foreground">
            Type: <span className="capitalize font-medium text-foreground">{server.serverType}</span> · 
            Java: <span className="font-medium text-foreground">{server.javaVersion}</span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Server Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ["Server ID", server.id.substring(0, 16) + "…"],
            ["Node ID", server.nodeId.substring(0, 16) + "…"],
            ["Version", `${server.version} (${server.serverType})`],
            ["Java", server.javaVersion],
            ["Created", new Date(server.createdAt).toLocaleDateString()],
            ["Last Updated", new Date(server.updatedAt).toLocaleDateString()],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-muted-foreground mb-0.5">{label}</p>
              <p className="font-mono text-xs bg-secondary inline-block px-2 py-0.5 rounded">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-destructive flex items-center gap-2 mb-2">
          <Trash2 className="w-5 h-5" /> Danger Zone
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Deleting this server is permanent. All files, plugins, and data will be removed.</p>
        <button
          onClick={() => window.confirm('Type DELETE to confirm') && onDeleted()}
          className="px-4 py-2 bg-destructive text-destructive-foreground font-medium rounded-lg hover:bg-destructive/90 transition-colors"
        >
          Delete Server
        </button>
      </div>
    </div>
  );
}
