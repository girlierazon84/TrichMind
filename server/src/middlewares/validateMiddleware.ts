// server/src/middlewares/validateMiddleware.ts

import type {
    NextFunction,
    Request,
    Response,
    RequestHandler
} from "express";
import type { ZodTypeAny } from "zod";


// Define the parts of the request that can be validated
export type Part = "body" | "query" | "params";

/**---------------------------------------------------------------
    🧩 Universal Zod validation middleware
        - Validates req.body / req.query / req.params with Zod
        - Writes parsed/coerced values back onto req
------------------------------------------------------------------*/
export function validate(schema: ZodTypeAny, part: Part = "body"): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        // Extract the relevant part of the request
        const data = (req as any)[part];
        const result = schema.safeParse(data);

        // Handle validation failure
        if (!result.success) {
            // Detailed logging for debugging
            // eslint-disable-next-line no-console
            console.error(`\n❌ Validation failed for ${req.method} ${req.originalUrl}`);
            // eslint-disable-next-line no-console
            console.error("🧠 Validation errors:", result.error.flatten());
            // eslint-disable-next-line no-console
            console.error("🔹 Request data received:", data);

            return res.status(400).json({
                ok: false,
                error: "ValidationError",
                message: "Invalid request payload.",
                details: result.error.flatten(),
            });
        }

        // Write parsed data back to req
        // req.query may be a getter in some stacks; mutate safely
        if (part === "query") {
            const target = (req.query ?? {}) as Record<string, unknown>;
            for (const k of Object.keys(target)) delete target[k];
            Object.assign(target, result.data);
        } else if (part === "params") {
            (req as any).params = result.data;
        } else {
            (req as any).body = result.data;
        }

        next();
    };
}

export default validate;
