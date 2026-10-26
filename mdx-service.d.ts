import type { A1HttpClient } from "../http.js";
import type { A1MdxResult } from "../../types.js";
export declare class MdxService {
    private readonly http;
    constructor(http: A1HttpClient);
    /** POST /ExecMDX { mdx } */
    execute(mdx: string): Promise<A1MdxResult>;
    /** POST /SaveData — persist all dirty cells. */
    saveData(): Promise<void>;
    /** POST /SaveData(%22cube%22) — persist a single cube. */
    saveCube(cubeName: string): Promise<void>;
}
//# sourceMappingURL=mdx-service.d.ts.map