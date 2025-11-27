// client/src/utils/overviewEvents.ts

export type OverviewRefreshSource =
    | "journal"
    | "health"
    | "triggers"
    | "prediction";

type Listener = (source: OverviewRefreshSource) => void;

const listeners = new Set<Listener>();

export function onOverviewRefresh(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function notifyOverviewRefresh(source: OverviewRefreshSource) {
    listeners.forEach((fn) => fn(source));
}
