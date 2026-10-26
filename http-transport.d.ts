import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type pino from "pino";
import type { TM1Config } from "./config.js";
export declare function startHttpTransport(buildServer: () => {
    server: McpServer;
    dispose: () => void;
}, config: TM1Config, logger: pino.Logger): Promise<() => Promise<void>>;
//# sourceMappingURL=http-transport.d.ts.map