// Chore tools for A1.
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { A1Client } from "../a1-client.js";
import {
  payloadResponse,
  renderTable,
  columnsOf,
  actionResponse,
  FORMAT_SCHEMA,
  type ResponseFormat,
} from "./format.js";

export function registerChoreTools(server: McpServer, client: A1Client): void {
  server.tool(
    "a1_list_chores",
    "List all chores on the A1 server.",
    { ...FORMAT_SCHEMA },
    async ({ format }: { format: ResponseFormat }) => {
      const { Chores } = await client.chores.list();
      const items = Chores.map((c) => ({
        name: c.Name,
        active: c.Active ?? false,
        frequency: c.Frequency,
        startTime: c.StartTime,
      }));
      return payloadResponse(items, format, (rows) =>
        renderTable(rows, columnsOf(["name", "active", "frequency", "startTime"])),
      );
    },
  );

  server.tool(
    "a1_get_chore",
    "Get a chore's definition and tasks.",
    { name: z.string().describe("Chore name"), ...FORMAT_SCHEMA },
    async ({ name, format }: { name: string; format: ResponseFormat }) => {
      const chore = await client.chores.get(name);
      if (!chore) {
        return { content: [{ type: "text", text: `Chore '${name}' not found` }] };
      }
      return payloadResponse(chore, format, (c) => {
        const tasks = (c.Tasks ?? []).map((t) => t.Process).join(", ");
        return `## ${c.Name}\n\nActive: ${c.Active}\nFrequency: ${c.Frequency}\nTasks: ${tasks || "_(none)_"}\n`;
      });
    },
  );

  server.tool(
    "a1_activate_chore",
    "Activate a chore.",
    { name: z.string().describe("Chore name") },
    async ({ name }: { name: string }) => {
      await client.chores.activate(name);
      return { content: [{ type: "text", text: JSON.stringify({ chore: name, active: true }) }] };
    },
  );

  server.tool(
    "a1_deactivate_chore",
    "Deactivate a chore.",
    { name: z.string().describe("Chore name") },
    async ({ name }: { name: string }) => {
      await client.chores.deactivate(name);
      return { content: [{ type: "text", text: JSON.stringify({ chore: name, active: false }) }] };
    },
  );

  server.tool(
    "a1_delete_chore",
    "Delete a chore (destructive).",
    {
      name: z.string().describe("Chore name"),
      confirm: z.string().describe("Repeat the chore name to confirm"),
    },
    async ({ name, confirm }: { name: string; confirm: string }) => {
      if (confirm !== name) {
        return { content: [{ type: "text", text: "confirm must equal chore name" }], isError: true };
      }
      await client.chores.delete(name);
      return actionResponse({ chore: name, deleted: true });
    },
  );
}
