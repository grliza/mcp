import type pino from "pino";
import type { A1Config } from "./config.js";
import { CubeService } from "./a1-client/services/cube-service.js";
import { DimensionService } from "./a1-client/services/dimension-service.js";
import { SecurityService } from "./a1-client/services/security-service.js";
import { ProcessService } from "./a1-client/services/process-service.js";
import { ChoreService } from "./a1-client/services/chore-service.js";
import { MonitoringService } from "./a1-client/services/monitoring-service.js";
import { MdxService } from "./a1-client/services/mdx-service.js";
export declare class A1Client {
    private connected;
    private readonly http;
    private readonly logger;
    private readonly config;
    readonly cubes: CubeService;
    readonly dimensions: DimensionService;
    readonly security: SecurityService;
    readonly processes: ProcessService;
    readonly chores: ChoreService;
    readonly monitoring: MonitoringService;
    readonly mdx: MdxService;
    constructor(config: A1Config, logger: pino.Logger);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
}
//# sourceMappingURL=a1-client.d.ts.map