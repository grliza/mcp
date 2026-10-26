export class SecurityService {
    http;
    constructor(http) {
        this.http = http;
    }
    /** GET /Clients(%22name%22) */
    async getClient(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Clients(${key})`);
    }
    /** GET /Groups */
    async listGroups() {
        return this.http.request("GET", "/Groups");
    }
    /** POST /Groups { Groups: [...] } */
    async createGroup(groups) {
        return this.http.request("POST", "/Groups", { Groups: groups });
    }
    /** DELETE /Groups(%22name%22) */
    async deleteGroup(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("DELETE", `/Groups(${key})`);
    }
    /** POST /Clients { Name, FriendlyName, Enabled, Type, Groups } */
    async createClient(client) {
        return this.http.request("POST", "/Clients", {
            Name: client.Name,
            ...(client.FriendlyName !== undefined && { FriendlyName: client.FriendlyName }),
            ...(client.Enabled !== undefined && { Enabled: client.Enabled }),
            ...(client.Type !== undefined && { Type: client.Type }),
            ...(client.Groups !== undefined && { Groups: client.Groups }),
        });
    }
    /** DELETE /Clients(%22name%22) */
    async deleteClient(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("DELETE", `/Clients(${key})`);
    }
    /** PATCH /Clients(%22name%22)/Password { Password } */
    async setClientPassword(name, password) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("PATCH", `/Clients(${key})/Password`, {
            Password: password,
        });
    }
    /** PATCH /ClientGroups { Cells: [{Client, Group, Value}] } */
    async setClientGroups(cells) {
        return this.http.request("PATCH", "/ClientGroups", { Cells: cells });
    }
    /** GET /ActiveUsers */
    async listActiveUsers() {
        return this.http.request("GET", "/ActiveUsers");
    }
}
//# sourceMappingURL=security-service.js.map