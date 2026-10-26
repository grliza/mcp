// Lightweight response helpers — mirror of tm1-mcp-server's format.ts, trimmed
// to what the A1 core slice needs.
import { z } from "zod";

export const FORMAT_SCHEMA = {
  format: z
    .enum(["json", "markdown"])
    .optional()
    .default("json")
    .describe("'markdown' = human-readable table."),
};

export type ResponseFormat = "json" | "markdown";

export interface Column<T> {
  header: string;
  get: (row: T) => unknown;
}

export function columnsOf<T>(
  specs: readonly (keyof T & string | Column<T>)[],
): Column<T>[] {
  return specs.map((spec) =>
    typeof spec === "string"
      ? { header: spec, get: (row: T) => row[spec] }
      : spec,
  );
}

function mdEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s =
    typeof v === "string"
      ? v
      : Array.isArray(v)
        ? v.join(", ")
        : typeof v === "object"
          ? JSON.stringify(v)
          : String(v);
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ").replace(/\r/g, "");
}

export function renderTable<T>(rows: readonly T[], columns: Column<T>[]): string {
  if (rows.length === 0) return "_(no rows)_";
  const headers = columns.map((c) => c.header);
  const lines = [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(
      (row) => `| ${columns.map((c) => mdEscape(c.get(row))).join(" | ")} |`,
    ),
  ];
  return lines.join("\n");
}

interface TextResult {
  [x: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: { [k: string]: unknown };
}

export function markdownResult(markdown: string): TextResult {
  return {
    content: [{ type: "text" as const, text: markdown }],
    structuredContent: { markdown },
  };
}

export function payloadResponse<T>(
  payload: T,
  format: ResponseFormat,
  renderMarkdown: (p: T) => string,
): TextResult {
  if (format === "markdown") {
    return markdownResult(renderMarkdown(payload));
  }
  return {
	content: [{ type: "text" as const, text: JSON.stringify(payload)}],
  };
}

export function actionResponse<T extends object>(payload: T): TextResult {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
    structuredContent: payload as unknown as { [k: string]: unknown },
  };
}
