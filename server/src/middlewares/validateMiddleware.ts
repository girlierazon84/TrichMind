// server/src/middlewares/validateMiddleware.ts

import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import chalk from "chalk";

type Part = "body" | "query" | "params";

/**
 * 🧩 Universal Zod validation middleware
 * Validates request data and logs structured feedback on errors.
 */
export function validate(schema: ZodSchema, part: Part = "body") {
    return (req: Request, res: Response, next: NextFunction) => {
        const data = req[part];
        const result = schema.safeParse(data);

        if (!result.success) {
            // Log the validation issue with nice formatting
            console.error(
                chalk.redBright(`\n❌ Validation failed for request ${req.method} ${req.originalUrl}`)
            );
            console.error(chalk.yellowBright("🧠 Validation errors:"), result.error.flatten());
            console.error(chalk.gray("🔹 Request data received:"), data);

            // Respond clearly to the client
            return res.status(400).json({
                ok: false,
                error: "ValidationError",
                message: "Invalid request payload.",
                details: result.error.flatten(),
            });
        }

        // ✅ Replace incoming data with validated/coerced object
        (req as any)[part] = result.data;

        // Continue to the next middleware/route handler
        next();
    };
}
