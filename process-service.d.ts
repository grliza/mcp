import type { A1HttpClient } from "../http.js";
import type { A1Process } from "../../types.js";
export interface A1ProcessFull {
    Name: string;
    HasSecurityAccess: boolean;
    IsCorrect: boolean;
    PrologProcedure: string;
    MetadataProcedure: string;
    DataProcedure: string;
    EpilogProcedure: string;
    Parameters: Array<{
        Name: string;
        Type: string;
        Value: unknown;
        Prompt: string;
    }>;
    Variables: Array<{
        Name: string;
        Type: string;
    }>;
    DataSource?: unknown;
}
export declare class ProcessService {
    private readonly http;
    constructor(http: A1HttpClient);
    /** GET /Processes */
    list(): Promise<{
        Processes: A1Process[];
    }>;
    /** GET /Processes(%22name%22) */
    get(name: string): Promise<A1ProcessFull | undefined>;
    /** POST /Processes — create a process. */
    create(proc: unknown): Promise<void>;
    /** PATCH /Processes(%22name%22) — update a process. */
    update(name: string, proc: unknown): Promise<void>;
    /** DELETE /Processes(%22name%22) */
    delete(name: string): Promise<void>;
    /** POST /ExecCalc(%22name%22) { Parameters } */
    execute(name: string, parameters: Array<{
        Name: string;
        Value: unknown;
    }>): Promise<void>;
    /** GET /SourcesODBC */
    listOdbcSources(): Promise<{
        ODBC: Array<{
            Driver: string;
            Name: string;
        }>;
    }>;
    /** POST /PreviewODBC { dataSourceNameForClient, sqlQuery } */
    previewOdbc(sqlQuery: string, dataSourceNameForClient: string): Promise<{
        ColumnNames: string[];
        Values: unknown[][];
    }>;
}
//# sourceMappingURL=process-service.d.ts.map