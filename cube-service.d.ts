import type { A1HttpClient } from "../http.js";
import type { A1Cube } from "../../types.js";
export declare class CubeService {
    private readonly http;
    constructor(http: A1HttpClient);
    /** GET /Cubes */
    list(): Promise<{
        Cubes: A1Cube[];
    }>;
    /** GET /Cubes(%22name%22) */
    get(name: string): Promise<A1Cube | undefined>;
    /** POST /Cubes { Name, Dimensions: [...] } */
    create(name: string, dimensions: string[]): Promise<void>;
    /** DELETE /Cubes(%22name%22) */
    delete(name: string): Promise<void>;
    /** POST /Cubes/CreatePicklistCube { Name } */
    createPicklistCube(name: string): Promise<void>;
    /** GET /Cubes(%22name%22)/Rule/Get */
    getRule(name: string): Promise<{
        Rule: string;
    }>;
    /** POST /Cubes(%22name%22)/Rule/Set { Rule } */
    setRule(name: string, rule: string): Promise<void>;
    /** POST /Cubes(%22name%22)/Rule/Check { Rule } */
    checkRule(name: string, rule: string): Promise<void>;
    /** DELETE /Cubes(%22name%22)/Rule/Delete */
    deleteRule(name: string): Promise<void>;
    /** GET /Cubes(%22name%22)/Views */
    listViews(name: string): Promise<{
        Views: Array<{
            Name: string;
            Type: string;
        }>;
    }>;
    /** GET /Cubes(%22name%22)/ViewsList */
    listViewNames(name: string): Promise<{
        Views: Array<{
            Name: string;
            Type: string;
        }>;
    }>;
    /** GET /Cubes(%22name%22)/Views(%22view%22) — full view definition. */
    getView(name: string, view: string): Promise<unknown>;
    /** POST /Cubes(%22name%22)/Views — create an MDX view from a raw MDX string. */
    createMdxView(name: string, viewName: string, mdx: string): Promise<void>;
    /** DELETE /Cubes(%22name%22)/Views(%22view%22) */
    deleteView(name: string, view: string): Promise<void>;
    /** POST /Cubes(%22name%22)/TraceCellCalculation { CellCoordinates } */
    traceCellCalculation(name: string, coordinates: string[]): Promise<unknown>;
    /** POST /Cubes(%22name%22)/CellSet/Set { Cells: [...] } */
    setCells(name: string, cells: Array<{
        Axis: string[];
        Value: number | string;
    }>): Promise<void>;
}
//# sourceMappingURL=cube-service.d.ts.map