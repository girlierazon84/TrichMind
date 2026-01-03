// server/src/middlewares/index.ts

export { authentication } from "./authMiddleware";
export type { AuthRequest } from "./authMiddleware";

export { notFound, errorHandler } from "./errorHandler";
export { validate } from "./validateMiddleware";
export { requireMongoReady } from "./requireMongoReady";
