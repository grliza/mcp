#!/usr/bin/env node
import "./load-env.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { A1Client } from "./a1-client.js";
import { registerAllTools } from "./tools/index.js";
import { startHttpTransport } from "./http-transport.js";
import { NAME, VERSION } from "./version.js";
async function main() {
    const config = loadConfig();
    const logger = createLogger(config);
    logger.info("Starting A1 MCP Server");
    const client = new A1Client(config, logger);
    // Don't block startup on connect — a tool call retries auth lazily.
    try {
        await client.connect();
        logger.info("A1 client connected");
    }
    catch (err) {
        logger.warn({ err }, "Initial A1 connection failed — server will retry on first tool call");
    }
    const server = new McpServer({ name: NAME, version: VERSION }, { capabilities: { tools: {}, logging: {} } });
    registerAllTools(server, client, config.mode);
    //STDIO  
    //const transport = new StdioServerTransport();
    //await server.connect(transport);
    // HTTP	
    const httpCloser = await startHttpTransport(() => server, config, logger);
    logger.info(`A1 MCP server configured (mode: ${config.mode}, transport: ${config.transport})`);
    let shuttingDown = false;
    const shutdown = async (signal, exitCode = 0) => {
        if (shuttingDown)
            return;
        shuttingDown = true;
        logger.info({ signal }, "Shutting down A1 MCP Server");
        try {
            //await transport.close();
            await httpCloser?.();
        }
        catch (err) {
            logger.error({ err }, "Error closing transport");
        }
        try {
            await client.disconnect();
        }
        catch (err) {
            logger.error({ err }, "Error during disconnect");
        }
        process.exit(exitCode);
    };
    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.stdin.on("end", () => void shutdown("stdin-end"));
    process.stdin.on("close", () => void shutdown("stdin-close"));
    process.on("uncaughtException", (err) => {
        logger.error({ err }, "Uncaught exception");
        void shutdown("uncaughtException", 1);
    });
    process.on("unhandledRejection", (reason) => {
        logger.error({ reason }, "Unhandled rejection");
    });
}
main().catch((err) => {
    console.error("Fatal error starting A1 MCP Server:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map