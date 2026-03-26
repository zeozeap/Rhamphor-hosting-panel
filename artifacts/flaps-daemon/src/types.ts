export interface ServerConfig {
  id: string;
  name: string;
  memory: number;
  disk: number;
  port: number;
  serverType: string;
  version?: string;
  startCommand?: string;
  javaVersion?: string;
  eggId?: string;
  environment?: Record<string, string>;
}

export interface ServerProcess {
  id: string;
  config: ServerConfig;
  pid?: number;
  status: "stopped" | "starting" | "running" | "stopping" | "crashed";
  startedAt?: Date;
  stoppedAt?: Date;
  cpuUsage: number;
  memoryUsage: number;
  playerCount: number;
  consoleBuf: string[];
  consoleListeners: Set<(line: string) => void>;
}

export interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    speed: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usedPercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usedPercent: number;
  };
  network: {
    rx: number;
    tx: number;
  };
  uptime: number;
  loadAvg: number[];
}

export interface FlapsApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
