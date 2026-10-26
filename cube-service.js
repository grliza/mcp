export class CubeService {
    http;
    constructor(http) {
        this.http = http;
    }
    /** GET /Cubes */
    async list() {
        return this.http.request("GET", "/Cubes");
    }
    /** GET /Cubes(%22name%22) */
    async get(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Cubes(${key})`);
    }
    /** POST /Cubes { Name, Dimensions: [...] } */
    async create(name, dimensions) {
        return this.http.request("POST", "/Cubes", {
            Name: name,
            Dimensions: dimensions,
        });
    }
    /** DELETE /Cubes(%22name%22) */
    async delete(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("DELETE", `/Cubes(${key})`);
    }
    /** POST /Cubes/CreatePicklistCube { Name } */
    async createPicklistCube(name) {
        return this.http.request("POST", "/Cubes/CreatePicklistCube", {
            Name: name,
        });
    }
    /** GET /Cubes(%22name%22)/Rule/Get */
    async getRule(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Cubes(${key})/Rule/Get`);
    }
    /** POST /Cubes(%22name%22)/Rule/Set { Rule } */
    async setRule(name, rule) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("POST", `/Cubes(${key})/Rule/Set`, {
            Rule: rule,
        });
    }
    /** POST /Cubes(%22name%22)/Rule/Check { Rule } */
    async checkRule(name, rule) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("POST", `/Cubes(${key})/Rule/Check`, {
            Rule: rule,
        });
    }
    /** DELETE /Cubes(%22name%22)/Rule/Delete */
    async deleteRule(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("DELETE", `/Cubes(${key})/Rule/Delete`);
    }
    /** GET /Cubes(%22name%22)/Views */
    async listViews(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Cubes(${key})/Views`);
    }
    /** GET /Cubes(%22name%22)/ViewsList */
    async listViewNames(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Cubes(${key})/ViewsList`);
    }
    /** GET /Cubes(%22name%22)/Views(%22view%22) — full view definition. */
    async getView(name, view) {
        const key = encodeURIComponent(`"${name}"`);
        const vkey = encodeURIComponent(`"${view}"`);
        return this.http.request("GET", `/Cubes(${key})/Views(${vkey})`);
    }
    /** POST /Cubes(%22name%22)/Views — create an MDX view from a raw MDX string. */
    async createMdxView(name, viewName, mdx) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("POST", `/Cubes(${key})/Views`, {
            Name: viewName,
            MDX: mdx,
            Type: "MDXView",
            ViewFromMDX: {
                CubeName: name,
                Columns: [],
                Rows: [],
                Titles: [],
                SuppressEmptyColumns: false,
                SuppressEmptyRows: false,
            },
            AutoRecalculation: false,
            Meta: { Aliases: {}, ContextSets: {} },
        });
    }
    /** DELETE /Cubes(%22name%22)/Views(%22view%22) */
    async deleteView(name, view) {
        const key = encodeURIComponent(`"${name}"`);
        const vkey = encodeURIComponent(`"${view}"`);
        return this.http.request("DELETE", `/Cubes(${key})/Views(${vkey})`);
    }
    /** POST /Cubes(%22name%22)/TraceCellCalculation { CellCoordinates } */
    async traceCellCalculation(name, coordinates) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("POST", `/Cubes(${key})/TraceCellCalculation`, { CellCoordinates: coordinates });
    }
    /** POST /Cubes(%22name%22)/CellSet/Set { Cells: [...] } */
    async setCells(name, cells) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("POST", `/Cubes(${key})/CellSet/Set`, {
            Cells: cells,
        });
    }
}
//# sourceMappingURL=cube-service.js.map