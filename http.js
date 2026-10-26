import { Agent as UndiciAgent, fetch as undiciFetch } from "undici";
import { A1Error, A1ErrorCode } from "../types.js";
import { rsaEncryptPassword } from "./auth.js";
const USER_AGENT = "a1-mcp-server";
export class A1HttpClient {
    config;
    logger;
    dispatcher;
    session = null;
    authInFlight = null;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.dispatcher = new UndiciAgent({
            connect: { rejectUnauthorized: config.ssl.rejectUnauthorized },
            headersTimeout: 0,
            bodyTimeout: 0,
        });
    }
    /** Whether a live session (access token) is held. */
    isAuthenticated() {
        return this.session !== null;
    }
    buildBase(path) {
        const base = this.config.baseUrl.replace(/\/+$/, "");
        const p = path.startsWith("/") ? path : `/${path}`;
        return `${base}${p}`;
    }
    async rawFetch(method, path, init, timeoutMs) {
        const url = this.buildBase(path);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return (await undiciFetch(url, {
                method,
                headers: init.headers,
                ...(init.body !== undefined && { body: init.body }),
                signal: controller.signal,
                dispatcher: this.dispatcher,
            }));
        }
        finally {
            clearTimeout(timer);
        }
    }
    async requestJson(method, path, body, auth) {
        const timeoutMs = this.config.requestTimeoutMs;
        const headers = {
            "User-Agent": USER_AGENT,
            Accept: "application/json",
        };
        let serialized;
        if (body !== undefined) {
            serialized = JSON.stringify(body);
            headers["Content-Type"] = "application/json";
        }
        if (auth && this.session) {
            // A1 expects the raw JWT with NO scheme prefix: "Bearer <token>" and
            // "JWT <token>" both return 401, while the bare token returns 200.
            headers.Authorization = this.session.access;
        }
        const response = await this.rawFetch(method, path, {
            ...(serialized !== undefined ? { body: serialized } : {}),
            headers,
        }, timeoutMs);
        const text = await response.text().catch(() => "");
        let parsed;
        try {
            parsed = (text === "" ? undefined : JSON.parse(text));
        }
        catch {
            parsed = text;
        }
        if (!response.ok) {
            const err = this.classifyHttpError(response.status, path, text);
            throw err;
        }
        return parsed;
    }
    classifyHttpError(status, endpoint, text) {
        const detail = text.length > 500 ? `${text.slice(0, 500)}…` : text;
        const code = status === 401 || status === 403
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
    async fetchPublicKey() {
        const res = await this.requestJson("GET", "/Auth/Session", undefined, false);
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
    async login() {
        this.logger.info({ endpoint: "/Auth/Session" }, "Authenticating with A1");
        const publicKey = await this.fetchPublicKey();
        const encrypted = rsaEncryptPassword(publicKey, this.config.password);
        const res = await this.requestJson("POST", "/Auth/Session", { Name: this.config.user, Password: encrypted }, false);
        if (!res.Access || !res.Refresh) {
            throw new A1Error({
                code: A1ErrorCode.AUTH_FAILED,
                message: "A1 login did not return access/refresh tokens",
                endpoint: "/Auth/Session",
            });
        }
        const session = { access: res.Access, refresh: res.Refresh };
        this.session = session;
        this.logger.info("A1 authentication successful");
        return session;
    }
    /** Refresh the access token using the refresh token. */
    async refresh() {
        if (!this.session)
            return this.login();
        const res = await this.requestJson("POST", "/Auth/Refresh", { Refresh: this.session.refresh }, false);
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
    async ensureSession() {
        if (this.session)
            return this.session;
        if (this.authInFlight)
            return this.authInFlight;
        this.authInFlight = this.login().finally(() => {
            this.authInFlight = null;
        });
        return this.authInFlight;
    }
    /** Public request with re-auth-on-401 semantics. */
    async request(method, path, body) {
        await this.ensureSession();
        try {
            return await this.requestJson(method, path, body, true);
        }
        catch (err) {
            // On 401, try a single refresh then retry once.
            if (err instanceof A1Error &&
                err.code === A1ErrorCode.AUTH_FAILED &&
                err.httpStatus === 401) {
                this.logger.warn("Session expired, refreshing and retrying");
                await this.refresh();
                return await this.requestJson(method, path, body, true);
            }
            throw err;
        }
    }
    /** Connect: authenticate and validate reachability. */
    async connect() {
        await this.ensureSession();
    }
    /** Logout: best-effort DELETE /Auth/Session. */
    async disconnect() {
        if (!this.session)
            return;
        try {
            await this.requestJson("DELETE", "/Auth/Session", { Refresh: this.session.refresh }, true);
        }
        catch (err) {
            this.logger.warn({ err }, "Error during A1 logout");
        }
        finally {
            this.session = null;
        }
    }
}
//# sourceMappingURL=http.js.map