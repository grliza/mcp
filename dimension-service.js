export class DimensionService {
    http;
    constructor(http) {
        this.http = http;
    }
    /** GET /DimensionsList */
    async list() {
        return this.http.request("GET", "/DimensionsList");
    }
    /** GET /Dimensions(%22name%22) — full detail (elements, edges, attributes). */
    async get(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Dimensions(${key})`);
    }
    /** GET /Dimensions(%22name%22)/Elements */
    async getElements(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Dimensions(${key})/Elements`);
    }
    /** GET /Dimensions(%22name%22)/Edges */
    async getEdges(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Dimensions(${key})/Edges`);
    }
    /** GET /Dimensions(%22name%22)/MaxLevel */
    async getMaxLevel(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Dimensions(${key})/MaxLevel`);
    }
    /** GET /Dimensions(%22name%22)/Attributes */
    async getAttributes(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Dimensions(${key})/Attributes`);
    }
    /** GET /Dimensions(%22name%22)/CubesUsed */
    async getCubesUsed(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Dimensions(${key})/CubesUsed`);
    }
    /** GET /Dimensions(%22name%22)/Subsets */
    async getSubsets(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Dimensions(${key})/Subsets`);
    }
    /** GET /Dimensions(%22name%22)/SubsetsList */
    async listSubsets(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("GET", `/Dimensions(${key})/SubsetsList`);
    }
    /** POST /Dimensions { Name, Hierarchies, ... } */
    async create(dim) {
        return this.http.request("POST", "/Dimensions", {
            Name: dim.Name,
            Attributes: { Caption: dim.Name },
            // A1 requires a (possibly empty) Hierarchies array — omitting it returns
            // 500 "Missing or invalid 'Hierarchies'".
            Hierarchies: [{ Name: dim.Name, Elements: [], Edges: [] }],
        });
    }
    /** DELETE /Dimensions(%22name%22) */
    async delete(name) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("DELETE", `/Dimensions(${key})`);
    }
    /** POST /Dimensions(%22name%22)/Elements { Elements: [{Name, Type}] } */
    async createElements(name, elements) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("POST", `/Dimensions(${key})/Elements`, {
            Elements: elements,
        });
    }
    /** PATCH /Dimensions(%22name%22)/Elements { Elements: [{Name, Type}] } */
    async updateElements(name, elements) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("PATCH", `/Dimensions(${key})/Elements`, {
            Elements: elements,
        });
    }
    /** DELETE /Dimensions(%22name%22)/Elements(%22elem%22) */
    async deleteElement(name, element) {
        const key = encodeURIComponent(`"${name}"`);
        const ekey = encodeURIComponent(`"${element}"`);
        return this.http.request("DELETE", `/Dimensions(${key})/Elements(${ekey})`);
    }
    /** PATCH /Dimensions(%22name%22)/Edges { Edges: [{ParentName, ComponentName, Weight}] } */
    async setEdges(name, edges) {
        const key = encodeURIComponent(`"${name}"`);
        return this.http.request("PATCH", `/Dimensions(${key})/Edges`, {
            Edges: edges,
        });
    }
    /** DELETE /Dimensions(%22name%22)/Edges(%22parent%22,%22component%22) */
    async deleteEdge(name, parent, component) {
        const key = encodeURIComponent(`"${name}"`);
        const pkey = encodeURIComponent(`"${parent}"`);
        const ckey = encodeURIComponent(`"${component}"`);
        return this.http.request("DELETE", `/Dimensions(${key})/Edges(${pkey},${ckey})`);
    }
    /** POST /Dimensions(%22name%22)/Subsets(%22subset%22) { Name, Dimension, Alias, Elements } */
    async createSubset(name, subset) {
        const key = encodeURIComponent(`"${name}"`);
        const skey = encodeURIComponent(`"${subset.Name}"`);
        return this.http.request("POST", `/Dimensions(${key})/Subsets(${skey})`, subset);
    }
    /** PATCH /Dimensions(%22name%22)/Subsets(%22subset%22) */
    async updateSubset(name, subset) {
        const key = encodeURIComponent(`"${name}"`);
        const skey = encodeURIComponent(`"${subset.Name}"`);
        return this.http.request("PATCH", `/Dimensions(${key})/Subsets(${skey})`, subset);
    }
    /** DELETE /Dimensions(%22name%22)/Subsets(%22subset%22) */
    async deleteSubset(name, subset) {
        const key = encodeURIComponent(`"${name}"`);
        const skey = encodeURIComponent(`"${subset}"`);
        return this.http.request("DELETE", `/Dimensions(${key})/Subsets(${skey})`);
    }
}
//# sourceMappingURL=dimension-service.js.map