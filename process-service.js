export class ProcessService {
    http;
    constructor(http) {
        this.http = http;
    }
    /** GET /Processes */
    async list() {
        return this.http.request("GET", "/Processes");
    }
    /** GET /Processes(%22name%22) */
    async get(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Processes(${key})`);
    }
    /** POST /Processes — create a process. */
    async create(proc) {
        return this.http.request("POST", "/Processes", proc);
    }
    /** PATCH /Processes(%22name%22) — update a process. */
    async update(name, proc) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("PATCH", `/Processes(${key})`, proc);
    }
    /** DELETE /Processes(%22name%22) */
    async delete(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("DELETE", `/Processes(${key})`);
    }
    /** POST /ExecCalc(%22name%22) { Parameters } */
    async execute(name, parameters) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("POST", `/ExecCalc(${key})`, {
            Parameters: parameters,
        });
    }
    /** GET /SourcesODBC */
    async listOdbcSources() {
        return this.http.request("GET", "/SourcesODBC");
    }
    /** POST /PreviewODBC { dataSourceNameForClient, sqlQuery } */
    async previewOdbc(sqlQuery, dataSourceNameForClient) {
        return this.http.request("POST", "/PreviewODBC", { dataSourceNameForClient, sqlQuery });
    }
}
//# sourceMappingURL=process-service.js.map