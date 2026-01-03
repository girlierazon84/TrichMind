import "express";

declare module "express-serve-static-core" {
    interface Request {
        auth?: {
            userId: string;
            token?: string
        };
    }
}
