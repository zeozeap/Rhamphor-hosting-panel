import { cn } from "@/lib/utils";

type Status = "running" | "stopped" | "starting" | "stopping" | "crashed" | "online" | "offline" | "maintenance" | string;

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const getStatusStyles = (s: string) => {
    switch (s.toLowerCase()) {
      case "running":
      case "online":
        return "bg-primary/10 text-primary border-primary/30 shadow-[0_0_10px_rgba(57,255,20,0.15)]";
      case "starting":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "stopping":
      case "maintenance":
        return "bg-orange-500/10 text-orange-500 border-orange-500/30";
      case "crashed":
      case "offline":
        return "bg-destructive/10 text-destructive border-destructive/30 shadow-[0_0_10px_rgba(255,0,0,0.15)]";
      case "stopped":
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusDot = (s: string) => {
    switch (s.toLowerCase()) {
      case "running":
      case "online":
        return "bg-primary shadow-[0_0_5px_rgba(57,255,20,0.8)] animate-pulse";
      case "starting":
        return "bg-yellow-500 animate-pulse";
      case "stopping":
      case "maintenance":
        return "bg-orange-500";
      case "crashed":
      case "offline":
        return "bg-destructive";
      case "stopped":
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider", getStatusStyles(status), className)}>
      <div className={cn("w-1.5 h-1.5 rounded-full", getStatusDot(status))} />
      {status}
    </div>
  );
}
