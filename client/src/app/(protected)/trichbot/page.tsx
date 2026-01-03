// client/src/app/(protected)/trichbot/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useAuth, useTrichBot } from "@/hooks";
import {
    trichBotApi,
    type TrichBotMessage
} from "@/services";
import {
    TrichBotIcon,
    UserIcon,
    SaveIcon,
    ArrowEnterIcon
} from "@/assets/icons";
import { toImgSrc } from "@/utils";


/**----------------------
    Styled Components
-------------------------*/
const PageWrapper = styled.main`
    width: 100%;
    min-height: 100vh;
    padding: 1.25rem 1.2rem 100px;
    background: linear-gradient(
        180deg,
        #e2f4f7 0%,
        #e6f7f7 120px,
        ${({ theme }) => theme.colors.page_bg || "#f4fbfc"} 300px
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
    margin-bottom: 1.4rem;
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
    color: ${({ theme }) => theme.colors.text_primary};
    font-weight: 700;
`;

const HeaderSubtitle = styled.span`
    font-size: 0.55rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    line-height: 0;

    .p-one,
    .p-two {
        display: block;
    }
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

const Card = styled.section`
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 18px;
    padding: 1.1rem 1rem 1.2rem;
    box-shadow: 0 10px 28px rgba(13, 98, 117, 0.35);
    margin-bottom: 1.1rem;
`;

const SectionTitle = styled.h3`
    font-size: 0.9rem;
    margin: 0 0 0.3rem;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const SectionSub = styled.p`
    margin: 0 0 0.6rem;
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const SmallLabel = styled.span`
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const SmallLabelBlock = styled(SmallLabel)`
    display: block;
    margin-top: 0.3rem;
`;

const ChatList = styled.div`
    max-height: 360px;
    overflow-y: auto;
    padding-right: 0.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
`;

const MessageRow = styled.div<{ $role: "user" | "bot" }>`
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    justify-content: ${({ $role }) => ($role === "user" ? "flex-end" : "flex-start")};
`;

const AvatarBubble = styled.img`
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.9);
`;

const MessageBubble = styled.div<{ $role: "user" | "bot" }>`
    max-width: 75%;
    padding: 0.55rem 0.7rem;
    border-radius: 16px;
    font-size: 0.8rem;
    line-height: 1.4;
    white-space: pre-wrap;
    text-align: justify;

    background: ${({ $role }) => ($role === "user" ? "#00b3c4" : "rgba(255,255,255,0.96)")};
    color: ${({ $role, theme }) => ($role === "user" ? "#ffffff" : theme.colors.text_primary)};

    border: ${({ $role }) => ($role === "bot" ? "1px solid rgba(0,0,0,0.05)" : "none")};
`;

const BotIntroText = styled.p<{ $hasTips: boolean }>`
    margin: 0;
    margin-bottom: ${({ $hasTips }) => ($hasTips ? "0.45rem" : "0")};
`;

const BotTipsList = styled.ol`
    padding-left: 1.1rem;
    margin: 0;
`;

const BotTipsListItem = styled.li`
    margin-bottom: 0.25rem;
    &:last-child {
        margin-bottom: 0;
    }
`;

const ButtonRow = styled.div`
    margin-top: 0.8rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
`;

const SaveButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.55rem 0.8rem;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: #e1f7ff;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;

    &:disabled {
        opacity: 0.6;
        cursor: default;
    }
`;

const ClearButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 0.8rem;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    background: #f6f7fb;
    color: ${({ theme }) => theme.colors.text_secondary};
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;

    &:disabled {
        opacity: 0.5;
        cursor: default;
    }
`;

const SaveIconImg = styled.img`
    width: 18px;
    height: 18px;
`;

const SavedBanner = styled.div`
    margin-top: 0.7rem;
    padding: 0.6rem 0.9rem;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.primary};
    color: #ffffff;
    text-align: center;
    font-size: 0.8rem;
    font-weight: 600;
`;

const InputRow = styled.form`
    display: flex;
    align-items: center;
    gap: 0.55rem;
`;

const TextInput = styled.textarea`
    flex: 1;
    min-height: 42px;
    max-height: 90px;
    padding: 0.55rem 0.7rem;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.14);
    resize: none;
    font-size: 0.8rem;
    font-family: inherit;
    outline: none;
`;

const SendButton = styled.button`
    width: 38px;
    height: 38px;
    border-radius: 999px;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:disabled {
        opacity: 0.4;
        cursor: default;
    }
`;

