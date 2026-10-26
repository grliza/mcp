// A1 HTTP client: JWT bearer auth + refresh. Mirrors tm1-mcp-server's
// TM1HttpClient in structure but replaces Basic/cookie session state with an
// access/refresh token pair.
//
// Auth flow (see docs — section 7 of the A1 manual):
//   GET  /Auth/Session   -> { Alg, Key }            (fetch RSA public key)
//   POST /Auth/Session   -> { Access, Refresh }     (login)
//   POST /Auth/Refresh   -> { Access, Refresh }     (renew)
//   DELETE /Auth/Session -> (logout)
//
// Access token rides `Authorization: Bearer <jwt>`. On 401 we refresh once, then
// re-login if refresh itself is rejected.
import type pino from "pino";
import type { Agent } from "undici";
import { Agent as UndiciAgent, fetch as undiciFetch } from "undici";
import type { A1Config } from "../config.js";
import { A1Error, A1ErrorCode } from "../types.js";
import { rsaEncryptPassword } from "./auth.js";

const USER_AGENT = "a1-mcp-server";

export interface A1Session {
  access: string;
  refresh: string;
}

export interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export class A1HttpClient {
  private readonly config: A1Config;
  private readonly logger: pino.Logger;
  private readonly dispatcher: Agent;

  private session: A1Session | null = null;
  private authInFlight: Promise<A1Session> | null = null;

  constructor(config: A1Config, logger: pino.Logger) {
    this.config = config;
    this.logger = logger;
    this.dispatcher = new UndiciAgent({
      connect: { rejectUnauthorized: config.ssl.rejectUnauthorized },
      headersTimeout: 0,
      bodyTimeout: 0,
    });
  }

  /** Whether a live session (access token) is held. */
  isAuthenticated(): boolean {
    return this.session !== null;
  }

  private buildBase(path: string): string {
    const base = this.config.baseUrl.replace(/\/+$/, "");
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
  }

  private async rawFetch(
    method: string,
    path: string,
    init: {
      body?: string;
      headers: Record<string, string>;
    },
    timeoutMs: number,
  ): Promise<Response> {
    const url = this.buildBase(path);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return (await undiciFetch(
        url,
        {
          method,
          headers: init.headers,
          ...(init.body !== undefined && { body: init.body }),
          signal: controller.signal,
          dispatcher: this.dispatcher,
        } as unknown as Parameters<typeof undiciFetch>[1],
      )) as unknown as Response;
    } finally {
      clearTimeout(timer);
    }
  }

  private async requestJson<T>(
    method: string,
    path: string,
    body: unknown,
    auth: boolean,
  ): Promise<T> {
    const timeoutMs = this.config.requestTimeoutMs;
    const headers: Record<string, string> = {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    };
    let serialized: string | undefined;
    if (body !== undefined) {
      serialized = JSON.stringify(body);
      headers["Content-Type"] = "application/json";
    }
    if (auth && this.session) {
      // A1 expects the raw JWT with NO scheme prefix: "Bearer <token>" and
      // "JWT <token>" both return 401, while the bare token returns 200.
      headers.Authorization = this.session.access;
    }

    const response = await this.rawFetch(
      method,
      path,
      {
        ...(serialized !== undefined ? { body: serialized } : {}),
        headers,
      },
      timeoutMs,
    );
    const text = await response.text().catch(() => "");
    let parsed: T;
    try {
      parsed = (text === "" ? undefined : JSON.parse(text)) as T;
    } catch {
      parsed = text as unknown as T;
    }

    if (!response.ok) {
      const err = this.classifyHttpError(response.status, path, text);
      throw err;
    }
    return parsed;
  }

  private classifyHttpError(
    status: number,
    endpoint: string,
    text: string,
  ): A1Error {
    const detail = text.length > 500 ? `${text.slice(0, 500)}…` : text;
    const code =
      status === 401 || status === 403
        ? A1ErrorCode.AUTH_FAILED
        : status === 404
          ? A1ErrorCode.NOT_FOUND
          : status === 409
            ? A1ErrorCode.CONFLICT
            : A1ErrorCode.A1_ERROR;
    return new A1Error({
      code,
      message: `A1 request failed with status ${status}`,
      httpStatus: status,
      endpoint,
      details: detail,
    });
  }

  /** Fetch the RSA public key for login. */
  private async fetchPublicKey(): Promise<string> {
    const res = await this.requestJson<{ Alg?: string; Key?: string }>(
      "GET",
      "/Auth/Session",
      undefined,
      false,
    );
    if (!res.Key) {
      throw new A1Error({
        code: A1ErrorCode.AUTH_FAILED,
        message: "A1 server did not return an RSA public key",
        endpoint: "/Auth/Session",
      });
    }
    return res.Key;
  }

  /** Perform the full login handshake. */
  private async login(): Promise<A1Session> {
    this.logger.info({ endpoint: "/Auth/Session" }, "Authenticating with A1");
    const publicKey = await this.fetchPublicKey();
    const encrypted = rsaEncryptPassword(publicKey, this.config.password);

    const res = await this.requestJson<{ Access?: string; Refresh?: string }>(
      "POST",
      "/Auth/Session",
      { Name: this.config.user, Password: encrypted },
      false,
    );

    if (!res.Access || !res.Refresh) {
      throw new A1Error({
        code: A1ErrorCode.AUTH_FAILED,
        message: "A1 login did not return access/refresh tokens",
        endpoint: "/Auth/Session",
      });
    }

    const session: A1Session = { access: res.Access, refresh: res.Refresh };
    this.session = session;
    this.logger.info("A1 authentication successful");
    return session;
  }

  /** Refresh the access token using the refresh token. */
  private async refresh(): Promise<A1Session> {
    if (!this.session) return this.login();
    const res = await this.requestJson<{ Access?: string; Refresh?: string }>(
      "POST",
      "/Auth/Refresh",
      { Refresh: this.session.refresh },
      false,
    );
    if (!res.Access || !res.Refresh) {
      throw new A1Error({
        code: A1ErrorCode.AUTH_FAILED,
        message: "A1 refresh did not return new tokens",
        endpoint: "/Auth/Refresh",
      });
    }
    this.session = { access: res.Access, refresh: res.Refresh };
    return this.session;
  }

  /** Ensure a session exists (share a single in-flight login). */
  async ensureSession(): Promise<A1Session> {
    if (this.session) return this.session;
    if (this.authInFlight) return this.authInFlight;
    this.authInFlight = this.login().finally(() => {
      this.authInFlight = null;
    });
    return this.authInFlight;
  }

  /** Public request with re-auth-on-401 semantics. */
  async request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
  ): Promise<T> {
    await this.ensureSession();
    try {
      return await this.requestJson<T>(method, path, body, true);
    } catch (err) {
      // On 401, try a single refresh then retry once.
      if (
        err instanceof A1Error &&
        err.code === A1ErrorCode.AUTH_FAILED &&
        err.httpStatus === 401
      ) {
        this.logger.warn("Session expired, refreshing and retrying");
        await this.refresh();
        return await this.requestJson<T>(method, path, body, true);
      }
      throw err;
    }
  }

  /** Connect: authenticate and validate reachability. */
  async connect(): Promise<void> {
    await this.ensureSession();
  }

  /** Logout: best-effort DELETE /Auth/Session. */
  async disconnect(): Promise<void> {
    if (!this.session) return;
    try {
      await this.requestJson<unknown>(
        "DELETE",
        "/Auth/Session",
        { Refresh: this.session.refresh },
        true,
      );
    } catch (err) {
      this.logger.warn({ err }, "Error during A1 logout");
    } finally {
      this.session = null;
    }
  }
}
