// Security service — /Clients, /Groups, /ClientGroups endpoints.
import type { A1HttpClient } from "../http.js";

export interface A1Client {
  Enabled: boolean;
  FriendlyName: string;
  Groups: string[];
  Name: string;
  Password: string;
  Provider: string;
  Type: string;
}

export class SecurityService {
  constructor(private readonly http: A1HttpClient) {}

  /** GET /Clients(%22name%22) */
  async getClient(name: string): Promise<A1Client | undefined> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<A1Client>("GET", `/Clients(${key})`);
  }

  /** GET /Groups */
  async listGroups(): Promise<{ Groups: string[] }> {
    return this.http.request<{ Groups: string[] }>("GET", "/Groups");
  }

  /** POST /Groups { Groups: [...] } */
  async createGroup(groups: string[]): Promise<void> {
    return this.http.request<void>("POST", "/Groups", { Groups: groups });
  }

  /** DELETE /Groups(%22name%22) */
  async deleteGroup(name: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("DELETE", `/Groups(${key})`);
  }

  /** POST /Clients { Name, FriendlyName, Enabled, Type, Groups } */
  async createClient(client: {
    Name: string;
    FriendlyName?: string;
    Enabled?: boolean;
    Type?: string;
    Groups?: string[];
  }): Promise<void> {
    return this.http.request<void>("POST", "/Clients", {
      Name: client.Name,
      ...(client.FriendlyName !== undefined && { FriendlyName: client.FriendlyName }),
      ...(client.Enabled !== undefined && { Enabled: client.Enabled }),
      ...(client.Type !== undefined && { Type: client.Type }),
      ...(client.Groups !== undefined && { Groups: client.Groups }),
    });
  }

  /** DELETE /Clients(%22name%22) */
  async deleteClient(name: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("DELETE", `/Clients(${key})`);
  }

  /** PATCH /Clients(%22name%22)/Password { Password } */
  async setClientPassword(name: string, password: string): Promise<void> {
    const key = encodeURIComponent(`"${name}"`);
    return this.http.request<void>("PATCH", `/Clients(${key})/Password`, {
      Password: password,
    });
  }

  /** PATCH /ClientGroups { Cells: [{Client, Group, Value}] } */
  async setClientGroups(
    cells: Array<{ Client: string; Group: string; Value: boolean }>,
  ): Promise<void> {
    return this.http.request<void>("PATCH", "/ClientGroups", { Cells: cells });
  }

  /** GET /ActiveUsers */
  async listActiveUsers(): Promise<{ ActiveUsers: Array<{ Duration: number; User: string }> }> {
    return this.http.request<{
      ActiveUsers: Array<{ Duration: number; User: string }>;
    }>("GET", "/ActiveUsers");
  }
}
