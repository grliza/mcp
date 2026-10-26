// Monitoring service — /Tasks/Stats, /ActiveUsers, /Tasks(...) endpoints.
import type { A1HttpClient } from "../http.js";

export interface A1Task {
  Id: number;
  Client: string;
  ElapsedTime: string;
  WaitTime: string;
  Request: string;
  Status: string;
  Mutability: string;
}

export class MonitoringService {
  constructor(private readonly http: A1HttpClient) {}

  /** GET /Tasks/Stats */
  async listTasks(): Promise<{ Tasks: A1Task[] }> {
    return this.http.request<{ Tasks: A1Task[] }>("GET", "/Tasks/Stats");
  }

  /** GET /ActiveUsers */
  async listActiveUsers(): Promise<{ ActiveUsers: Array<{ Duration: number; User: string }> }> {
    return this.http.request<{
      ActiveUsers: Array<{ Duration: number; User: string }>;
    }>("GET", "/ActiveUsers");
  }

  /** DELETE /Tasks(id) — cancel a task. */
  async cancelTask(id: number): Promise<void> {
    return this.http.request<void>("DELETE", `/Tasks(${id})`);
  }

  /** POST /Tasks(id)/Move { Step } — reorder a task. */
  async moveTask(id: number, step: number): Promise<void> {
    return this.http.request<void>("POST", `/Tasks(${id})/Move`, { Step: step });
  }
}
