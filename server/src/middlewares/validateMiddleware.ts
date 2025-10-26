// server/src/middlewares/validateMiddleware.ts
import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

type Part = "body" | "query" | "params";

/**
 * Validate incoming request data using a Zod schema.
 * Automatically returns 400 with flattened error details if validation fails.
 */
export function validate(schema: ZodSchema, part: Part = "body") {
    return (req: Request, res: Response, next: NextFunction) => {
        const data = req[part];
        const result = schema.safeParse(data);
        if (!result.success) {
            return res.status(400).json({
                error: "ValidationError",
                details: result.error.flatten(),
            });
        }
        // Replace incoming data with the parsed (validated) object
        (req as any)[part] = result.data;
        next();
    };
}
