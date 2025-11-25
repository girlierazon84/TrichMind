// client/src/pages/JournalPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth, useJournal } from "@/hooks";
import { journalApi, type JournalEntry } from "@/services";
import { ThemeButton } from "@/components";

import {
    UserIcon,
    MyJournalIcon,
    CalendarClockIcon,
    SaveIcon,
} from "@/assets/icons";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

// ---------- Types ----------
interface JournalEntryView {
    _id: string;
    prompt?: string;
    text: string;
    mood?: string;
    urgeIntensity?: number;
    createdAt: string;

    // new, structured trigger info (optional while backend catches up)
    preUrgeTriggers?: string[];
    preUrgeTriggerNotes?: string;
}

// Extend API type with extra numeric features used for ML
type JournalEntryWithMetrics = JournalEntry & {
    preUrgeTriggers?: string[];
    preUrgeTriggerNotes?: string;
    stress?: number;
    calm?: number;
    happy?: number;
};

// Canonical mood set (must match backend PRE_URGE_MOODS + "Bored")
type MoodName =
    | "Sad"
    | "Anxious"
    | "Stressed"
    | "Overwhelmed"
    | "Angry"
    | "Neutral"
    | "Calm"
    | "Tired"
    | "Hopeful"
    | "Happy"
    | "Proud"
    | "Bored"
    | "";

// Mood options for UI + analytics
const MOOD_OPTIONS: { value: MoodName; label: string; emoji: string }[] = [
    { value: "Sad", label: "Sad", emoji: "😢" },
    { value: "Anxious", label: "Anxious", emoji: "😰" },
    { value: "Stressed", label: "Stressed", emoji: "😣" },
    { value: "Overwhelmed", label: "Overwhelmed", emoji: "😵" },
    { value: "Angry", label: "Angry", emoji: "😡" },
    { value: "Neutral", label: "Neutral", emoji: "😐" },
    { value: "Calm", label: "Calm", emoji: "😌" },
    { value: "Tired", label: "Tired", emoji: "😴" },
    { value: "Bored", label: "Bored", emoji: "🥱" },
    { value: "Hopeful", label: "Hopeful", emoji: "🌱" },
    { value: "Happy", label: "Happy", emoji: "😊" },
    { value: "Proud", label: "Proud", emoji: "🏅" },
];

// Cluster moods into broader groups for numeric features
const STRESS_MOODS: MoodName[] = [
    "Sad",
    "Anxious",
    "Stressed",
    "Overwhelmed",
    "Angry",
    "Bored", // boredom is a key pre-pulling state
];

const CALM_MOODS: MoodName[] = ["Calm", "Tired", "Neutral"];
const HAPPY_MOODS: MoodName[] = ["Happy", "Proud", "Hopeful"];

// ---- Trigger tags (simple, structured pre-urge triggers) ----
type TriggerKey =
    | "Stress"
    | "Boredom"
    | "Anxiety"
    | "Fatigue"
    | "BodyFocus"
    | "ScreenTime"
    | "Social"
    | "Other";

const TRIGGER_OPTIONS: {
    key: TriggerKey;
    label: string;
    emoji: string;
    helper?: string;
}[] = [
    { key: "Stress", label: "Stress", emoji: "🔥" },
    { key: "Boredom", label: "Boredom", emoji: "💤" },
    { key: "Anxiety", label: "Anxiety", emoji: "😟" },
    { key: "Fatigue", label: "Tired / low energy", emoji: "😴" },
    {
        key: "BodyFocus",
        label: "Body focus (skin, hair, scalp…)",
        emoji: "🪞",
    },
    { key: "ScreenTime", label: "Screen time / scrolling", emoji: "📱" },
    { key: "Social", label: "Social situations", emoji: "💬" },
    { key: "Other", label: "Something else", emoji: "✏️" },
];

// ---------- Styled Components ----------

const PageWrapper = styled.main`
    width: 100%;
    min-height: 100vh;
    padding: 1.25rem 1.2rem 100px;
    background: linear-gradient(
        180deg,
        #e2f4f7 0%,
        #e6f7f7 120px,
        ${(props) => props.theme.colors.page_bg || "#f4fbfc"} 300px
    );
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Content = styled.div`
    width: 100%;
    max-width: 960px;
`;

const Header = styled.header`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
`;

const HeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
`;

const HeaderIcon = styled.img`
    width: 32px;
    height: 32px;
`;

const HeaderTitleGroup = styled.div`
    display: flex;
    flex-direction: column;
`;

