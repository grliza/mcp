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
};
export class A1Error extends Error {
    code;
    httpStatus;
    endpoint;
    details;
    hintOverride;
    constructor(opts) {
        super(opts.message);
        this.name = "A1Error";
        this.code = opts.code;
        this.httpStatus = opts.httpStatus;
        this.endpoint = opts.endpoint;
        this.details = opts.details;
        this.hintOverride = opts.hint;
    }
    get hint() {
        return this.hintOverride ?? hintForCode(this.code);
    }
    toErrorPayload() {
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
export function hintForCode(code) {
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
//# sourceMappingURL=types.js.map