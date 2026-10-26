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
export declare class SecurityService {
    private readonly http;
    constructor(http: A1HttpClient);
    /** GET /Clients(%22name%22) */
    getClient(name: string): Promise<A1Client | undefined>;
    /** GET /Groups */
    listGroups(): Promise<{
        Groups: string[];
    }>;
    /** POST /Groups { Groups: [...] } */
    createGroup(groups: string[]): Promise<void>;
    /** DELETE /Groups(%22name%22) */
    deleteGroup(name: string): Promise<void>;
    /** POST /Clients { Name, FriendlyName, Enabled, Type, Groups } */
    createClient(client: {
        Name: string;
        FriendlyName?: string;
        Enabled?: boolean;
        Type?: string;
        Groups?: string[];
    }): Promise<void>;
    /** DELETE /Clients(%22name%22) */
    deleteClient(name: string): Promise<void>;
    /** PATCH /Clients(%22name%22)/Password { Password } */
    setClientPassword(name: string, password: string): Promise<void>;
    /** PATCH /ClientGroups { Cells: [{Client, Group, Value}] } */
    setClientGroups(cells: Array<{
        Client: string;
        Group: string;
        Value: boolean;
    }>): Promise<void>;
    /** GET /ActiveUsers */
    listActiveUsers(): Promise<{
        ActiveUsers: Array<{
            Duration: number;
            User: string;
        }>;
    }>;
}
//# sourceMappingURL=security-service.d.ts.map