import type { A1HttpClient } from "../http.js";
import type { A1Dimension, A1DimensionFull, A1Element, A1Edge, A1ElementAttribute, A1Subset } from "../../types.js";
export declare class DimensionService {
    private readonly http;
    constructor(http: A1HttpClient);
    /** GET /DimensionsList */
    list(): Promise<{
        Dimensions: A1Dimension[];
        Type: string;
    }>;
    /** GET /Dimensions(%22name%22) — full detail (elements, edges, attributes). */
    get(name: string): Promise<A1DimensionFull | undefined>;
    /** GET /Dimensions(%22name%22)/Elements */
    getElements(name: string): Promise<{
        Elements: A1Element[];
    }>;
    /** GET /Dimensions(%22name%22)/Edges */
    getEdges(name: string): Promise<{
        Edges: A1Edge[];
    }>;
    /** GET /Dimensions(%22name%22)/MaxLevel */
    getMaxLevel(name: string): Promise<number>;
    /** GET /Dimensions(%22name%22)/Attributes */
    getAttributes(name: string): Promise<{
        ElementAttributes: A1ElementAttribute[];
    }>;
    /** GET /Dimensions(%22name%22)/CubesUsed */
    getCubesUsed(name: string): Promise<{
        Cubes: string[];
    }>;
    /** GET /Dimensions(%22name%22)/Subsets */
    getSubsets(name: string): Promise<{
        Subsets: A1Subset[];
    }>;
    /** GET /Dimensions(%22name%22)/SubsetsList */
    listSubsets(name: string): Promise<{
        Subsets: A1Subset[];
    }>;
    /** POST /Dimensions { Name, Hierarchies, ... } */
    create(dim: {
        Name: string;
    }): Promise<void>;
    /** DELETE /Dimensions(%22name%22) */
    delete(name: string): Promise<void>;
    /** POST /Dimensions(%22name%22)/Elements { Elements: [{Name, Type}] } */
    createElements(name: string, elements: Array<{
        Name: string;
        Type: string;
    }>): Promise<void>;
    /** PATCH /Dimensions(%22name%22)/Elements { Elements: [{Name, Type}] } */
    updateElements(name: string, elements: Array<{
        Name: string;
        Type: string;
    }>): Promise<void>;
    /** DELETE /Dimensions(%22name%22)/Elements(%22elem%22) */
    deleteElement(name: string, element: string): Promise<void>;
    /** PATCH /Dimensions(%22name%22)/Edges { Edges: [{ParentName, ComponentName, Weight}] } */
    setEdges(name: string, edges: Array<{
        ParentName: string;
        ComponentName: string;
        Weight: number;
    }>): Promise<void>;
    /** DELETE /Dimensions(%22name%22)/Edges(%22parent%22,%22component%22) */
    deleteEdge(name: string, parent: string, component: string): Promise<void>;
    /** POST /Dimensions(%22name%22)/Subsets(%22subset%22) { Name, Dimension, Alias, Elements } */
    createSubset(name: string, subset: {
        Name: string;
        Dimension: string;
        Alias?: string;
        Elements: string[];
    }): Promise<void>;
    /** PATCH /Dimensions(%22name%22)/Subsets(%22subset%22) */
    updateSubset(name: string, subset: {
        Name: string;
        Dimension: string;
        Alias?: string;
        Elements: string[];
    }): Promise<void>;
    /** DELETE /Dimensions(%22name%22)/Subsets(%22subset%22) */
    deleteSubset(name: string, subset: string): Promise<void>;
}
//# sourceMappingURL=dimension-service.d.ts.map