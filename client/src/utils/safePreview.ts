// client/src/utils/safePreview.ts

export function safePreview(value: unknown): unknown {
    try {
        if (typeof value === "object" && value !== null) {
            return Object.fromEntries(Object.entries(value).slice(0, 5));
        }
        return value;
    } catch {
        return "[unserializable]";
    }
}
