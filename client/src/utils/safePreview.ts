// client/src/utils/safePreview.ts

// Utility to create a safe preview of unknown input for logging purposes.
// It redacts sensitive information, limits depth and size to prevent excessive logging.
const REDACT_KEYS = new Set([
    "password",
    "oldPassword",
    "newPassword",
    "currentPassword",

    "token",
    "accessToken",
    "refreshToken",
    "authorization",

    "cookie",
    "set-cookie",

    "smtp_pass",
    "SMTP_PASS",
]);

// Configuration constants
const MAX_KEYS = 12;         // limit object keys
const MAX_DEPTH = 3;         // prevent deep recursion
const MAX_STRING = 400;      // truncate large strings

// Truncates a string if it exceeds MAX_STRING length
function truncateString(s: string) {
    return s.length > MAX_STRING ? s.slice(0, MAX_STRING) + "…(truncated)" : s;
}

// Recursive helper function to create a safe preview
function previewInner(value: unknown, depth: number): unknown {
    // Handle null or undefined
    if (value == null) return value;

    // Handle primitive types
    if (typeof value === "string") return truncateString(value);
    if (typeof value !== "object") return value;

    // Handle depth limit
    if (depth <= 0) return "[MaxDepth]";

    // Handle arrays
    if (Array.isArray(value)) {
        return value.slice(0, 8).map((v) => previewInner(v, depth - 1));
    }

    // Handle objects
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj).slice(0, MAX_KEYS);

    // Redact sensitive keys and recursively preview values
    const safeEntries = entries.map(([k, v]) => {
        // Redact sensitive information
        if (REDACT_KEYS.has(k)) return [k, "[REDACTED]"];
        return [k, previewInner(v, depth - 1)];
    });

    // Reconstruct the object from safe entries
    return Object.fromEntries(safeEntries);
}

/**---------------------------------------------------------
    Creates a safe preview of unknown input for logging:
        - Redacts sensitive keys
        - Limits depth and size
------------------------------------------------------------*/
export function safePreview(value: unknown): unknown {
    // Catch any unexpected errors during previewing
    try {
        return previewInner(value, MAX_DEPTH);
    } catch {
        return "[unserializable]";
    }
}
