// Cube tools for A1.
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

export function registerCubeTools(server: McpServer, client: A1Client): void {
  server.tool(
    "a1_list_cubes",
    "List all cubes on the A1 server.",
    { ...FORMAT_SCHEMA },
    async ({ format }: { format: ResponseFormat }) => {
      const { Cubes } = await client.cubes.list();
      const items = Cubes.map((c) => ({
        name: c.Name,
        hasRules: c.HasRules ?? false,
        dimensions: c.Dimensions.map((d) => d.Name),
        security: c.Security,
      }));
      return payloadResponse(items, format, (rows) =>
        renderTable(
          rows,
          columnsOf([
            "name",
            "hasRules",
            { header: "dimensions", get: (r) => r.dimensions.join(", ") },
          ]),
        ),
      );
    },
  );

  server.tool(
    "a1_get_cube",
    "Get a cube definition (dimensions, rules flag) by name.",
    { name: z.string().describe("Cube name"), ...FORMAT_SCHEMA },
    async ({ name, format }: { name: string; format: ResponseFormat }) => {
      const cube = await client.cubes.get(name);
      if (!cube) {
        return { content: [{ type: "text", text: `Cube '${name}' not found` }] };
      }
      return payloadResponse(cube, format, (c) =>
        `## ${c.Name}\n\nDimensions: ${c.Dimensions.map((d) => d.Name).join(", ")}\n` +
        `HasRules: ${c.HasRules ?? false}`,
      );
    },
  );

  server.tool(
    "a1_get_cube_rule",
    "Read the rules of a cube.",
    { name: z.string().describe("Cube name"), ...FORMAT_SCHEMA },
    async ({ name, format }: { name: string; format: ResponseFormat }) => {
      const { Rule } = await client.cubes.getRule(name);
      return payloadResponse({ cube: name, rule: Rule }, format, (p) =>
        `## ${p.cube} rules\n\n\`\`\`\n${p.rule}\n\`\`\``,
      );
    },
  );

  server.tool(
    "a1_check_cube_rule",
    "Validate cube rule syntax without applying it.",
    {
      name: z.string().describe("Cube name"),
      rule: z.string().describe("Rule text to validate"),
    },
    async ({ name, rule }: { name: string; rule: string }) => {
      await client.cubes.checkRule(name, rule);
      return actionResponse({ cube: name, valid: true });
    },
  );

  server.tool(
    "a1_set_cube_rule",
    "Set the rules of a cube (overwrites).",
    {
      name: z.string().describe("Cube name"),
      rule: z.string().describe("Rule text"),
      confirm: z.string().describe("Repeat the cube name to confirm"),
    },
    async ({ name, rule, confirm }: { name: string; rule: string; confirm: string }) => {
      if (confirm !== name) {
        return { content: [{ type: "text", text: "confirm must equal cube name" }], isError: true };
      }
      await client.cubes.setRule(name, rule);
      return actionResponse({ cube: name, updated: true });
    },
  );

  server.tool(
    "a1_list_cube_views",
    "List views defined on a cube.",
    { name: z.string().describe("Cube name"), ...FORMAT_SCHEMA },
    async ({ name, format }: { name: string; format: ResponseFormat }) => {
      const { Views } = await client.cubes.listViewNames(name);
      return payloadResponse(Views, format, (rows) =>
        renderTable(rows, columnsOf(["Name", "Type"])),
      );
    },
  );

  server.tool(
    "a1_trace_cell_calculation",
    "Trace how a cell value is calculated (rule/consolidation/simple).",
    {
      name: z.string().describe("Cube name"),
      coordinates: z.array(z.string()).describe("Element names per dimension, in cube dimension order"),
    },
    async ({ name, coordinates }: { name: string; coordinates: string[] }) => {
      const res = await client.cubes.traceCellCalculation(name, coordinates);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.tool(
    "a1_create_cube",
    "Create a new cube with the given dimensions (in order).",
    {
      name: z.string().describe("Cube name"),
      dimensions: z.array(z.string()).describe("Dimension names, in order"),
    },
    async ({ name, dimensions }: { name: string; dimensions: string[] }) => {
      await client.cubes.create(name, dimensions);
      return actionResponse({ cube: name, created: true, dimensions });
    },
  );

  server.tool(
    "a1_delete_cube",
    "Delete a cube (destructive).",
    {
      name: z.string().describe("Cube name"),
      confirm: z.string().describe("Repeat the cube name to confirm"),
    },
    async ({ name, confirm }: { name: string; confirm: string }) => {
      if (confirm !== name) {
        return { content: [{ type: "text", text: "confirm must equal cube name" }], isError: true };
      }
      await client.cubes.delete(name);
      return actionResponse({ cube: name, deleted: true });
    },
  );

  server.tool(
    "a1_create_picklist_cube",
    "Create a picklist cube for a cube.",
    { name: z.string().describe("Cube name") },
    async ({ name }: { name: string }) => {
      await client.cubes.createPicklistCube(name);
      return actionResponse({ cube: name, picklistCubeCreated: true });
    },
  );

  server.tool(
    "a1_get_view",
    "Get a single cube view definition (MDX or NativeView) by name.",
    { name: z.string().describe("Cube name"), viewName: z.string().describe("View name") },
    async ({ name, viewName }: { name: string; viewName: string }) => {
      const view = await client.cubes.getView(name, viewName);
      return { content: [{ type: "text", text: JSON.stringify(view, null, 2) }] };
    },
  );

  server.tool(
    "a1_create_view",
    "Create an MDX view on a cube from an MDX query.",
    {
      name: z.string().describe("Cube name"),
      viewName: z.string().describe("View name"),
      mdx: z.string().describe("MDX query defining the view"),
    },
    async ({ name, viewName, mdx }: { name: string; viewName: string; mdx: string }) => {
      await client.cubes.createMdxView(name, viewName, mdx);
      return actionResponse({ cube: name, view: viewName, created: true });
    },
  );

  server.tool(
    "a1_delete_view",
    "Delete a view from a cube (destructive).",
    {
      name: z.string().describe("Cube name"),
      viewName: z.string().describe("View name"),
      confirm: z.string().describe("Repeat the view name to confirm"),
    },
    async ({ name, viewName, confirm }: { name: string; viewName: string; confirm: string }) => {
      if (confirm !== viewName) {
        return { content: [{ type: "text", text: "confirm must equal view name" }], isError: true };
      }
      await client.cubes.deleteView(name, viewName);
      return actionResponse({ cube: name, view: viewName, deleted: true });
    },
  );
}
