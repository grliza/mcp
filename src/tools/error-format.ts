// Normalize errors thrown by a tool handler into a structured error result.
import type { A1Error } from "../types.js";

export function errorResult(err: unknown): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  const text =
    err instanceof Error
      ? err.message
      : `Unknown error: ${JSON.stringify(err)}`;
  return {
    content: [{ type: "text", text }],
    isError: true,
  };
}

export function toErrorPayload(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const base: Record<string, unknown> = {
      message: err.message,
    };
    if ((err as A1Error).code !== undefined) {
      base.code = (err as A1Error).code;
    }
    if ((err as A1Error).httpStatus !== undefined) {
      base.httpStatus = (err as A1Error).httpStatus;
    }
    if ((err as A1Error).details !== undefined) {
      base.details = (err as A1Error).details;
    }
    if ((err as A1Error).hint !== undefined) {
      base.hint = (err as A1Error).hint;
    }
    return base;
  }
  return { message: String(err) };
}