const SendIconImg = styled.img`
    width: 18px;
    height: 18px;
`;

const EmptyState = styled.p`
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    margin: 0.2rem 0 0.4rem;
`;

const ErrorLabel = styled(SmallLabel)`
    display: block;
    margin-top: 0.35rem;
    color: #b3261e;
`;

function splitBotResponse(text: string): { intro: string; tips: string[] } {
    const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const introParts: string[] = [];
    const tips: string[] = [];

    for (const line of lines) {
        if (/^\d+\.\s+/.test(line)) tips.push(line.replace(/^\d+\.\s+/, ""));
        else introParts.push(line);
    }

    return { intro: introParts.join(" "), tips: tips.slice(0, 3) };
}

function stripHtml(input: string): string {
    return input.replace(/<[^>]+>/g, "");
}

export default function TrichBotPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const { sendMessage, loading } = useTrichBot();

    const [messages, setMessages] = useState<TrichBotMessage[]>([]);
    const [input, setInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [showSavedBanner, setShowSavedBanner] = useState(false);
    const [botError, setBotError] = useState<string | null>(null);

    const headerAvatarSrc = toImgSrc(user?.avatarUrl) || toImgSrc(UserIcon);

    const clearKey =
        user?.email ? `tm_trichbot_cleared_${user.email}` : "tm_trichbot_cleared";

    useEffect(() => {
        if (!isAuthenticated) router.replace("/login?next=/trichbot");
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const clearedFlag = localStorage.getItem(clearKey);
        if (clearedFlag === "1") {
            setMessages([]);
            return;
        }

        const loadHistory = async () => {
            try {
                const history = await trichBotApi.list({ page: 1, limit: 30, sort: "createdAt" });
                setMessages(history);
            } catch {
                // silent fail
            }
        };

        void loadHistory();
    }, [isAuthenticated, clearKey]);

    const handleSend = async () => {
        if (!input.trim() || !isAuthenticated) return;

        const prompt = input.trim();
        setInput("");
        setBotError(null);

        try {
            const msg = await sendMessage(prompt, "trichmind_app_trichotillomania_support");
            setMessages((prev) => [...prev, msg]);
        } catch (err) {
            console.error("TrichBot send error:", err);
            setInput(prompt);
            setBotError("TrichBot is not available right now (server error). Please try again in a moment.");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void handleSend();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
        }
    };

    const handleSaveConversation = () => {
        if (!messages || messages.length === 0) return;

        setSaving(true);
        try {
            const lines: string[] = [];
            lines.push("TrichMind – TrichBot Conversation");
            lines.push(`Exported: ${new Date().toLocaleString()}`);
            lines.push("");
            lines.push("This transcript is for your personal reflection. It is not medical advice.");
            lines.push("");

            messages.forEach((m, idx) => {
                const created = m.createdAt ? new Date(m.createdAt).toLocaleString() : "";
                lines.push(`───────── Exchange ${idx + 1}${created ? ` • ${created}` : ""} ─────────`);
                lines.push("You:");
                lines.push(m.prompt || "");
                lines.push("");

                if (m.response) {
                    lines.push("TrichBot:");
                    lines.push(stripHtml(m.response));
                    lines.push("");
                }
            });

            const content = lines.join("\n");
            const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "trichbot_conversation.txt";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setShowSavedBanner(true);
            window.setTimeout(() => setShowSavedBanner(false), 4000);
        } finally {
            setSaving(false);
        }
    };

    const handleClearConversation = () => {
        if (!messages || messages.length === 0) return;

        const confirmed = window.confirm(
            "Clear this chat from your screen?\n\nThis won’t delete anything from the server, but it will empty this conversation view and keep it clear next time you log in."
        );
        if (!confirmed) return;

        setMessages([]);
        localStorage.setItem(clearKey, "1");
    };

    if (!isAuthenticated) return null;

    const showIntroBotBubble = messages.length === 0 && !loading;

    return (
        <PageWrapper>
            <Content>
                <Header>
                    <HeaderLeft>
                        <HeaderIcon src={TrichBotIcon.src} alt="TrichBot icon" />
                        <HeaderTitleGroup>
                            <HeaderTitle>TrichBot · TrichMind assistant</HeaderTitle>
                            <HeaderSubtitle>
                                <p className="p-one">The in-app companion for people living with trichotillomania –</p>
                                <p className="p-two">here to guide you through urges, tools, and gentle next steps.</p>
                            </HeaderSubtitle>
                        </HeaderTitleGroup>
                    </HeaderLeft>

                    <AvatarButton onClick={() => router.push("/profile")}>
                        <AvatarImage src={headerAvatarSrc} alt={user?.email || "Profile"} />
                    </AvatarButton>
                </Header>

                <Card>
                    <SectionTitle>Conversation</SectionTitle>
                    <SectionSub>
                        Share what&apos;s going on. TrichBot can help you reflect on urges, make sense of your relapse risk,
                        and suggest ways to use TrichMind features like your dashboard, daily check-ins, coping strategies and journaling.
                    </SectionSub>

                    {showIntroBotBubble && (
                        <EmptyState>
                            No conversation yet. Say hello and tell TrichBot what&apos;s on your mind – or ask how to use TrichMind to support you today.
                        </EmptyState>
                    )}

                    <ChatList>
                        {showIntroBotBubble && (
                            <MessageRow $role="bot">
                                <AvatarBubble src={TrichBotIcon.src} alt="TrichBot" />
                                <MessageBubble $role="bot">
                                    Hi, I&apos;m TrichBot – the assistant inside the TrichMind app. I&apos;m here to support you with trichotillomania:
                                    making sense of your relapse risk, tracking small wins, exploring coping strategies and using tools like your daily progress card,
                                    urge check-ins and notes. When you&apos;re ready, tell me a bit about what you&apos;re feeling or what&apos;s been triggering you,
                                    and we&apos;ll take the next step together.
                                </MessageBubble>
                            </MessageRow>
                        )}

                        {messages.map((m) => {
                            const key = m._id ?? `${m.createdAt}-${m.prompt}`;
                            const { intro, tips } = splitBotResponse(m.response || "");

                            return (
                                <React.Fragment key={key}>
                                    <MessageRow $role="user">
                                        <MessageBubble $role="user">{m.prompt}</MessageBubble>
                                        <AvatarBubble src={headerAvatarSrc} alt="You" />
                                    </MessageRow>

                                    {m.response && (
                                        <MessageRow $role="bot">
                                            <AvatarBubble src={TrichBotIcon.src} alt="TrichBot" />
                                            <MessageBubble $role="bot">
                                                <BotIntroText $hasTips={tips.length > 0} dangerouslySetInnerHTML={{ __html: intro }} />
                                                {tips.length > 0 && (
                                                    <BotTipsList>
                                                        {tips.map((tip, idx) => (
                                                            <BotTipsListItem key={idx}>{tip}</BotTipsListItem>
                                                        ))}
                                                    </BotTipsList>
                                                )}
                                            </MessageBubble>
                                        </MessageRow>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {loading && (
                            <MessageRow $role="bot">
                                <AvatarBubble src={TrichBotIcon.src} alt="TrichBot" />
                                <MessageBubble $role="bot">I’m thinking about that for you… 🌿</MessageBubble>
                            </MessageRow>
                        )}
                    </ChatList>

                    <ButtonRow>
                        <SaveButton type="button" onClick={handleSaveConversation} disabled={saving || messages.length === 0}>
                            <SaveIconImg src={SaveIcon.src} alt="Save" />
                            {saving ? "Saving…" : "Save conversation"}
                        </SaveButton>

                        <ClearButton type="button" onClick={handleClearConversation} disabled={messages.length === 0}>
                            Clear chat
                        </ClearButton>
                    </ButtonRow>

                    {showSavedBanner && <SavedBanner>Conversation saved!</SavedBanner>}
                </Card>

                <Card>
                    <SectionTitle>Type your message…</SectionTitle>
                    <SectionSub>
                        You can talk about urges, stress, wins, or questions about trichotillomania, or ask how to use TrichMind tools
                        (like your risk dashboard, daily progress, or coping cards). TrichBot will respond with ideas, not judgment.
                    </SectionSub>

                    <InputRow onSubmit={handleSubmit}>
                        <TextInput
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message…"
                            aria-label="TrichBot message"
                        />
                        <SendButton type="submit" disabled={loading || !input.trim()}>
                            <SendIconImg src={ArrowEnterIcon.src} alt="Send" />
                        </SendButton>
                    </InputRow>

                    {loading && <SmallLabelBlock>TrichBot is responding…</SmallLabelBlock>}
                    {botError && <ErrorLabel>{botError}</ErrorLabel>}
                </Card>
            </Content>
        </PageWrapper>
    );
}
