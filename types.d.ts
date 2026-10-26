export declare const A1ErrorCode: {
    readonly CONNECTION_FAILED: "CONNECTION_FAILED";
    readonly LOCK_TIMEOUT: "LOCK_TIMEOUT";
    readonly AUTH_FAILED: "AUTH_FAILED";
    readonly PERMISSION_DENIED: "PERMISSION_DENIED";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly A1_ERROR: "A1_ERROR";
    readonly UNSUPPORTED_OPERATION: "UNSUPPORTED_OPERATION";
};
export type A1ErrorCode = (typeof A1ErrorCode)[keyof typeof A1ErrorCode];
export declare class A1Error extends Error {
    readonly code: A1ErrorCode;
    readonly httpStatus?: number | undefined;
    readonly endpoint?: string | undefined;
    readonly details?: string | undefined;
    hintOverride?: string | undefined;
    constructor(opts: {
        code: A1ErrorCode;
        message: string;
        httpStatus?: number | undefined;
        endpoint?: string | undefined;
        details?: string | undefined;
        hint?: string | undefined;
    });
    get hint(): string;
    toErrorPayload(): {
        code: A1ErrorCode;
        message: string;
        httpStatus?: number | undefined;
        endpoint?: string | undefined;
        details?: string | undefined;
        hint: string;
    };
}
export declare function hintForCode(code: A1ErrorCode | string): string;
export interface A1Element {
    Name: string;
    Type: "Numeric" | "String" | "Consolidated";
    Index: number;
    Level: number;
    UniqueName: string;
    Attributes?: Record<string, unknown>;
    Parents?: Array<{
        Index: number;
        Name: string;
    }>;
}
export interface A1Edge {
    ComponentName: string;
    ParentName: string;
    Weight: number;
}
export interface A1ElementAttribute {
    Name: string;
    Type: "String" | "Numeric" | "Alias";
}
export interface A1Dimension {
    Name: string;
    Type: "Dimension";
    Security?: string;
}
export interface A1DimensionFull {
    Name: string;
    Type: "Dimension";
    Elements: A1Element[];
    Edges: A1Edge[];
    ElementAttributes: A1ElementAttribute[];
    Subsets: unknown[];
}
export interface A1Cube {
    Name: string;
    Type: "Cube";
    Security?: string;
    HasRules?: boolean;
    Dimensions: Array<{
        Name: string;
        Type: string;
    }>;
}
export interface A1Process {
    Name: string;
    HasSecurityAccess?: boolean;
    IsCorrect?: boolean;
    Security?: string;
    Parameters?: A1Parameter[];
}
export interface A1Parameter {
    Name: string;
    Type: "String" | "Numeric";
    Value?: string | number;
    Prompt?: string;
}
export interface A1Chore {
    Name: string;
    Active?: boolean;
    Frequency?: string;
    StartTime?: string;
    Tasks?: Array<{
        Process: string;
        Parameters: unknown[];
    }>;
}
export interface A1Subset {
    Name: string;
    Alias?: string;
    Dynamic?: boolean;
    Elements?: string[];
    Expression?: string;
}
export interface A1View {
    Name: string;
    Type: "NativeView" | "MDXView";
}
export interface A1MdxResult {
    Axes: Array<{
        Ordinal: number;
        Cardinality: number;
        Hierarchies: Array<{
            Name: string;
        }>;
        Tuples: Array<{
            Ordinal: number;
            Members: Array<{
                UniqueName: string;
            }>;
        }>;
        Type: number;
    }>;
    Cells: Array<{
        Ordinal: number;
        Value: string | number;
        FormattedValue?: string;
        FormatString?: string;
        Consolidated?: boolean;
        RuleDerived?: boolean;
        Updatable?: boolean;
    }>;
    Cube: {
        Name: string;
        Dimensions: Array<{
            Name: string;
        }>;
    };
}
//# sourceMappingURL=types.d.ts.map