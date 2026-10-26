// Cube service — /Cubes endpoints. A1 returns its own envelope shapes
// ({"Cubes": [...]}, {"Dimensions": [...]}) rather than OData.
import type { A1HttpClient } from "../http.js";
import type { A1Cube } from "../../types.js";

export class CubeService {
  constructor(private readonly http: A1HttpClient) {}

  /** GET /Cubes */
  async list(): Promise<{ Cubes: A1Cube[] }> {
    return this.http.request<{ Cubes: A1Cube[] }>("GET", "/Cubes");
  }

  /** GET /Cubes(%22name%22) */
  async get(name: string): Promise<A1Cube | undefined> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<A1Cube>("GET", `/Cubes(${key})`);
  }

  /** POST /Cubes { Name, Dimensions: [...] } */
  async create(name: string, dimensions: string[]): Promise<void> {
    return this.http.request<void>("POST", "/Cubes", {
      Name: name,
      Dimensions: dimensions,
    });
  }

  /** DELETE /Cubes(%22name%22) */
  async delete(name: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("DELETE", `/Cubes(${key})`);
  }

  /** POST /Cubes/CreatePicklistCube { Name } */
  async createPicklistCube(name: string): Promise<void> {
    return this.http.request<void>("POST", "/Cubes/CreatePicklistCube", {
      Name: name,
    });
  }

  /** GET /Cubes(%22name%22)/Rule/Get */
  async getRule(name: string): Promise<{ Rule: string }> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<{ Rule: string }>(
      "GET",
      `/Cubes(${key})/Rule/Get`,
    );
  }

  /** POST /Cubes(%22name%22)/Rule/Set { Rule } */
  async setRule(name: string, rule: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("POST", `/Cubes(${key})/Rule/Set`, {
      Rule: rule,
    });
  }

  /** POST /Cubes(%22name%22)/Rule/Check { Rule } */
  async checkRule(name: string, rule: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("POST", `/Cubes(${key})/Rule/Check`, {
      Rule: rule,
    });
  }

  /** DELETE /Cubes(%22name%22)/Rule/Delete */
  async deleteRule(name: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("DELETE", `/Cubes(${key})/Rule/Delete`);
  }

  /** GET /Cubes(%22name%22)/Views */
  async listViews(name: string): Promise<{ Views: Array<{ Name: string; Type: string }> }> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<{ Views: Array<{ Name: string; Type: string }> }>(
      "GET",
      `/Cubes(${key})/Views`,
    );
  }

  /** GET /Cubes(%22name%22)/ViewsList */
  async listViewNames(
    name: string,
  ): Promise<{ Views: Array<{ Name: string; Type: string }> }> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<{ Views: Array<{ Name: string; Type: string }> }>(
      "GET",
      `/Cubes(${key})/ViewsList`,
    );
  }

  /** GET /Cubes(%22name%22)/Views(%22view%22) — full view definition. */
  async getView(name: string, view: string): Promise<unknown> {
    const key = encodeURIComponent(`"${name}"`);
    const vkey = encodeURIComponent(`"${view}"`);
    return this.http.request<unknown>("GET", `/Cubes(${key})/Views(${vkey})`);
  }

  /** POST /Cubes(%22name%22)/Views — create an MDX view from a raw MDX string. */
  async createMdxView(name: string, viewName: string, mdx: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("POST", `/Cubes(${key})/Views`, {
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
  async deleteView(name: string, view: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    const vkey = encodeURIComponent(`"${view}"`);
    return this.http.request<void>("DELETE", `/Cubes(${key})/Views(${vkey})`);
  }

  /** POST /Cubes(%22name%22)/TraceCellCalculation { CellCoordinates } */
  async traceCellCalculation(
    name: string,
    coordinates: string[],
  ): Promise<unknown> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<unknown>(
      "POST",
      `/Cubes(${key})/TraceCellCalculation`,
      { CellCoordinates: coordinates },
    );
  }

  /** POST /Cubes(%22name%22)/CellSet/Set { Cells: [...] } */
  async setCells(
    name: string,
    cells: Array<{ Axis: string[]; Value: number | string }>,
  ): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("POST", `/Cubes(${key})/CellSet/Set`, {
      Cells: cells,
    });
  }
}
