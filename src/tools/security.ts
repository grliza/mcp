// Security / monitoring tools for A1.
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

export function registerSecurityTools(server: McpServer, client: A1Client): void {
  server.tool(
    "a1_get_client",
    "Get a client (user) definition and group membership.",
    { name: z.string().describe("Client (user) name"), ...FORMAT_SCHEMA },
    async ({ name, format }: { name: string; format: ResponseFormat }) => {
      const clientInfo = await client.security.getClient(name);
      if (!clientInfo) {
        return { content: [{ type: "text", text: `Client '${name}' not found` }] };
      }
      return payloadResponse(clientInfo, format, (c) =>
        `## ${c.Name}\n\nEnabled: ${c.Enabled}\nGroups: ${c.Groups.join(", ")}\n` +
        `Provider: ${c.Provider}\nType: ${c.Type}`,
      );
    },
  );

  server.tool(
    "a1_list_groups",
    "List all security groups.",
    { ...FORMAT_SCHEMA },
    async ({ format }: { format: ResponseFormat }) => {
      const { Groups } = await client.security.listGroups();
      return payloadResponse({ groups: Groups }, format, (p) =>
        `## Groups\n\n${p.groups.join(", ") || "_(none)_"}`,
      );
    },
  );

  server.tool(
    "a1_list_active_users",
    "List currently active users.",
    { ...FORMAT_SCHEMA },
    async ({ format }: { format: ResponseFormat }) => {
      const { ActiveUsers } = await client.monitoring.listActiveUsers();
      const items = ActiveUsers.map((u) => ({ user: u.User, duration: u.Duration }));
      return payloadResponse(items, format, (rows) =>
        renderTable(rows, columnsOf(["user", "duration"])),
      );
    },
  );

  server.tool(
    "a1_list_tasks",
    "List active server tasks (running requests).",
    { ...FORMAT_SCHEMA },
    async ({ format }: { format: ResponseFormat }) => {
      const { Tasks } = await client.monitoring.listTasks();
      const items = Tasks.map((t) => ({
        id: t.Id,
        client: t.Client,
        request: t.Request,
        status: t.Status,
        elapsed: t.ElapsedTime,
      }));
      return payloadResponse(items, format, (rows) =>
        renderTable(rows, columnsOf(["id", "client", "request", "status", "elapsed"])),
      );
    },
  );

  server.tool(
    "a1_cancel_task",
    "Cancel a running task.",
    {
      id: z.number().int().describe("Task ID"),
      confirm: z.string().describe("Repeat the task ID as a string to confirm"),
    },
    async ({ id, confirm }: { id: number; confirm: string }) => {
      if (confirm !== String(id)) {
        return { content: [{ type: "text", text: "confirm must equal the task ID" }], isError: true };
      }
      await client.monitoring.cancelTask(id);
      return { content: [{ type: "text", text: JSON.stringify({ task: id, cancelled: true }) }] };
    },
  );

  server.tool(
    "a1_create_client",
    "Create a client (user).",
    {
      name: z.string().describe("Client name"),
      friendlyName: z.string().optional().describe("Friendly name"),
      groups: z.array(z.string()).optional().describe("Groups to assign"),
    },
    async ({ name, friendlyName, groups }: { name: string; friendlyName?: string | undefined; groups?: string[] | undefined }) => {
      await client.security.createClient({
        Name: name,
        FriendlyName: friendlyName ?? name,
        Enabled: true,
        Type: "User",
        Groups: groups ?? [],
      });
      return actionResponse({ client: name, created: true });
    },
  );

  server.tool(
    "a1_delete_client",
    "Delete a client (user) — destructive.",
    {
      name: z.string().describe("Client name"),
      confirm: z.string().describe("Repeat the client name to confirm"),
    },
    async ({ name, confirm }: { name: string; confirm: string }) => {
      if (confirm !== name) {
        return { content: [{ type: "text", text: "confirm must equal client name" }], isError: true };
      }
      await client.security.deleteClient(name);
      return actionResponse({ client: name, deleted: true });
    },
  );

  server.tool(
    "a1_set_client_password",
    "Set a client's password.",
    {
      name: z.string().describe("Client name"),
      password: z.string().describe("New password"),
    },
    async ({ name, password }: { name: string; password: string }) => {
      await client.security.setClientPassword(name, password);
      return actionResponse({ client: name, passwordSet: true });
    },
  );

  server.tool(
    "a1_create_group",
    "Create a security group.",
    { name: z.string().describe("Group name") },
    async ({ name }: { name: string }) => {
      await client.security.createGroup([name]);
      return actionResponse({ group: name, created: true });
    },
  );

  server.tool(
    "a1_delete_group",
    "Delete a security group — destructive.",
    {
      name: z.string().describe("Group name"),
      confirm: z.string().describe("Repeat the group name to confirm"),
    },
    async ({ name, confirm }: { name: string; confirm: string }) => {
      if (confirm !== name) {
        return { content: [{ type: "text", text: "confirm must equal group name" }], isError: true };
      }
      await client.security.deleteGroup(name);
      return actionResponse({ group: name, deleted: true });
    },
  );
}
