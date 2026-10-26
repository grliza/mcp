// Process service — /Processes, /ExecCalc, /SourcesODBC, /PreviewODBC endpoints.
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
  Parameters: Array<{ Name: string; Type: string; Value: unknown; Prompt: string }>;
  Variables: Array<{ Name: string; Type: string }>;
  DataSource?: unknown;
}

export class ProcessService {
  constructor(private readonly http: A1HttpClient) {}

  /** GET /Processes */
  async list(): Promise<{ Processes: A1Process[] }> {
    return this.http.request<{ Processes: A1Process[] }>("GET", "/Processes");
  }

  /** GET /Processes(%22name%22) */
  async get(name: string): Promise<A1ProcessFull | undefined> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<A1ProcessFull>("GET", `/Processes(${key})`);
  }

  /** POST /Processes — create a process. */
  async create(proc: unknown): Promise<void> {
    return this.http.request<void>("POST", "/Processes", proc);
  }

  /** PATCH /Processes(%22name%22) — update a process. */
  async update(name: string, proc: unknown): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("PATCH", `/Processes(${key})`, proc);
  }

  /** DELETE /Processes(%22name%22) */
  async delete(name: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("DELETE", `/Processes(${key})`);
  }

  /** POST /ExecCalc(%22name%22) { Parameters } */
  async execute(
    name: string,
    parameters: Array<{ Name: string; Value: unknown }>,
  ): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("POST", `/ExecCalc(${key})`, {
      Parameters: parameters,
    });
  }

  /** GET /SourcesODBC */
  async listOdbcSources(): Promise<{ ODBC: Array<{ Driver: string; Name: string }> }> {
    return this.http.request<{ ODBC: Array<{ Driver: string; Name: string }> }>(
      "GET",
      "/SourcesODBC",
    );
  }

  /** POST /PreviewODBC { dataSourceNameForClient, sqlQuery } */
  async previewOdbc(sqlQuery: string, dataSourceNameForClient: string): Promise<{
    ColumnNames: string[];
    Values: unknown[][];
  }> {
    return this.http.request<{ ColumnNames: string[]; Values: unknown[][] }>(
      "POST",
      "/PreviewODBC",
      { dataSourceNameForClient, sqlQuery },
    );
  }
}
