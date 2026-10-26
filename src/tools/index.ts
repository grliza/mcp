// Aggregate tool registration with a readonly/readwrite gate.
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { A1Client } from "../a1-client.js";
import type { A1Config } from "../config.js";
import { registerMetadataTools } from "./metadata.js";
import { registerCubeTools } from "./cubes.js";
import { registerDimensionTools } from "./dimensions.js";
import { registerProcessTools } from "./processes.js";
import { registerChoreTools } from "./chores.js";
import { registerSecurityTools } from "./security.js";
import { registerMdxTools } from "./mdx.js";
import { WRITE_TOOLS } from "./write-tools.js";

// A server facade that silently drops write/destructive tools in readonly mode.
// The register* functions call `server.tool(name, ...)`; this proxy inspects the
// name and skips registration when it is in WRITE_TOOLS and mode === "readonly",
// so those tools never appear in tools/list and cannot be invoked.
function gatedServer(
  server: McpServer,
  mode: A1Config["mode"],
): McpServer {
  if (mode !== "readonly") return server;
  const originalTool = server.tool.bind(server);
  return new Proxy(server, {
    get(target, prop, receiver) {
      if (prop !== "tool") return Reflect.get(target, prop, receiver);
      return (name: string, ...rest: unknown[]) => {
        if (WRITE_TOOLS.has(name)) {
          return undefined; // dropped in readonly mode
        }
        return (originalTool as (...a: unknown[]) => unknown)(name, ...rest);
      };
    },
  });
}

export function registerAllTools(
  server: McpServer,
  client: A1Client,
  mode: A1Config["mode"],
): void {
  const s = gatedServer(server, mode);
  registerMetadataTools(s, client);
  registerCubeTools(s, client);
  registerDimensionTools(s, client);
  registerProcessTools(s, client);
  registerChoreTools(s, client);
  registerSecurityTools(s, client);
  registerMdxTools(s, client);
}