const HeaderTitle = styled.h1`
    font-size: 1.1rem;
    margin: 0;
    color: ${(props) => props.theme.colors.text_primary};
    font-weight: 700;
`;

const HeaderSubtitle = styled.span`
    font-size: 0.75rem;
    color: ${(props) => props.theme.colors.text_secondary};
`;

const AvatarButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
`;

const AvatarImage = styled.img`
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
`;

// ---- Cards ----
const Card = styled.section`
    background: ${(props) => props.theme.colors.card_bg};
    border-radius: 18px;
    padding: 1.1rem 1rem 1.2rem;
    box-shadow: 0 10px 28px rgba(13, 98, 117, 0.35);
    margin-bottom: 1.1rem;
`;

const SectionTitleRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.35rem;
`;

const SectionTitle = styled.h3`
    font-size: 0.9rem;
    margin: 0;
    color: ${(props) => props.theme.colors.text_primary};
`;

const SectionSub = styled.p`
    margin: 0 0 0.45rem;
    font-size: 0.74rem;
    color: ${(props) => props.theme.colors.text_secondary};
`;

// Small “hint” line for optional microcopy
const SectionHint = styled.p`
    margin: 0 0 0.35rem;
    font-size: 0.7rem;
    color: ${(props) => props.theme.colors.text_secondary};
    opacity: 0.9;
`;

// Thin divider to visually soften long content
const SoftDivider = styled.hr`
    border: none;
    border-top: 1px dashed rgba(0, 0, 0, 0.06);
    margin: 0.7rem 0 0.5rem;
`;

// Specific label for the select to satisfy a11y rules
const PromptLabel = styled.label.attrs({
    id: "journal-prompt-label",
})`
    font-size: 0.9rem;
    margin: 0;
    color: ${(props) => props.theme.colors.text_primary};
    font-weight: 600;
`;

// ---- Prompt + Text ----
const PromptSelect = styled.select`
    width: 100%;
    border-radius: 12px;
    border: 1px solid ${(props) => props.theme.colors.fourthly};
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
    background: #f6fbfc;
    color: ${(props) => props.theme.colors.text_primary};
    margin-bottom: 0.6rem;
    outline: none;

    &:focus {
        border-color: ${(props) => props.theme.colors.primary};
        box-shadow: 0 0 0 2px rgba(0, 196, 204, 0.15);
    }
`;

const TextArea = styled.textarea`
    width: 100%;
    min-height: 110px;
    border-radius: 14px;
    border: 1px solid ${(props) => props.theme.colors.fourthly};
    padding: 0.65rem 0.8rem;
    font-size: 0.85rem;
    resize: vertical;
    background: #f6fbfc;
    color: ${(props) => props.theme.colors.text_primary};
    outline: none;

    &::placeholder {
        color: ${(props) => props.theme.colors.text_secondary};
    }

    &:focus {
        border-color: ${(props) => props.theme.colors.primary};
        box-shadow: 0 0 0 2px rgba(0, 196, 204, 0.15);
    }
`;

// ---- Mood ----
const MoodRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin: 0.3rem 0 0.4rem;
`;

const MoodOption = styled.label<{ $active: boolean }>`
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.55rem;
    border-radius: 999px;
    border: 1px solid
        ${(props) =>
            props.$active ? props.theme.colors.primary : "rgba(0,0,0,0.06)"};
    background: ${(props) =>
        props.$active ? "rgba(0,196,204,0.1)" : "rgba(255,255,255,0.9)"};
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.2s ease;

    span.emoji {
        font-size: 1rem;
    }

    input {
        display: none;
    }
`;

// ---- Triggers ----
const TriggerRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin: 0.3rem 0 0.3rem;
`;

