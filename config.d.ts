export interface A1Config {
    baseUrl: string;
    user: string;
    password: string;
    ssl: {
        rejectUnauthorized: boolean;
    };
    keepAliveIntervalMs: number;
    requestTimeoutMs: number;
    logLevel: "debug" | "info" | "warn" | "error";
    logFile?: string | undefined;
    transport: "stdio" | "http";
    httpHost: string;
    httpPort: number;
    mode: "readwrite" | "readonly";
    responseMode: "legacy" | "structured";
}
export declare function loadConfig(): A1Config;
//# sourceMappingURL=config.d.ts.map