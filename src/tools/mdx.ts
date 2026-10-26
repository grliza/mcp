// MDX / cell tools for A1.
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { A1Client } from "../a1-client.js";
import { payloadResponse, actionResponse, FORMAT_SCHEMA, type ResponseFormat } from "./format.js";

export function registerMdxTools(server: McpServer, client: A1Client): void {
  server.tool(
    "a1_execute_mdx",
    "Execute an MDX query against the A1 server and return the cellset.",
    { mdx: z.string().describe("The MDX query string") },
    async ({ mdx }: { mdx: string }) => {
      const res = await client.mdx.execute(mdx);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.tool(
    "a1_set_cells",
    "Write cell values to a cube (destructive).",
    {
      name: z.string().describe("Cube name"),
      cells: z
        .array(z.object({ Axis: z.array(z.string()), Value: z.union([z.number(), z.string()]) }))
        .describe("Cells to write: axis = element names per dimension, value = numeric or string"),
      confirm: z.string().describe("Repeat the cube name to confirm"),
    },
    async ({
      name,
      cells,
      confirm,
    }: {
      name: string;
      cells: Array<{ Axis: string[]; Value: number | string }>;
      confirm: string;
    }) => {
      if (confirm !== name) {
        return { content: [{ type: "text", text: "confirm must equal cube name" }], isError: true };
      }
      await client.cubes.setCells(name, cells);
      return actionResponse({ cube: name, wrote: cells.length });
    },
  );

  server.tool(
    "a1_save_data",
    "Persist dirty data (all cubes, or a single cube by name).",
    {
      cube: z.string().optional().describe("Cube name to save (omit to save all)"),
    },
    async ({ cube: cubeMaybe }: { cube?: string | undefined }) => {
      const cube = cubeMaybe ?? undefined;
      if (cube) {
        await client.mdx.saveCube(cube);
      } else {
        await client.mdx.saveData();
      }
      return actionResponse({ saved: cube ?? "all" });
    },
  );
}
