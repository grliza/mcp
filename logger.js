import pino from "pino";
// Redaction: JWT access/refresh tokens must never reach logs. The Authorization
// header carries the access token, so its field name is redacted too.
const SENSITIVE_FIELDS = [
    "password",
    "Password",
    "Authorization",
    "authorization",
    "accessToken",
    "refreshToken",
    "Access",
    "Refresh",
    "clientSecret",
];
const MASK_VALUE = "***";
function redactPaths() {
    const paths = [];
    for (const field of SENSITIVE_FIELDS) {
        paths.push(field);
        paths.push(`*.${field}`);
        paths.push(`headers.${field}`);
    }
    return paths;
}
export function createLogger(config) {
    const options = {
        level: config.logLevel,
        redact: {
            paths: redactPaths(),
            censor: MASK_VALUE,
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    };
    const targets = [];
    // Always log to stderr so stdout stays clean for the MCP stdio transport.
    targets.push({
        target: "pino/file",
        options: { destination: 2 }, // fd 2 = stderr
        level: config.logLevel,
    });
    if (config.logFile) {
        targets.push({
            target: "pino/file",
            options: { destination: config.logFile },
            level: config.logLevel,
        });
    }
    return pino(options, pino.transport({ targets }));
}
//# sourceMappingURL=logger.js.map