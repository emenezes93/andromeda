import { z } from 'zod';
export declare const schemaJsonSchema: z.ZodObject<{
    questions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        type: z.ZodEnum<["text", "number", "single", "multiple"]>;
        options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        required: z.ZodBoolean;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        showWhen: z.ZodOptional<z.ZodObject<{
            questionId: z.ZodString;
            operator: z.ZodEnum<["eq", "in"]>;
            value: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
        }, "strip", z.ZodTypeAny, {
            value: string | string[];
            questionId: string;
            operator: "eq" | "in";
        }, {
            value: string | string[];
            questionId: string;
            operator: "eq" | "in";
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: "number" | "text" | "single" | "multiple";
        text: string;
        id: string;
        required: boolean;
        options?: string[] | undefined;
        tags?: string[] | undefined;
        showWhen?: {
            value: string | string[];
            questionId: string;
            operator: "eq" | "in";
        } | undefined;
    }, {
        type: "number" | "text" | "single" | "multiple";
        text: string;
        id: string;
        required: boolean;
        options?: string[] | undefined;
        tags?: string[] | undefined;
        showWhen?: {
            value: string | string[];
            questionId: string;
            operator: "eq" | "in";
        } | undefined;
    }>, "many">;
    conditionalLogic: z.ZodOptional<z.ZodArray<z.ZodObject<{
        ifQuestion: z.ZodString;
        ifValue: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
        thenShow: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        ifQuestion: string;
        ifValue: string | string[];
        thenShow: string[];
    }, {
        ifQuestion: string;
        ifValue: string | string[];
        thenShow: string[];
    }>, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    questions: {
        type: "number" | "text" | "single" | "multiple";
        text: string;
        id: string;
        required: boolean;
        options?: string[] | undefined;
        tags?: string[] | undefined;
        showWhen?: {
            value: string | string[];
            questionId: string;
            operator: "eq" | "in";
        } | undefined;
    }[];
    tags?: string[] | undefined;
    conditionalLogic?: {
        ifQuestion: string;
        ifValue: string | string[];
        thenShow: string[];
    }[] | undefined;
}, {
    questions: {
        type: "number" | "text" | "single" | "multiple";
        text: string;
        id: string;
        required: boolean;
        options?: string[] | undefined;
        tags?: string[] | undefined;
        showWhen?: {
            value: string | string[];
            questionId: string;
            operator: "eq" | "in";
        } | undefined;
    }[];
    tags?: string[] | undefined;
    conditionalLogic?: {
        ifQuestion: string;
        ifValue: string | string[];
        thenShow: string[];
    }[] | undefined;
}>;
export declare const createTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    schemaJson: z.ZodObject<{
        questions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            type: z.ZodEnum<["text", "number", "single", "multiple"]>;
            options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            required: z.ZodBoolean;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            showWhen: z.ZodOptional<z.ZodObject<{
                questionId: z.ZodString;
                operator: z.ZodEnum<["eq", "in"]>;
                value: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
            }, "strip", z.ZodTypeAny, {
                value: string | string[];
                questionId: string;
                operator: "eq" | "in";
            }, {
                value: string | string[];
                questionId: string;
                operator: "eq" | "in";
            }>>;
        }, "strip", z.ZodTypeAny, {
            type: "number" | "text" | "single" | "multiple";
            text: string;
            id: string;
            required: boolean;
            options?: string[] | undefined;
            tags?: string[] | undefined;
            showWhen?: {
                value: string | string[];
                questionId: string;
                operator: "eq" | "in";
            } | undefined;
        }, {
            type: "number" | "text" | "single" | "multiple";
            text: string;
            id: string;
            required: boolean;
            options?: string[] | undefined;
            tags?: string[] | undefined;
            showWhen?: {
                value: string | string[];
                questionId: string;
                operator: "eq" | "in";
            } | undefined;
        }>, "many">;
        conditionalLogic: z.ZodOptional<z.ZodArray<z.ZodObject<{
            ifQuestion: z.ZodString;
            ifValue: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
            thenShow: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            ifQuestion: string;
            ifValue: string | string[];
            thenShow: string[];
        }, {
            ifQuestion: string;
            ifValue: string | string[];
            thenShow: string[];
        }>, "many">>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        questions: {
            type: "number" | "text" | "single" | "multiple";
            text: string;
            id: string;
            required: boolean;
            options?: string[] | undefined;
            tags?: string[] | undefined;
            showWhen?: {
                value: string | string[];
                questionId: string;
                operator: "eq" | "in";
            } | undefined;
        }[];
        tags?: string[] | undefined;
        conditionalLogic?: {
            ifQuestion: string;
            ifValue: string | string[];
            thenShow: string[];
        }[] | undefined;
    }, {
        questions: {
            type: "number" | "text" | "single" | "multiple";
            text: string;
            id: string;
            required: boolean;
            options?: string[] | undefined;
            tags?: string[] | undefined;
            showWhen?: {
                value: string | string[];
                questionId: string;
                operator: "eq" | "in";
            } | undefined;
        }[];
        tags?: string[] | undefined;
        conditionalLogic?: {
            ifQuestion: string;
            ifValue: string | string[];
            thenShow: string[];
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    name: string;
    schemaJson: {
        questions: {
            type: "number" | "text" | "single" | "multiple";
            text: string;
            id: string;
            required: boolean;
            options?: string[] | undefined;
            tags?: string[] | undefined;
            showWhen?: {
                value: string | string[];
                questionId: string;
                operator: "eq" | "in";
            } | undefined;
        }[];
        tags?: string[] | undefined;
        conditionalLogic?: {
            ifQuestion: string;
            ifValue: string | string[];
            thenShow: string[];
        }[] | undefined;
    };
}, {
    name: string;
    schemaJson: {
        questions: {
            type: "number" | "text" | "single" | "multiple";
            text: string;
            id: string;
            required: boolean;
            options?: string[] | undefined;
            tags?: string[] | undefined;
            showWhen?: {
                value: string | string[];
                questionId: string;
                operator: "eq" | "in";
            } | undefined;
        }[];
        tags?: string[] | undefined;
        conditionalLogic?: {
            ifQuestion: string;
            ifValue: string | string[];
            thenShow: string[];
        }[] | undefined;
    };
}>;
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type CreateTemplateBody = z.infer<typeof createTemplateSchema>;
//# sourceMappingURL=schemas.d.ts.map