const TriggerChip = styled.button<{ $active: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.28rem 0.6rem;
    border-radius: 999px;
    border: 1px solid
        ${({ $active, theme }) =>
            $active ? theme.colors.primary : "rgba(0,0,0,0.08)"};
    background: ${({ $active }) =>
        $active ? "rgba(0,196,204,0.1)" : "rgba(255,255,255,0.95)"};
    font-size: 0.75rem;
    cursor: pointer;
    outline: none;

    span.emoji {
        font-size: 0.95rem;
    }
`;

const TriggerNoteInput = styled.input`
    width: 100%;
    border-radius: 12px;
    border: 1px solid ${(props) => props.theme.colors.fourthly};
    padding: 0.45rem 0.7rem;
    font-size: 0.8rem;
    margin-top: 0.25rem;
    background: #f6fbfc;
    color: ${(props) => props.theme.colors.text_primary};

    &::placeholder {
        color: ${(props) => props.theme.colors.text_secondary};
    }

    &:focus {
        border-color: ${(props) => props.theme.colors.primary};
        box-shadow: 0 0 0 2px rgba(0, 196, 204, 0.15);
        outline: none;
    }
`;

// ---- Urge Slider ----
const SliderLabelRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.2rem;

    span:first-child {
        font-size: 0.8rem;
        font-weight: 500;
    }

    span:last-child {
        font-size: 0.75rem;
        color: ${(props) => props.theme.colors.text_secondary};
    }
`;

const RangeInput = styled.input.attrs({ type: "range" })`
    width: 100%;
    appearance: none;
    height: 8px;
    border-radius: 999px;
    background: #ffd9df;
    outline: none;
    margin: 0.2rem 0 0.25rem;

    &::-webkit-slider-thumb {
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #ff5b7d;
        cursor: pointer;
        box-shadow: 0 0 0 4px rgba(255, 91, 125, 0.25);
    }

    &::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #ff5b7d;
        cursor: pointer;
        box-shadow: 0 0 0 4px rgba(255, 91, 125, 0.25);
    }
`;

const TickRow = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: ${(props) => props.theme.colors.text_secondary};
    margin-top: 0.05rem;
`;

// ---- Buttons / Meta ----
const SaveButton = styled(ThemeButton)`
    width: 100%;
    margin-top: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;

    img {
        width: 18px;
        height: 18px;
    }
`;

const DateRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    color: ${(props) => props.theme.colors.text_secondary};
    margin-bottom: 0.3rem;

    img {
        width: 16px;
        height: 16px;
    }
`;

// ---- Past entries ----
const LogsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-top: 0.4rem;
`;

const LogItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.55rem 0.7rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
    font-size: 0.75rem;
`;

const LogDate = styled.span`
    white-space: nowrap;
    font-weight: 600;
`;

const LogMeta = styled.span`
    color: ${(props) => props.theme.colors.text_secondary};
`;

const EmptyState = styled.p`
    font-size: 0.8rem;
    color: ${(props) => props.theme.colors.text_secondary};
    margin: 0.2rem 0 0.8rem;
`;

// Chart container
const TrendChartWrapper = styled.div`
    margin-top: 0.6rem;
    height: 130px;

    .recharts-cartesian-axis-tick-value {
        font-size: 0.6rem;
    }
`;

// ---------- Prompts ----------
const PROMPTS: string[] = [
    "What triggered my urges today?",
    "How did I feel before and after pulling?",
    "What thoughts showed up right before the urge?",
    "What was happening around me when I felt the urge?",
    "What helped me cope well today?",
    "What can I try next time an urge shows up?",
    "What is one small win I’m proud of today?",
    "Which body sensations did I notice before/after pulling?",
    "Who or what made me feel supported today?",
    "What is one kind thing I can say to myself right now?",
    "If I could talk to my future self, what would I want them to know?",
];

export const JournalPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { create, loading } = useJournal();

    const [prompt, setPrompt] = useState<string>(PROMPTS[0]);
    const [text, setText] = useState<string>("");
    const [mood, setMood] = useState<MoodName>("");
    const [urgeIntensity, setUrgeIntensity] = useState<number>(5);

    const [selectedTriggers, setSelectedTriggers] = useState<TriggerKey[]>([]);
    const [triggerNotes, setTriggerNotes] = useState<string>("");

    const [saving, setSaving] = useState(false);
    const [entries, setEntries] = useState<JournalEntryView[]>([]);
    const [entriesLoading, setEntriesLoading] = useState(false);

    const headerAvatar = UserIcon; // later swap for user.avatarUrl

    // Redirect guests to login
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
        }
    }, [isAuthenticated, navigate]);

    // Load recent entries from backend
    const fetchEntries = async () => {
        try {
            setEntriesLoading(true);
            const res = await journalApi.list({
                page: 1,
                limit: 7,
                sort: "-createdAt",
            });
            const items = (res?.entries ?? []) as JournalEntryView[];
            setEntries(items);
        } catch (e) {
            console.error("[JournalPage] Failed to load entries", e);
        } finally {
            setEntriesLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        void fetchEntries();
    }, [isAuthenticated]);

    const toggleTrigger = (key: TriggerKey) => {
        setSelectedTriggers((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleSave = async () => {
        if (!text.trim() && !mood && !prompt && selectedTriggers.length === 0) {
            // nothing meaningful to save
            return;
        }

        try {
            setSaving(true);

            // map trigger keys -> human labels for storage / ML
            const preUrgeTriggers =
                selectedTriggers.length > 0
                    ? selectedTriggers.map(
                          (k) =>
                              TRIGGER_OPTIONS.find((opt) => opt.key === k)?.label || k
                      )
                    : undefined;

            const payload: JournalEntryWithMetrics = {
                text,
                prompt,
                mood: mood || undefined,
                urgeIntensity,
                preUrgeTriggers,
                preUrgeTriggerNotes: triggerNotes.trim() || undefined,
            };

            // Map mood to numeric fields for analytics
            if (mood && STRESS_MOODS.includes(mood)) {
                payload.stress = urgeIntensity;
            } else if (mood && CALM_MOODS.includes(mood)) {
                payload.calm = urgeIntensity;
            } else if (mood && HAPPY_MOODS.includes(mood)) {
                payload.happy = urgeIntensity;
            }

            // Create entry via API, then always refetch from backend
            await create(payload);
            await fetchEntries();

            // Reset fields (keep same prompt for faster journaling)
            setText("");
            setUrgeIntensity(5);
            setSelectedTriggers([]);
            setTriggerNotes("");
        } catch {
            // errors handled in hook/toast
        } finally {
            setSaving(false);
        }
    };

    const formatDateTime = (iso: string) =>
        new Date(iso).toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });

    const todayLabel = useMemo(
        () =>
            new Date().toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
            }),
        []
    );

    const trendData = useMemo(
        () =>
            [...entries]
                .filter((e) => typeof e.urgeIntensity === "number")
                .slice()
                .reverse()
                .map((e, idx) => ({
                    id: idx,
                    label: new Date(e.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                    }),
                    urgeIntensity: e.urgeIntensity ?? 0,
                })),
        [entries]
    );

    // limit past entries shown to avoid overwhelm
    const recentEntries = entries.slice(0, 5);

    return (
        <PageWrapper>
            <Content>
                <Header>
                    <HeaderLeft>
                        <HeaderIcon src={MyJournalIcon} alt="Journal icon" />
                        <HeaderTitleGroup>
                            <HeaderTitle>Journal</HeaderTitle>
                            <HeaderSubtitle>
                                Gentle check-ins for mood, triggers and urges.
                            </HeaderSubtitle>
                        </HeaderTitleGroup>
                    </HeaderLeft>

                    <AvatarButton onClick={() => navigate("/profile")}>
                        <AvatarImage src={headerAvatar} alt={user?.email || "Profile"} />
                    </AvatarButton>
                </Header>

                {/* Today’s Check-in & Reflection */}
                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Today&apos;s check-in</SectionTitle>
                    </SectionTitleRow>
                    <SectionHint>
                        You don&apos;t have to fill in everything – just what feels
                        helpful today.
                    </SectionHint>

                    <DateRow>
                        <img src={CalendarClockIcon} alt="Date & time" />
                        <span>{todayLabel}</span>
                    </DateRow>

                    {/* 1. Mood */}
                    <SoftDivider />
                    <SectionTitleRow>
                        <SectionTitle>Mood</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>Tap the mood that fits you best right now.</SectionSub>

                    <MoodRow>
                        {MOOD_OPTIONS.map((opt) => (
                            <MoodOption key={opt.value} $active={mood === opt.value}>
                                <input
                                    type="radio"
                                    name="mood"
                                    value={opt.value}
                                    checked={mood === opt.value}
                                    onChange={() => setMood(opt.value)}
                                    title={`${opt.label} mood`}
                                    aria-label={`${opt.label} mood`}
                                />
                                <span className="emoji">{opt.emoji}</span>
                                <span>{opt.label}</span>
                            </MoodOption>
                        ))}
                    </MoodRow>

                    {/* 2. Triggers */}
                    <SoftDivider />
                    <SectionTitleRow>
                        <SectionTitle>Possible triggers</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>
                        If you notice anything around the urge, you can mark it here.
                    </SectionSub>

                    <TriggerRow>
                        {TRIGGER_OPTIONS.map((opt) => (
                            <TriggerChip
                                key={opt.key}
                                type="button"
                                $active={selectedTriggers.includes(opt.key)}
                                onClick={() => toggleTrigger(opt.key)}
                                aria-pressed={selectedTriggers.includes(opt.key)}
                            >
                                <span className="emoji">{opt.emoji}</span>
                                <span>{opt.label}</span>
                            </TriggerChip>
                        ))}
                    </TriggerRow>

                    {selectedTriggers.includes("Other") && (
                        <TriggerNoteInput
                            value={triggerNotes}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setTriggerNotes(e.target.value)
                            }
                            placeholder="Add a short note (optional)…"
                            aria-label="Describe other trigger"
                        />
                    )}

                    {/* 3. Urge intensity */}
                    <SoftDivider />
                    <SectionTitleRow>
                        <SectionTitle>Urge level</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>How strong is the urge to pull right now?</SectionSub>

                    <SliderLabelRow>
                        <span>Current urge</span>
                        <span>{urgeIntensity}/10</span>
                    </SliderLabelRow>
                    <RangeInput
                        min={0}
                        max={10}
                        step={1}
                        value={urgeIntensity}
                        aria-label="Urge intensity slider"
                        title="Urge intensity slider"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setUrgeIntensity(Number(e.target.value))
                        }
                    />
                    <TickRow>
                        <span>0</span>
                        <span>2</span>
                        <span>4</span>
                        <span>6</span>
                        <span>8</span>
                        <span>10</span>
                    </TickRow>

                    {/* 4. Short reflection */}
                    <SoftDivider />
                    <SectionTitleRow>
                        <PromptLabel htmlFor="journal-prompt-select">
                            Short note (optional)
                        </PromptLabel>
                    </SectionTitleRow>
                    <SectionSub>
                        Pick a prompt if you like, or just write a few lines.
                    </SectionSub>

                    <PromptSelect
                        id="journal-prompt-select"
                        value={prompt}
                        title="Daily journal prompt"
                        aria-labelledby="journal-prompt-label"
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            setPrompt(e.target.value)
                        }
                    >
                        {PROMPTS.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </PromptSelect>

                    <TextArea
                        value={text}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setText(e.target.value)
                        }
                        placeholder="Write as little or as much as you want. This space is just for you."
                        title="Journal reflection"
                    />

                    <SaveButton onClick={handleSave} disabled={saving || loading}>
                        <img src={SaveIcon} alt="Save" />
                        {saving ? "Saving..." : "Save today’s check-in"}
                    </SaveButton>
                </Card>

                {/* Past Entries Card */}
                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Recent entries</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>
                        A quick view of your latest check-ins. Older entries are still
                        used in your Insights.
                    </SectionSub>

                    {entriesLoading ? (
                        <EmptyState>Loading past entries…</EmptyState>
                    ) : recentEntries.length === 0 ? (
                        <EmptyState>
                            No entries yet. When you save a check-in, it will appear here.
                        </EmptyState>
                    ) : (
                        <LogsList>
                            {recentEntries.map((e) => {
                                const triggerLabel =
                                    e.preUrgeTriggers && e.preUrgeTriggers.length > 0
                                        ? ` • Triggers: ${e.preUrgeTriggers.join(", ")}`
                                        : "";
                                const notesLabel = e.preUrgeTriggerNotes
                                    ? ` • Notes: ${e.preUrgeTriggerNotes}`
                                    : "";
                                return (
                                    <LogItem key={e._id}>
                                        <LogDate>📝 {formatDateTime(e.createdAt)}</LogDate>
                                        <LogMeta>
                                            {e.mood ? ` • Mood: ${e.mood}` : ""}{" "}
                                            {typeof e.urgeIntensity === "number"
                                                ? ` • Urge: ${e.urgeIntensity}/10`
                                                : ""}
                                            {triggerLabel}
                                            {notesLabel}
                                        </LogMeta>
                                    </LogItem>
                                );
                            })}
                        </LogsList>
                    )}
                </Card>

                {/* Trend Insights Card (separate, under Past Entries) */}
                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Trend insights</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>
                        A gentle snapshot of how your urge levels have changed across
                        recent entries.
                    </SectionSub>

                    {trendData.length < 2 ? (
                        <EmptyState>
                            After a few more check-ins, you’ll see your urge trend here.
                        </EmptyState>
                    ) : (
                        <TrendChartWrapper>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={trendData}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: -10,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="2 2" stroke="#dde" />
                                    <XAxis dataKey="label" tickMargin={4} />
                                    <Tooltip
                                        formatter={(v: number) => [`${v}/10`, "Urge"]}
                                        labelFormatter={(label: string) => label}
                                        contentStyle={{
                                            borderRadius: 8,
                                            fontSize: "0.75rem",
                                        }}
                                        labelStyle={{ fontSize: "0.75rem" }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="urgeIntensity"
                                        stroke="#ff5b7d"
                                        strokeWidth={2}
                                        dot={{ r: 2 }}
                                        isAnimationActive={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </TrendChartWrapper>
                    )}
                </Card>
            </Content>
        </PageWrapper>
    );
};

export default JournalPage;
