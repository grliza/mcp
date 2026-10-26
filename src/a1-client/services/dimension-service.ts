// Dimension service — /Dimensions, /DimensionsList endpoints.
import type { A1HttpClient } from "../http.js";
import type {
  A1Dimension,
  A1DimensionFull,
  A1Element,
  A1Edge,
  A1ElementAttribute,
  A1Subset,
} from "../../types.js";

export class DimensionService {
  constructor(private readonly http: A1HttpClient) {}

  /** GET /DimensionsList */
  async list(): Promise<{ Dimensions: A1Dimension[]; Type: string }> {
    return this.http.request<{ Dimensions: A1Dimension[]; Type: string }>(
      "GET",
      "/DimensionsList",
    );
  }

  /** GET /Dimensions(%22name%22) — full detail (elements, edges, attributes). */
  async get(name: string): Promise<A1DimensionFull | undefined> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<A1DimensionFull>("GET", `/Dimensions(${key})`);
  }

  /** GET /Dimensions(%22name%22)/Elements */
  async getElements(name: string): Promise<{ Elements: A1Element[] }> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<{ Elements: A1Element[] }>(
      "GET",
      `/Dimensions(${key})/Elements`,
    );
  }

  /** GET /Dimensions(%22name%22)/Edges */
  async getEdges(name: string): Promise<{ Edges: A1Edge[] }> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<{ Edges: A1Edge[] }>(
      "GET",
      `/Dimensions(${key})/Edges`,
    );
  }

  /** GET /Dimensions(%22name%22)/MaxLevel */
  async getMaxLevel(name: string): Promise<number> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<number>("GET", `/Dimensions(${key})/MaxLevel`);
  }

  /** GET /Dimensions(%22name%22)/Attributes */
  async getAttributes(
    name: string,
  ): Promise<{ ElementAttributes: A1ElementAttribute[] }> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<{ ElementAttributes: A1ElementAttribute[] }>(
      "GET",
      `/Dimensions(${key})/Attributes`,
    );
  }

  /** GET /Dimensions(%22name%22)/CubesUsed */
  async getCubesUsed(name: string): Promise<{ Cubes: string[] }> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<{ Cubes: string[] }>(
      "GET",
      `/Dimensions(${key})/CubesUsed`,
    );
  }

  /** GET /Dimensions(%22name%22)/Subsets */
  async getSubsets(name: string): Promise<{ Subsets: A1Subset[] }> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<{ Subsets: A1Subset[] }>(
      "GET",
      `/Dimensions(${key})/Subsets`,
    );
  }

  /** GET /Dimensions(%22name%22)/SubsetsList */
  async listSubsets(name: string): Promise<{ Subsets: A1Subset[] }> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<{ Subsets: A1Subset[] }>(
      "GET",
      `/Dimensions(${key})/SubsetsList`,
    );
  }

  /** POST /Dimensions { Name, Hierarchies, ... } */
  async create(dim: { Name: string }): Promise<void> {
    return this.http.request<void>("POST", "/Dimensions", {
      Name: dim.Name,
      Attributes: { Caption: dim.Name },
      // A1 requires a (possibly empty) Hierarchies array — omitting it returns
      // 500 "Missing or invalid 'Hierarchies'".
      Hierarchies: [{ Name: dim.Name, Elements: [], Edges: [] }],
    });
  }

  /** DELETE /Dimensions(%22name%22) */
  async delete(name: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("DELETE", `/Dimensions(${key})`);
  }

  /** POST /Dimensions(%22name%22)/Elements { Elements: [{Name, Type}] } */
  async createElements(
    name: string,
    elements: Array<{ Name: string; Type: string }>,
  ): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("POST", `/Dimensions(${key})/Elements`, {
      Elements: elements,
    });
  }

  /** PATCH /Dimensions(%22name%22)/Elements { Elements: [{Name, Type}] } */
  async updateElements(
    name: string,
    elements: Array<{ Name: string; Type: string }>,
  ): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("PATCH", `/Dimensions(${key})/Elements`, {
      Elements: elements,
    });
  }

  /** DELETE /Dimensions(%22name%22)/Elements(%22elem%22) */
  async deleteElement(name: string, element: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    const ekey = encodeURIComponent(`"${element}"`);
    return this.http.request<void>("DELETE", `/Dimensions(${key})/Elements(${ekey})`);
  }

  /** PATCH /Dimensions(%22name%22)/Edges { Edges: [{ParentName, ComponentName, Weight}] } */
  async setEdges(
    name: string,
    edges: Array<{ ParentName: string; ComponentName: string; Weight: number }>,
  ): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("PATCH", `/Dimensions(${key})/Edges`, {
      Edges: edges,
    });
  }

  /** DELETE /Dimensions(%22name%22)/Edges(%22parent%22,%22component%22) */
  async deleteEdge(
    name: string,
    parent: string,
    component: string,
  ): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    const pkey = encodeURIComponent(`"${parent}"`);
    const ckey = encodeURIComponent(`"${component}"`);
    return this.http.request<void>(
      "DELETE",
      `/Dimensions(${key})/Edges(${pkey},${ckey})`,
    );
  }

  /** POST /Dimensions(%22name%22)/Subsets(%22subset%22) { Name, Dimension, Alias, Elements } */
  async createSubset(
    name: string,
    subset: { Name: string; Dimension: string; Alias?: string; Elements: string[] },
  ): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    const skey = encodeURIComponent(`"${subset.Name}"`);
    return this.http.request<void>(
      "POST",
      `/Dimensions(${key})/Subsets(${skey})`,
      subset,
    );
  }

  /** PATCH /Dimensions(%22name%22)/Subsets(%22subset%22) */
  async updateSubset(
    name: string,
    subset: { Name: string; Dimension: string; Alias?: string; Elements: string[] },
  ): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    const skey = encodeURIComponent(`"${subset.Name}"`);
    return this.http.request<void>(
      "PATCH",
      `/Dimensions(${key})/Subsets(${skey})`,
      subset,
    );
  }

  /** DELETE /Dimensions(%22name%22)/Subsets(%22subset%22) */
  async deleteSubset(name: string, subset: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    const skey = encodeURIComponent(`"${subset}"`);
    return this.http.request<void>(
      "DELETE",
      `/Dimensions(${key})/Subsets(${skey})`,
    );
  }
}
