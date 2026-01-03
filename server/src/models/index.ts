// server/src/models/index.ts

/**----------------------------------------------------------------------
    Central export file for all models and their types
    - Prefer `default as X` exports to avoid named/default mismatches
    - Keeps imports consistent across services/controllers
-------------------------------------------------------------------------*/

// AlertLog Model and Types
export { default as AlertLog } from "./AlertLog";
export type { IAlertLog, AlertLogDocument } from "./AlertLog";

// HealthLog Model and Types
export { default as HealthLog } from "./HealthLog";
export type { IHealthLog, HealthLogDocument, HealthRiskBucket } from "./HealthLog";

// JournalEntry Model and Types
export { default as JournalEntry } from "./JournalEntry";
export type { IJournalEntry, JournalEntryDocument } from "./JournalEntry";

// LogEvent Model and Types
export { default as LogEvent } from "./LogModel";
export type { ILogEvent, LogEventDocument, LogCategory, LogLevel } from "./LogModel";

// Predict Model and Types
export { default as Predict } from "./PredictModel";
export type { IPredict, PredictDocument, PredictRiskBucket, PredictKind } from "./PredictModel";

// SummaryLog Model and Types
export { default as SummaryLog } from "./SummaryLog";
export type { ISummaryLog, SummaryLogDocument, SummaryStatus } from "./SummaryLog";

// TrichBotMessage Model and Types
export { default as TrichBotMessage } from "./TrichBotModel";
export type { ITrichBotMessage, TrichBotMessageDocument } from "./TrichBotModel";

// GameSession Model and Types
export { default as GameSession } from "./TrichGameModel";
export type { IGameSession, GameSessionDocument } from "./TrichGameModel";

// TriggerInsight Model and Types
export { default as TriggerInsight } from "./TriggersInsightsModel";
export type { ITriggerInsight, TriggerInsightDocument } from "./TriggersInsightsModel";

// User Model and Types
export { default as User } from "./UserModel";
export type { IUser, IUserMethods, UserDocument } from "./UserModel";
