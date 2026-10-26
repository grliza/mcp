// Dimension tools for A1.
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

export function registerDimensionTools(
  server: McpServer,
  client: A1Client,
): void {
  server.tool(
    "a1_list_dimensions",
    "List all dimensions on the A1 server.",
    { ...FORMAT_SCHEMA },
    async ({ format }: { format: ResponseFormat }) => {
      const { Dimensions } = await client.dimensions.list();
      const items = Dimensions.map((d) => ({
        name: d.Name,
        security: d.Security,
      }));
      return payloadResponse(items, format, (rows) =>
        renderTable(rows, columnsOf(["name", "security"])),
      );
    },
  );

  server.tool(
    "a1_get_dimension",
    "Get a dimension's full structure (elements, edges, attributes).",
    { name: z.string().describe("Dimension name"), ...FORMAT_SCHEMA },
    async ({ name, format }: { name: string; format: ResponseFormat }) => {
      const dim = await client.dimensions.get(name);
      if (!dim) {
        return { content: [{ type: "text", text: `Dimension '${name}' not found` }] };
      }
      return payloadResponse(dim, format, (d) => {
        const elements = d.Elements.map((e) => e.Name).join(", ");
        return `## ${d.Name}\n\nElements: ${elements}\n`;
      });
    },
  );

  server.tool(
    "a1_list_dimension_elements",
    "List the elements of a dimension.",
    { name: z.string().describe("Dimension name"), ...FORMAT_SCHEMA },
    async ({ name, format }: { name: string; format: ResponseFormat }) => {
      const { Elements } = await client.dimensions.getElements(name);
      const items = Elements.map((e) => ({
        name: e.Name,
        type: e.Type,
        level: e.Level,
        uniqueName: e.UniqueName,
      }));
      return payloadResponse(items, format, (rows) =>
        renderTable(rows, columnsOf(["name", "type", "level", "uniqueName"])),
      );
    },
  );

  server.tool(
    "a1_get_dimension_edges",
    "Get the parent/child edges of a dimension.",
    { name: z.string().describe("Dimension name"), ...FORMAT_SCHEMA },
    async ({ name, format }: { name: string; format: ResponseFormat }) => {
      const { Edges } = await client.dimensions.getEdges(name);
      const items = Edges.map((e) => ({
        parent: e.ParentName,
        component: e.ComponentName,
        weight: e.Weight,
      }));
      return payloadResponse(items, format, (rows) =>
        renderTable(rows, columnsOf(["parent", "component", "weight"])),
      );
    },
  );

  server.tool(
    "a1_list_dimension_attributes",
    "List the element attribute definitions of a dimension.",
    { name: z.string().describe("Dimension name"), ...FORMAT_SCHEMA },
    async ({ name, format }: { name: string; format: ResponseFormat }) => {
      const { ElementAttributes } = await client.dimensions.getAttributes(name);
      const items = ElementAttributes.map((a) => ({ name: a.Name, type: a.Type }));
      return payloadResponse(items, format, (rows) =>
        renderTable(rows, columnsOf(["name", "type"])),
      );
    },
  );

  server.tool(
    "a1_list_dimension_subsets",
    "List the subsets of a dimension.",
    { name: z.string().describe("Dimension name"), ...FORMAT_SCHEMA },
    async ({ name, format }: { name: string; format: ResponseFormat }) => {
      const { Subsets } = await client.dimensions.listSubsets(name);
      const items = Subsets.map((s) => ({ name: s.Name, dynamic: s.Dynamic }));
      return payloadResponse(items, format, (rows) =>
        renderTable(rows, columnsOf(["name", "dynamic"])),
      );
    },
  );

  server.tool(
    "a1_get_dimension_cubes",
    "Get the cubes that use a dimension.",
    { name: z.string().describe("Dimension name"), ...FORMAT_SCHEMA },
    async ({ name, format }: { name: string; format: ResponseFormat }) => {
      const { Cubes } = await client.dimensions.getCubesUsed(name);
      return payloadResponse({ dimension: name, cubes: Cubes }, format, (p) =>
        `## ${p.dimension}\n\n${p.cubes.join(", ")}`,
      );
    },
  );

  server.tool(
    "a1_get_dimension_max_level",
    "Get the maximum consolidation level of a dimension.",
    { name: z.string().describe("Dimension name") },
    async ({ name }: { name: string }) => {
      const level = await client.dimensions.getMaxLevel(name);
      return { content: [{ type: "text", text: JSON.stringify({ dimension: name, maxLevel: level }) }] };
    },
  );

  server.tool(
    "a1_create_dimension",
    "Create a new dimension (empty, no elements).",
    { name: z.string().describe("Dimension name") },
    async ({ name }: { name: string }) => {
      await client.dimensions.create({ Name: name });
      return actionResponse({ dimension: name, created: true });
    },
  );

  server.tool(
    "a1_delete_dimension",
    "Delete a dimension (destructive).",
    {
      name: z.string().describe("Dimension name"),
      confirm: z.string().describe("Repeat the dimension name to confirm"),
    },
    async ({ name, confirm }: { name: string; confirm: string }) => {
      if (confirm !== name) {
        return { content: [{ type: "text", text: "confirm must equal dimension name" }], isError: true };
      }
      await client.dimensions.delete(name);
      return actionResponse({ dimension: name, deleted: true });
    },
  );

  server.tool(
    "a1_create_element",
    "Create elements in a dimension.",
    {
      name: z.string().describe("Dimension name"),
      elements: z.array(z.object({ Name: z.string(), Type: z.string() })).describe("Elements to create: {Name, Type}"),
    },
    async ({ name, elements }: { name: string; elements: Array<{ Name: string; Type: string }> }) => {
      await client.dimensions.createElements(name, elements);
      return actionResponse({ dimension: name, created: elements.map((e) => e.Name) });
    },
  );

  server.tool(
    "a1_delete_element",
    "Delete an element from a dimension (destructive).",
    {
      name: z.string().describe("Dimension name"),
      element: z.string().describe("Element name"),
      confirm: z.string().describe("Repeat the element name to confirm"),
    },
    async ({ name, element, confirm }: { name: string; element: string; confirm: string }) => {
      if (confirm !== element) {
        return { content: [{ type: "text", text: "confirm must equal element name" }], isError: true };
      }
      await client.dimensions.deleteElement(name, element);
      return actionResponse({ dimension: name, element, deleted: true });
    },
  );

  server.tool(
    "a1_set_edges",
    "Set parent/child edges (consolidation) in a dimension.",
    {
      name: z.string().describe("Dimension name"),
      edges: z.array(z.object({ ParentName: z.string(), ComponentName: z.string(), Weight: z.number() })).describe("Edges: {ParentName, ComponentName, Weight}"),
    },
    async ({ name, edges }: { name: string; edges: Array<{ ParentName: string; ComponentName: string; Weight: number }> }) => {
      await client.dimensions.setEdges(name, edges);
      return actionResponse({ dimension: name, edgesSet: edges.length });
    },
  );

  server.tool(
    "a1_create_subset",
    "Create a subset in a dimension.",
    {
      name: z.string().describe("Dimension name"),
      subsetName: z.string().describe("Subset name"),
      elements: z.array(z.string()).describe("Element names in the subset"),
    },
    async ({ name, subsetName, elements }: { name: string; subsetName: string; elements: string[] }) => {
      await client.dimensions.createSubset(name, {
        Name: subsetName,
        Dimension: name,
        Alias: "",
        Elements: elements,
      });
      return actionResponse({ dimension: name, subset: subsetName, created: true });
    },
  );

  server.tool(
    "a1_delete_subset",
    "Delete a subset from a dimension (destructive).",
    {
      name: z.string().describe("Dimension name"),
      subsetName: z.string().describe("Subset name"),
      confirm: z.string().describe("Repeat the subset name to confirm"),
    },
    async ({ name, subsetName, confirm }: { name: string; subsetName: string; confirm: string }) => {
      if (confirm !== subsetName) {
        return { content: [{ type: "text", text: "confirm must equal subset name" }], isError: true };
      }
      await client.dimensions.deleteSubset(name, subsetName);
      return actionResponse({ dimension: name, subset: subsetName, deleted: true });
    },
  );
}
