// client/src/utils/overviewEvents.ts

// Types of sources that can trigger an overview refresh
export type OverviewRefreshSource =
    | "journal"
    | "health"
    | "triggers"
    | "ml"        // ✅ prediction / ML service
    | "game"      // ✅ TrichGame sessions
    | "profile";  // ✅ user profile changes can affect overview

// Listener function type
type Listener = (source: OverviewRefreshSource) => void;

// In-memory set of listeners
const listeners = new Set<Listener>();

// Event name for custom events
const EVENT_NAME = "trichmind:overview-refresh";

/**------------------------------------------
    Subscribe to overview refresh events.
    SSR-safe: does not require window.
---------------------------------------------*/
export function onOverviewRefresh(fn: Listener) {
    listeners.add(fn);

    // Optional: also listen to window custom events if in browser
    const handler = (ev: Event) => {
        // Extract detail from CustomEvent
        const detail = (ev as CustomEvent<OverviewRefreshSource>)?.detail;
        if (detail) fn(detail);
    };

    // Attach event listener if in browser
    if (typeof window !== "undefined") {
        // We cast to EventListener to satisfy TypeScript
        window.addEventListener(EVENT_NAME, handler as EventListener);
    }

    // Return unsubscribe function
    return () => {
        listeners.delete(fn);
        // Remove event listener if in browser
        if (typeof window !== "undefined") {
            window.removeEventListener(EVENT_NAME, handler as EventListener);
        }
    };
}

/**--------------------------------------------------------------------------
    Notify overview that it should refresh.
    SSR-safe: no-op for window event, still triggers in-memory listeners.
-----------------------------------------------------------------------------*/
export function notifyOverviewRefresh(source: OverviewRefreshSource) {
    listeners.forEach((fn) => fn(source));

    // Dispatch custom event if in browser
    if (typeof window !== "undefined") {
        // Create and dispatch the custom event
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: source }));
    }
}
