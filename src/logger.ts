import pino from "pino";
import type { A1Config } from "./config.js";

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

function redactPaths(): string[] {
  const paths: string[] = [];
  for (const field of SENSITIVE_FIELDS) {
    paths.push(field);
    paths.push(`*.${field}`);
    paths.push(`headers.${field}`);
  }
  return paths;
}

export function createLogger(
  config: Pick<A1Config, "logLevel" | "logFile">,
): pino.Logger {
  const options: pino.LoggerOptions = {
    level: config.logLevel,
    redact: {
      paths: redactPaths(),
      censor: MASK_VALUE,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  const targets: pino.TransportTargetOptions[] = [];

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
