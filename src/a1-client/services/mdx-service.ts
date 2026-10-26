// MDX service — /ExecMDX and /SaveData endpoints.
import type { A1HttpClient } from "../http.js";
import type { A1MdxResult } from "../../types.js";

export class MdxService {
  constructor(private readonly http: A1HttpClient) {}

  /** POST /ExecMDX { mdx } */
  async execute(mdx: string): Promise<A1MdxResult> {
    return this.http.request<A1MdxResult>("POST", "/ExecMDX", { mdx });
  }

  /** POST /SaveData — persist all dirty cells. */
  async saveData(): Promise<void> {
    return this.http.request<void>("POST", "/SaveData", {});
  }

  /** POST /SaveData(%22cube%22) — persist a single cube. */
  async saveCube(cubeName: string): Promise<void> {
    const key = encodeURIComponent(`"${cubeName}"`);
    return this.http.request<void>("POST", `/SaveData(${key})`, {});
  }
}
