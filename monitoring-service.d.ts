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
export declare class MonitoringService {
    private readonly http;
    constructor(http: A1HttpClient);
    /** GET /Tasks/Stats */
    listTasks(): Promise<{
        Tasks: A1Task[];
    }>;
    /** GET /ActiveUsers */
    listActiveUsers(): Promise<{
        ActiveUsers: Array<{
            Duration: number;
            User: string;
        }>;
    }>;
    /** DELETE /Tasks(id) — cancel a task. */
    cancelTask(id: number): Promise<void>;
    /** POST /Tasks(id)/Move { Step } — reorder a task. */
    moveTask(id: number, step: number): Promise<void>;
}
//# sourceMappingURL=monitoring-service.d.ts.map