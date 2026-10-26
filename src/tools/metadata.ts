// Metadata / server-info tools for A1.
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { A1Client } from "../a1-client.js";
import { payloadResponse, FORMAT_SCHEMA, type ResponseFormat } from "./format.js";

export function registerMetadataTools(server: McpServer, client: A1Client): void {
  // A1 exposes no dedicated server-info endpoint in the documented surface, so
  // this reports connection + auth reachability and object counts via the
  // list endpoints. Kept read-only and cheap.
  server.tool(
    "a1_get_server_state",
    "Snapshot of the A1 server: reachability, auth status, and object counts (cubes, dimensions, processes, chores).",
    {
      ...FORMAT_SCHEMA,
    },
    async ({ format }: { format: ResponseFormat }) => {
      const state = {
        connected: client.isConnected(),
        counts: {} as Record<string, number>,
      };
      try {
        const cubes = await client.cubes.list();
        state.counts.cubes = cubes.Cubes?.length ?? 0;
      } catch {
        state.counts.cubes = -1;
      }
      try {
        const dims = await client.dimensions.list();
        state.counts.dimensions = dims.Dimensions?.length ?? 0;
      } catch {
        state.counts.dimensions = -1;
      }
      try {
        const procs = await client.processes.list();
        state.counts.processes = procs.Processes?.length ?? 0;
      } catch {
        state.counts.processes = -1;
      }
      try {
        const chores = await client.chores.list();
        state.counts.chores = chores.Chores?.length ?? 0;
      } catch {
        state.counts.chores = -1;
      }
	  		console.log(state, format);
	return state;	
	/*		
      return payloadResponse(state, format, (s) =>
        `## A1 Server State\n\n` +
        `- Connected: ${s.connected}\n` +
        Object.entries(s.counts)
          .map(([k, v]) => `- ${k}: ${v < 0 ? "unavailable" : v}`)
          .join("\n"),
      );
	  
	  */
    },
  );
}
