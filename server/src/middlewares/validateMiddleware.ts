// server/src/middlewares/validateMiddleware.ts

import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

type Part = "body" | "query" | "params";

/**-------------------------------------------
    🧩 Universal Zod validation middleware
----------------------------------------------**/
export function validate(schema: ZodSchema, part: Part = "body") {
    return (req: Request, res: Response, next: NextFunction) => {
        const data = req[part];
        const result = schema.safeParse(data);

        if (!result.success) {
            console.error(
                `\n❌ Validation failed for request ${req.method} ${req.originalUrl}`
            );
            console.error("🧠 Validation errors:", result.error.flatten());
            console.error("🔹 Request data received:", data);

            return res.status(400).json({
                ok: false,
                error: "ValidationError",
                message: "Invalid request payload.",
                details: result.error.flatten(),
            });
        }

        (req as any)[part] = result.data;
        next();
    };
}

export default validate;
