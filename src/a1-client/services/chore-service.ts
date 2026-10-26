// Chore service — /Chores endpoints.
import type { A1HttpClient } from "../http.js";
import type { A1Chore } from "../../types.js";

export class ChoreService {
  constructor(private readonly http: A1HttpClient) {}

  /** GET /Chores */
  async list(): Promise<{ Chores: A1Chore[] }> {
    return this.http.request<{ Chores: A1Chore[] }>("GET", "/Chores");
  }

  /** GET /Chores(%22name%22) */
  async get(name: string): Promise<A1Chore | undefined> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<A1Chore>("GET", `/Chores(${key})`);
  }

  /** POST /Chores — create a chore. */
  async create(chore: unknown): Promise<void> {
    return this.http.request<void>("POST", "/Chores", chore);
  }

  /** PATCH /Chores(%22name%22) — update a chore. */
  async update(name: string, chore: unknown): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("PATCH", `/Chores(${key})`, chore);
  }

  /** DELETE /Chores(%22name%22) */
  async delete(name: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("DELETE", `/Chores(${key})`);
  }

  /** POST /Chores(%22name%22)/Activate */
  async activate(name: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("POST", `/Chores(${key})/Activate`, {});
  }

  /** POST /Chores(%22name%22)/Deactivate */
  async deactivate(name: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("POST", `/Chores(${key})/Deactivate`, {});
  }
}
