export class ChoreService {
    http;
    constructor(http) {
        this.http = http;
    }
    /** GET /Chores */
    async list() {
        return this.http.request("GET", "/Chores");
    }
    /** GET /Chores(%22name%22) */
    async get(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Chores(${key})`);
    }
    /** POST /Chores — create a chore. */
    async create(chore) {
        return this.http.request("POST", "/Chores", chore);
    }
    /** PATCH /Chores(%22name%22) — update a chore. */
    async update(name, chore) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("PATCH", `/Chores(${key})`, chore);
    }
    /** DELETE /Chores(%22name%22) */
    async delete(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("DELETE", `/Chores(${key})`);
    }
    /** POST /Chores(%22name%22)/Activate */
    async activate(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("POST", `/Chores(${key})/Activate`, {});
    }
    /** POST /Chores(%22name%22)/Deactivate */
    async deactivate(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("POST", `/Chores(${key})/Deactivate`, {});
    }
}
//# sourceMappingURL=chore-service.js.map