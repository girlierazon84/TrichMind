// client/src/utils/safePreview.ts

// Utility to create a safe preview of an object by redacting sensitive fields.
const REDACT = new Set([
    "password",
    "oldPassword",
    "newPassword",
    "currentPassword",
    "token",
    "accessToken",
    "refreshToken",
]);

// Returns a safe preview of the input value with sensitive fields redacted.
export function safePreview(value: unknown): unknown {
    try {
        // Non-objects are returned as-is
        if (!value || typeof value !== "object") return value;

        // Limit to first 8 entries for brevity
        const entries = Object.entries(value as Record<string, unknown>).slice(0, 8);

        // Redact sensitive fields
        const safe = entries.map(([k, v]) => {
            if (REDACT.has(k)) return [k, "[REDACTED]"];
            return [k, v];
        });

        // Return as an object
        return Object.fromEntries(safe);
    } catch {
        // Fallback for unserializable values
        return "[unserializable]";
    }
}
