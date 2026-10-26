// A1 platform configuration. JWT auth (RSA-encrypted password login) replaces
// TM1's Basic-cookie flow. Kept intentionally lean for the initial core slice;
// fields can grow as the tool surface does.
const VALID_LOG_LEVELS = ["debug", "info", "warn", "error"];
const VALID_TRANSPORTS = ["stdio", "http"];
const VALID_MODES = ["readwrite", "readonly"];
const VALID_RESPONSE_MODES = ["legacy", "structured"];
function parseIntEnv(name, raw, def) {
    if (raw === undefined || raw === "")
        return def;
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`Invalid ${name}: "${raw}". Expected a positive integer.`);
    }
    return n;
}
export function loadConfig() {
    const baseUrl = process.env.A1_BASE_URL;
    const user = process.env.A1_USER;
    const password = process.env.A1_PASSWORD;
    const missing = [];
    if (!baseUrl)
        missing.push("A1_BASE_URL");
    if (!user)
        missing.push("A1_USER");
    if (password === undefined)
        missing.push("A1_PASSWORD");
    if (missing.length > 0) {
        throw new Error(`Missing or empty required environment variables: ${missing.join(", ")}. ` +
            `Set them in your shell or .env file before starting the server.`);
    }
    const sslRaw = process.env.A1_SSL_REJECT_UNAUTHORIZED;
    const rejectUnauthorized = sslRaw === undefined ? true : sslRaw !== "false";
    const keepAliveIntervalMs = parseIntEnv("A1_KEEP_ALIVE_INTERVAL", process.env.A1_KEEP_ALIVE_INTERVAL, 60000);
    const requestTimeoutMs = parseIntEnv("A1_REQUEST_TIMEOUT", process.env.A1_REQUEST_TIMEOUT, 30000);
    const logLevelRaw = (process.env.A1_LOG_LEVEL ?? "info")
        .trim()
        .toLowerCase();
    if (!VALID_LOG_LEVELS.includes(logLevelRaw)) {
        throw new Error(`Invalid A1_LOG_LEVEL: "${process.env.A1_LOG_LEVEL}". Expected one of ${VALID_LOG_LEVELS.join(", ")}.`);
    }
    const logLevel = logLevelRaw;
    const logFile = process.env.A1_LOG_FILE || undefined;
    const transportRaw = (process.env.A1_MCP_TRANSPORT ?? "stdio")
        .trim()
        .toLowerCase();
    if (!VALID_TRANSPORTS.includes(transportRaw)) {
        throw new Error(`Invalid A1_MCP_TRANSPORT: "${process.env.A1_MCP_TRANSPORT}". Expected "stdio" or "http".`);
    }
    const transport = transportRaw;
    const httpHost = "127.0.0.1";
    const httpPort = 3005;
    const modeRaw = (process.env.A1_MODE ?? "readonly").trim().toLowerCase();
    if (!VALID_MODES.includes(modeRaw)) {
        throw new Error(`Invalid A1_MODE: "${process.env.A1_MODE}". Expected "readwrite" or "readonly".`);
    }
    const mode = modeRaw;
    const responseModeRaw = (process.env.A1_RESPONSE_MODE ?? "legacy")
        .trim()
        .toLowerCase();
    if (!VALID_RESPONSE_MODES.includes(responseModeRaw)) {
        throw new Error(`Invalid A1_RESPONSE_MODE: "${process.env.A1_RESPONSE_MODE}". Expected "legacy" or "structured".`);
    }
    const responseMode = responseModeRaw;
    return {
        baseUrl: baseUrl,
        user: user ?? "",
        password: password ?? "",
        ssl: { rejectUnauthorized },
        keepAliveIntervalMs,
        requestTimeoutMs,
        logLevel,
        logFile,
        transport,
        httpHost,
        httpPort,
        mode,
        responseMode,
    };
}
//# sourceMappingURL=config.js.map