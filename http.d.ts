import type pino from "pino";
import type { A1Config } from "../config.js";
export interface A1Session {
    access: string;
    refresh: string;
}
export interface RequestOptions {
    body?: unknown;
    headers?: Record<string, string>;
    timeoutMs?: number;
}
export declare class A1HttpClient {
    private readonly config;
    private readonly logger;
    private readonly dispatcher;
    private session;
    private authInFlight;
    constructor(config: A1Config, logger: pino.Logger);
    /** Whether a live session (access token) is held. */
    isAuthenticated(): boolean;
    private buildBase;
    private rawFetch;
    private requestJson;
    private classifyHttpError;
    /** Fetch the RSA public key for login. */
    private fetchPublicKey;
    /** Perform the full login handshake. */
    private login;
    /** Refresh the access token using the refresh token. */
    private refresh;
    /** Ensure a session exists (share a single in-flight login). */
    ensureSession(): Promise<A1Session>;
    /** Public request with re-auth-on-401 semantics. */
    request<T>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T>;
    /** Connect: authenticate and validate reachability. */
    connect(): Promise<void>;
    /** Logout: best-effort DELETE /Auth/Session. */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=http.d.ts.map