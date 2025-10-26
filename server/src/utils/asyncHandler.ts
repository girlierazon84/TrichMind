// Simple async wrapper to avoid try/catch in every handler
import type { RequestHandler } from "express";
export const asyncHandler = (fn: RequestHandler): RequestHandler =>
    (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
