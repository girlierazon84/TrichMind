// client/src/pages/TrichBotPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import { useAuth, useTrichBot } from "@/hooks";
import { trichBotApi, type TrichBotMessage } from "@/services";
import {
    TrichBotIcon,
    UserIcon,
    SaveIcon,
    ArrowEnterIcon,
} from "@/assets/icons";

// ---------- Styled components ----------

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
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.text_secondary};
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

// Cards
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

// Chat layout
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
    justify-content: ${({ $role }) =>
        $role === "user" ? "flex-end" : "flex-start"};
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

    background: ${({ $role }) =>
        $role === "user" ? "#00b3c4" : "rgba(255,255,255,0.96)"};
    color: ${({ $role, theme }) =>
        $role === "user" ? "#ffffff" : theme.colors.text_primary};

    border: ${({ $role }) =>
        $role === "bot" ? "1px solid rgba(0,0,0,0.05)" : "none"};
`;

// Bot text pieces
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

// Save conversation
const SaveButton = styled.button`
    margin-top: 0.8rem;
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

// Input area
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
    background: transparent; /* 🔹 transparent, only arrow visible */
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

// -------- helper: keep bot reply in ONE bubble --------
function splitBotResponse(text: string): { intro: string; tips: string[] } {
    const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const introParts: string[] = [];
    const tips: string[] = [];

    for (const line of lines) {
        if (/^\d+\.\s+/.test(line)) {
            tips.push(line.replace(/^\d+\.\s+/, ""));
        } else {
            introParts.push(line);
        }
    }

    const intro = introParts.join(" ");

    return {
        intro,
        tips: tips.slice(0, 3), // max 3 tips
    };
}

// ---------------- Component ----------------

export const TrichBotPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { sendMessage, loading } = useTrichBot();

    const [messages, setMessages] = useState<TrichBotMessage[]>([]);
    const [input, setInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [showSavedBanner, setShowSavedBanner] = useState(false);
    const [botError, setBotError] = useState<string | null>(null);

    // Safely read avatarUrl from user (may be undefined on base type)
    const headerAvatar =
        (user && (user as unknown as { avatarUrl?: string }).avatarUrl) ||
        UserIcon;

    // Redirect guests to login
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
        }
    }, [isAuthenticated, navigate]);

    // Load previous bot messages
    useEffect(() => {
        if (!isAuthenticated) return;

        const loadHistory = async () => {
            try {
                const history = await trichBotApi.list({
                    page: 1,
                    limit: 30,
                    sort: "createdAt",
                });
                setMessages(history);
            } catch {
                // fail quietly – chat will just start empty
            }
        };

        void loadHistory();
    }, [isAuthenticated]);

    const handleSend = async () => {
        if (!input.trim() || !isAuthenticated) return;

        const prompt = input.trim();
        setInput("");
        setBotError(null);

        try {
            const msg = await sendMessage(prompt, "urge_support");
            setMessages((prev) => [...prev, msg]);
        } catch (err) {
            console.error("TrichBot send error:", err);
            setInput(prompt); // put text back so the user doesn't lose it
            setBotError(
                "TrichBot is not available right now (server error). Please try again in a moment."
            );
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void handleSend();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        // Enter = send, Shift+Enter = new line
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
        }
    };

    const handleSaveConversation = () => {
        if (!messages || messages.length === 0) return;

        setSaving(true);
        try {
            const payload = JSON.stringify(messages, null, 2);
            const blob = new Blob([payload], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "trichbot_conversation.json";
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

    if (!isAuthenticated) {
        return null;
    }

    return (
        <PageWrapper>
            <Content>
                <Header>
                    <HeaderLeft>
                        <HeaderIcon src={TrichBotIcon} alt="TrichBot icon" />
                        <HeaderTitleGroup>
                            <HeaderTitle>TrichBot</HeaderTitle>
                            <HeaderSubtitle>
                                Your safe space to chat and reflect. This is a supportive
                                bot, not medical advice.
                            </HeaderSubtitle>
                        </HeaderTitleGroup>
                    </HeaderLeft>

                    <AvatarButton onClick={() => navigate("/profile")}>
                        <AvatarImage src={headerAvatar} alt={user?.email || "Profile"} />
                    </AvatarButton>
                </Header>

                {/* Chat history */}
                <Card>
                    <SectionTitle>Conversation</SectionTitle>
                    <SectionSub>
                        Share what&apos;s going on. TrichBot will offer gentle support and
                        a few coping ideas you can try right away.
                    </SectionSub>

                    {messages.length === 0 && !loading && (
                        <EmptyState>
                            No conversation yet. Say hello and tell TrichBot what&apos;s
                            on your mind.
                        </EmptyState>
                    )}

                    <ChatList>
                        {messages.map((m) => {
                            const key = m._id ?? `${m.createdAt}-${m.prompt}`;
                            const { intro, tips } = splitBotResponse(m.response || "");

                            return (
                                <React.Fragment key={key}>
                                    {/* User prompt */}
                                    <MessageRow $role="user">
                                        <MessageBubble $role="user">
                                            {m.prompt}
                                        </MessageBubble>
                                        <AvatarBubble src={headerAvatar} alt="You" />
                                    </MessageRow>

                                    {/* Bot response – single cohesive bubble */}
                                    {m.response && (
                                        <MessageRow $role="bot">
                                            <AvatarBubble
                                                src={TrichBotIcon}
                                                alt="TrichBot"
                                            />
                                            <MessageBubble $role="bot">
                                                {/* Render intro as HTML so <strong><em>verse</em></strong> is styled */}
                                                <BotIntroText
                                                    $hasTips={tips.length > 0}
                                                    dangerouslySetInnerHTML={{
                                                        __html: intro,
                                                    }}
                                                />

                                                {tips.length > 0 && (
                                                    <BotTipsList>
                                                        {tips.map((tip, idx) => (
                                                            <BotTipsListItem key={idx}>
                                                                {tip}
                                                            </BotTipsListItem>
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
                                <AvatarBubble src={TrichBotIcon} alt="TrichBot" />
                                <MessageBubble $role="bot">
                                    I’m thinking about that for you… 🌿
                                </MessageBubble>
                            </MessageRow>
                        )}
                    </ChatList>

                    <SaveButton
                        type="button"
                        onClick={handleSaveConversation}
                        disabled={saving || messages.length === 0}
                    >
                        <SaveIconImg src={SaveIcon} alt="Save" />
                        {saving ? "Saving…" : "Save Conversation"}
                    </SaveButton>

                    {showSavedBanner && (
                        <SavedBanner>Conversation saved!</SavedBanner>
                    )}
                </Card>

                {/* Input card */}
                <Card>
                    <SectionTitle>Type your message…</SectionTitle>
                    <SectionSub>
                        You can talk about urges, stress, wins, or questions about
                        trichotillomania. TrichBot will respond with ideas, not judgment.
                    </SectionSub>

                    <InputRow onSubmit={handleSubmit}>
                        <TextInput
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown} // 🔹 Enter-to-send
                            placeholder="Type your message…"
                        />
                        <SendButton type="submit" disabled={loading || !input.trim()}>
                            <SendIconImg src={ArrowEnterIcon} alt="Send" />
                        </SendButton>
                    </InputRow>
                    {loading && (
                        <SmallLabelBlock>TrichBot is responding…</SmallLabelBlock>
                    )}
                    {botError && <ErrorLabel>{botError}</ErrorLabel>}
                </Card>
            </Content>
        </PageWrapper>
    );
};

export default TrichBotPage;
