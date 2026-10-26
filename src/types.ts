// ── Error codes ──────────────────────────────────────────────────────────────
// Mirrors tm1-mcp-server's error taxonomy, with A1-specific wording.

export const A1ErrorCode = {
  CONNECTION_FAILED: "CONNECTION_FAILED",
  LOCK_TIMEOUT: "LOCK_TIMEOUT",
  AUTH_FAILED: "AUTH_FAILED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  A1_ERROR: "A1_ERROR",
  UNSUPPORTED_OPERATION: "UNSUPPORTED_OPERATION",
} as const;

export type A1ErrorCode = (typeof A1ErrorCode)[keyof typeof A1ErrorCode];

export class A1Error extends Error {
  readonly code: A1ErrorCode;
  readonly httpStatus?: number | undefined;
  readonly endpoint?: string | undefined;
  readonly details?: string | undefined;
  hintOverride?: string | undefined;

  constructor(opts: {
    code: A1ErrorCode;
    message: string;
    httpStatus?: number | undefined;
    endpoint?: string | undefined;
    details?: string | undefined;
    hint?: string | undefined;
  }) {
    super(opts.message);
    this.name = "A1Error";
    this.code = opts.code;
    this.httpStatus = opts.httpStatus;
    this.endpoint = opts.endpoint;
    this.details = opts.details;
    this.hintOverride = opts.hint;
  }

  get hint(): string {
    return this.hintOverride ?? hintForCode(this.code);
  }

  toErrorPayload(): {
    code: A1ErrorCode;
    message: string;
    httpStatus?: number | undefined;
    endpoint?: string | undefined;
    details?: string | undefined;
    hint: string;
  } {
    return {
      code: this.code,
      message: this.message,
      ...(this.httpStatus !== undefined && { httpStatus: this.httpStatus }),
      ...(this.endpoint !== undefined && { endpoint: this.endpoint }),
      ...(this.details !== undefined && { details: this.details }),
      hint: this.hint,
    };
  }
}

export function hintForCode(code: A1ErrorCode | string): string {
  switch (code) {
    case A1ErrorCode.AUTH_FAILED:
      return "Re-check A1_USER/A1_PASSWORD env vars; verify access to the A1 server.";
    case A1ErrorCode.PERMISSION_DENIED:
      return "Caller lacks rights for this object/operation. Check group membership.";
    case A1ErrorCode.NOT_FOUND:
      return "Object does not exist. Use the matching list_* or get_* tool to enumerate available names before retrying.";
    case A1ErrorCode.CONFLICT:
      return "Object already exists or version mismatch. Fetch current state with the matching get_* tool, then retry.";
    case A1ErrorCode.VALIDATION_ERROR:
      return "Input failed validation. Inspect the `details` field for the offending value and correct it.";
    case A1ErrorCode.UNSUPPORTED_OPERATION:
      return "A1 server version may not support this operation.";
    case A1ErrorCode.CONNECTION_FAILED:
      return "A1 server unreachable. Verify A1_BASE_URL and that the service is running.";
    case A1ErrorCode.LOCK_TIMEOUT:
      return "Request timed out — A1 server may be busy. Retry after the blocking operation completes.";
    case A1ErrorCode.A1_ERROR:
      return "Generic A1 error. Inspect `details` for the raw server message.";
    default:
      return "Unexpected error. Inspect `message`/`details` and retry with corrected input.";
  }
}

// ── Domain types (A1 REST shapes) ────────────────────────────────────────────

export interface A1Element {
  Name: string;
  Type: "Numeric" | "String" | "Consolidated";
  Index: number;
  Level: number;
  UniqueName: string;
  Attributes?: Record<string, unknown>;
  Parents?: Array<{ Index: number; Name: string }>;
}

export interface A1Edge {
  ComponentName: string;
  ParentName: string;
  Weight: number;
}

export interface A1ElementAttribute {
  Name: string;
  Type: "String" | "Numeric" | "Alias";
}

export interface A1Dimension {
  Name: string;
  Type: "Dimension";
  Security?: string;
}

export interface A1DimensionFull {
  Name: string;
  Type: "Dimension";
  Elements: A1Element[];
  Edges: A1Edge[];
  ElementAttributes: A1ElementAttribute[];
  Subsets: unknown[];
}

export interface A1Cube {
  Name: string;
  Type: "Cube";
  Security?: string;
  HasRules?: boolean;
  Dimensions: Array<{ Name: string; Type: string }>;
}

export interface A1Process {
  Name: string;
  HasSecurityAccess?: boolean;
  IsCorrect?: boolean;
  Security?: string;
  Parameters?: A1Parameter[];
}

export interface A1Parameter {
  Name: string;
  Type: "String" | "Numeric";
  Value?: string | number;
  Prompt?: string;
}

export interface A1Chore {
  Name: string;
  Active?: boolean;
  Frequency?: string;
  StartTime?: string;
  Tasks?: Array<{ Process: string; Parameters: unknown[] }>;
}

export interface A1Subset {
  Name: string;
  Alias?: string;
  Dynamic?: boolean;
  Elements?: string[];
  Expression?: string;
}

export interface A1View {
  Name: string;
  Type: "NativeView" | "MDXView";
}

// MDX execution result (POST /ExecMDX).
export interface A1MdxResult {
  Axes: Array<{
    Ordinal: number;
    Cardinality: number;
    Hierarchies: Array<{ Name: string }>;
    Tuples: Array<{
      Ordinal: number;
      Members: Array<{ UniqueName: string }>;
    }>;
    Type: number;
  }>;
  Cells: Array<{
    Ordinal: number;
    Value: string | number;
    FormattedValue?: string;
    FormatString?: string;
    Consolidated?: boolean;
    RuleDerived?: boolean;
    Updatable?: boolean;
  }>;
  Cube: {
    Name: string;
    Dimensions: Array<{ Name: string }>;
  };
}
