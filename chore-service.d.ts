import type { A1HttpClient } from "../http.js";
import type { A1Chore } from "../../types.js";
export declare class ChoreService {
    private readonly http;
    constructor(http: A1HttpClient);
    /** GET /Chores */
    list(): Promise<{
        Chores: A1Chore[];
    }>;
    /** GET /Chores(%22name%22) */
    get(name: string): Promise<A1Chore | undefined>;
    /** POST /Chores — create a chore. */
    create(chore: unknown): Promise<void>;
    /** PATCH /Chores(%22name%22) — update a chore. */
    update(name: string, chore: unknown): Promise<void>;
    /** DELETE /Chores(%22name%22) */
    delete(name: string): Promise<void>;
    /** POST /Chores(%22name%22)/Activate */
    activate(name: string): Promise<void>;
    /** POST /Chores(%22name%22)/Deactivate */
    deactivate(name: string): Promise<void>;
}
//# sourceMappingURL=chore-service.d.ts.map