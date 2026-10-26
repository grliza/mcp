// A1 facade. Domain REST calls live in service classes (this.cubes, etc.).
// Connection lifecycle (authenticate / disconnect) lives here.
import type pino from "pino";
import type { A1Config } from "./config.js";
import { A1HttpClient } from "./a1-client/http.js";
import { CubeService } from "./a1-client/services/cube-service.js";
import { DimensionService } from "./a1-client/services/dimension-service.js";
import { SecurityService } from "./a1-client/services/security-service.js";
import { ProcessService } from "./a1-client/services/process-service.js";
import { ChoreService } from "./a1-client/services/chore-service.js";
import { MonitoringService } from "./a1-client/services/monitoring-service.js";
import { MdxService } from "./a1-client/services/mdx-service.js";

export class A1Client {
  private connected = false;

  private readonly http: A1HttpClient;
  private readonly logger: pino.Logger;
  private readonly config: A1Config;

  readonly cubes: CubeService;
  readonly dimensions: DimensionService;
  readonly security: SecurityService;
  readonly processes: ProcessService;
  readonly chores: ChoreService;
  readonly monitoring: MonitoringService;
  readonly mdx: MdxService;

  constructor(config: A1Config, logger: pino.Logger) {
    this.config = config;
    this.logger = logger;
    this.http = new A1HttpClient(config, logger);

    this.cubes = new CubeService(this.http);
    this.dimensions = new DimensionService(this.http);
    this.security = new SecurityService(this.http);
    this.processes = new ProcessService(this.http);
    this.chores = new ChoreService(this.http);
    this.monitoring = new MonitoringService(this.http);
    this.mdx = new MdxService(this.http);
  }

  async connect(): Promise<void> {
    this.logger.info("Connecting to A1 server");
    await this.http.connect();
    this.connected = true;
    this.logger.info("Connected to A1 server");
  }

  async disconnect(): Promise<void> {
    this.logger.info("Disconnecting from A1 server");
    await this.http.disconnect();
    this.connected = false;
    this.logger.info("Disconnected from A1 server");
  }

  isConnected(): boolean {
    return this.connected;
  }
}
