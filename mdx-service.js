export class MdxService {
    http;
    constructor(http) {
        this.http = http;
    }
    /** POST /ExecMDX { mdx } */
    async execute(mdx) {
        return this.http.request("POST", "/ExecMDX", { mdx });
    }
    /** POST /SaveData — persist all dirty cells. */
    async saveData() {
        return this.http.request("POST", "/SaveData", {});
    }
    /** POST /SaveData(%22cube%22) — persist a single cube. */
    async saveCube(cubeName) {
        const key = encodeURIComponent(`"${cubeName}"`);
        return this.http.request("POST", `/SaveData(${key})`, {});
    }
}
//# sourceMappingURL=mdx-service.js.map