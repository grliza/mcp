export class MonitoringService {
    http;
    constructor(http) {
        this.http = http;
    }
    /** GET /Tasks/Stats */
    async listTasks() {
        return this.http.request("GET", "/Tasks/Stats");
    }
    /** GET /ActiveUsers */
    async listActiveUsers() {
        return this.http.request("GET", "/ActiveUsers");
    }
    /** DELETE /Tasks(id) — cancel a task. */
    async cancelTask(id) {
        return this.http.request("DELETE", `/Tasks(${id})`);
    }
    /** POST /Tasks(id)/Move { Step } — reorder a task. */
    async moveTask(id, step) {
        return this.http.request("POST", `/Tasks(${id})/Move`, { Step: step });
    }
}
//# sourceMappingURL=monitoring-service.js.map