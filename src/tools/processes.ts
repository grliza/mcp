// Process tools for A1.
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

export function registerProcessTools(server: McpServer, client: A1Client): void {
  server.tool(
    "a1_list_processes",
    "List all TI processes on the A1 server.",
    { ...FORMAT_SCHEMA },
    async ({ format }: { format: ResponseFormat }) => {
      const { Processes } = await client.processes.list();
      const items = Processes.map((p) => ({
        name: p.Name,
        hasSecurityAccess: p.HasSecurityAccess ?? false,
      }));
      return payloadResponse(items, format, (rows) =>
        renderTable(rows, columnsOf(["name", "hasSecurityAccess"])),
      );
    },
  );

  server.tool(
    "a1_get_process",
    "Get a process's full definition (procedures, parameters, variables).",
    { name: z.string().describe("Process name"), ...FORMAT_SCHEMA },
    async ({ name, format }: { name: string; format: ResponseFormat }) => {
      const proc = await client.processes.get(name);
      if (!proc) {
        return { content: [{ type: "text", text: `Process '${name}' not found` }] };
      }
      return payloadResponse(proc, format, (p) =>
        `## ${p.Name}\n\n` +
        `Parameters: ${p.Parameters.map((x) => x.Name).join(", ") || "_(none)_"}\n` +
        `Variables: ${p.Variables.map((x) => x.Name).join(", ") || "_(none)_"}\n`,
      );
    },
  );

  server.tool(
    "a1_execute_process",
    "Execute a TI process with parameters (destructive — mutates cells).",
    {
      name: z.string().describe("Process name"),
      parameters: z
        .array(z.object({ Name: z.string(), Value: z.union([z.string(), z.number()]) }))
        .optional()
        .describe("Parameter values"),
      confirm: z.string().describe("Repeat the process name to confirm"),
    },
    async ({
      name,
      parameters: paramsMaybe,
      confirm,
    }: {
      name: string;
      parameters?: Array<{ Name: string; Value: string | number }> | undefined;
      confirm: string;
    }) => {
      const parameters = paramsMaybe ?? [];
      if (confirm !== name) {
        return { content: [{ type: "text", text: "confirm must equal process name" }], isError: true };
      }
      await client.processes.execute(name, parameters ?? []);
      return { content: [{ type: "text", text: JSON.stringify({ process: name, executed: true }) }] };
    },
  );

  server.tool(
    "a1_list_odbc_sources",
    "List ODBC data sources available to the A1 server.",
    { ...FORMAT_SCHEMA },
    async ({ format }: { format: ResponseFormat }) => {
      const { ODBC } = await client.processes.listOdbcSources();
      const items = ODBC.map((o) => ({ name: o.Name, driver: o.Driver }));
      return payloadResponse(items, format, (rows) =>
        renderTable(rows, columnsOf(["name", "driver"])),
      );
    },
  );

  server.tool(
    "a1_preview_odbc",
    "Preview a SQL query against an ODBC source.",
    {
      dataSourceNameForClient: z.string().describe("ODBC source name"),
      sqlQuery: z.string().describe("SQL query"),
    },
    async ({
      dataSourceNameForClient,
      sqlQuery,
    }: {
      dataSourceNameForClient: string;
      sqlQuery: string;
    }) => {
      const res = await client.processes.previewOdbc(sqlQuery, dataSourceNameForClient);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.tool(
    "a1_create_process",
    "Create a TI process.",
    {
      name: z.string().describe("Process name"),
      prolog: z.string().optional().describe("Prolog procedure code"),
      metadata: z.string().optional().describe("Metadata procedure code"),
      data: z.string().optional().describe("Data procedure code"),
      epilog: z.string().optional().describe("Epilog procedure code"),
      parameters: z.array(z.object({ Name: z.string(), Type: z.enum(["String", "Numeric"]), Value: z.union([z.string(), z.number()]) })).optional().describe("Parameters"),
    },
    async ({
      name,
      prolog,
      metadata,
      data,
      epilog,
      parameters,
    }: {
      name: string;
      prolog?: string | undefined;
      metadata?: string | undefined;
      data?: string | undefined;
      epilog?: string | undefined;
      parameters?: Array<{ Name: string; Type: "String" | "Numeric"; Value: string | number }> | undefined;
    }) => {
      await client.processes.create({
        Name: name,
        HasSecurityAccess: false,
        PrologProcedure: prolog ?? "",
        MetadataProcedure: metadata ?? "",
        DataProcedure: data ?? "",
        EpilogProcedure: epilog ?? "",
        Parameters: (parameters ?? []).map((p) => ({ Name: p.Name, Type: p.Type, Value: p.Value, Prompt: "" })),
        Variables: [],
      });
      return actionResponse({ process: name, created: true });
    },
  );

  server.tool(
    "a1_delete_process",
    "Delete a TI process (destructive).",
    {
      name: z.string().describe("Process name"),
      confirm: z.string().describe("Repeat the process name to confirm"),
    },
    async ({ name, confirm }: { name: string; confirm: string }) => {
      if (confirm !== name) {
        return { content: [{ type: "text", text: "confirm must equal process name" }], isError: true };
      }
      await client.processes.delete(name);
      return actionResponse({ process: name, deleted: true });
    },
  );
}
