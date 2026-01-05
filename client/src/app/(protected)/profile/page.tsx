// client/src/app/(protected)/profile/page.tsx

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import styled, { css, keyframes } from "styled-components";
import { useRouter } from "next/navigation";
import { useAuth, useCopingStrategies } from "@/hooks";
import { axiosClient, authApi } from "@/services";
import { ThemeButton, FormInput } from "@/components";
import { BackIcon, UserIcon } from "@/assets/icons";
import { toImgSrc } from "@/utils";


/**---------------
    Animations
------------------*/
const pageEnter = keyframes`
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const sheetIn = keyframes`
    from { opacity: 0; transform: translateY(18px) scale(0.99); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const pulse = keyframes`
    0%   { box-shadow: 0 0 0 0 rgba(91, 138, 255, 0.45); transform: translateY(0); }
    70%  { box-shadow: 0 0 0 12px rgba(91, 138, 255, 0); transform: translateY(-1px); }
    100% { box-shadow: 0 0 0 0 rgba(91, 138, 255, 0); transform: translateY(0); }
`;

/**--------------------------
    Layout (mobile-first)
-----------------------------*/
const Shell = styled.main`
    width: 100%;
    min-height: 100dvh;
    padding: 14px 14px calc(96px + env(safe-area-inset-bottom, 0px));
    animation: ${pageEnter} 0.45s ease-out;
    background: ${({ theme }) =>
        `linear-gradient(180deg,
        rgba(226, 244, 247, 1) 0%,
        rgba(230, 247, 247, 1) 120px,
        ${theme.colors.page_bg || "#f4fbfc"} 320px
    )`};

    display: flex;
    justify-content: center;

    @media (min-width: 900px) {
        padding: 22px 18px 26px;
    }
`;

const Wrap = styled.div`
    width: 100%;
    max-width: 780px;
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const TopBar = styled.header`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 6px;
`;

const BackButton = styled.button`
    border: none;
    background: transparent;
    padding: 8px;
    border-radius: 14px;
    cursor: pointer;
    display: grid;
    place-items: center;

    &:hover {
        background: rgba(0, 0, 0, 0.04);
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.colors.primary};
        outline-offset: 2px;
    }
`;

const TopTitle = styled.h1`
    margin: 0;
    font-size: 1.15rem;
    font-weight: 900;
    color: ${({ theme }) => theme.colors.text_primary};
    letter-spacing: 0.01em;
    flex: 1;
    text-align: center;
`;

const TopSpacer = styled.div`
    width: 42px;
`;

const Sheet = styled.section`
    width: 100%;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 22px;
    padding: 14px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
    animation: ${sheetIn} 0.35s ease-out;

    @media (min-width: 768px) {
        padding: 16px;
    }
`;

const Hero = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    align-items: center;
`;

const AvatarRow = styled.div`
    display: flex;
    justify-content: center;
    position: relative;
    margin-top: 2px;
`;

const AvatarOuter = styled.div`
    width: 118px;
    height: 118px;
    border-radius: 50%;
    padding: 3px;
    background: radial-gradient(circle at 30% 0, #fff, transparent 55%),
        radial-gradient(circle at 80% 110%, rgba(140, 189, 255, 0.7), transparent 60%);
    display: grid;
    place-items: center;
`;

const AvatarImg = styled(Image)`
    width: 108px;
    height: 108px;
    border-radius: 50%;
    object-fit: cover;
`;

const ChangeAvatarButton = styled.label`
    position: absolute;
    bottom: 2px;
    right: calc(50% - 58px);
    display: inline-flex;
    align-items: center;
    gap: 6px;

    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
    padding: 0.38rem 0.72rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 800;
    cursor: pointer;
    user-select: none;

    &:hover {
        filter: brightness(0.98);
    }

    &:focus-within {
        outline: 2px solid rgba(0, 0, 0, 0.14);
        outline-offset: 2px;
    }
`;

const SectionTitle = styled.h2`
    margin: 12px 2px 10px;
    font-size: 0.95rem;
    font-weight: 950;
    color: ${({ theme }) => theme.colors.text_primary};
    letter-spacing: 0.01em;
`;

const SectionHint = styled.p`
    margin: 0 2px 10px;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    line-height: 1.45;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;

    @media (min-width: 900px) {
        grid-template-columns: 1.2fr 1fr;
        gap: 14px;
    }
`;

const Card = styled.div`
    border-radius: 18px;
    padding: 14px;
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.06);

    @media (min-width: 768px) {
        padding: 16px;
    }
`;

const Row = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;

    @media (min-width: 560px) {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }
`;

const Full = styled.div`
    grid-column: 1 / -1;
`;

/**------------------------------
    Sticky CTA (mobile-first)
---------------------------------*/
const StickyBar = styled.div`
    position: sticky;
    bottom: 0;
    z-index: 8;

    margin-top: 10px;
    padding-top: 10px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0),
        ${({ theme }) => theme.colors.page_bg || "#f4fbfc"} 35%
    );

    @media (min-width: 900px) {
        position: static;
        padding: 0;
        background: transparent;
    }
`;

const ActionsRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
`;

const PrimarySaveButton = styled(ThemeButton) <{ $pulse?: boolean }>`
    ${({ $pulse }) =>
        $pulse &&
        css`
            animation: ${pulse} 1.6s ease-out infinite;
        `
    }
`;

const SecondaryButton = styled(ThemeButton)`
    opacity: 0.9;
`;

const StatusText = styled.p<{ $tone?: "ok" | "warn" }>`
    margin: 10px 2px 0;
    padding: 10px 12px;
    border-radius: 14px;
    font-weight: 750;
    font-size: 0.9rem;
    line-height: 1.35;

    color: ${({ theme, $tone }) => ($tone === "ok" ? "#0a7a3a" : theme.colors.text_primary)};
    background: ${({ $tone }) =>
        $tone === "ok" ? "rgba(10,122,58,0.06)" : "rgba(0,0,0,0.03)"};

    border: 1px solid
        ${({ $tone }) => ($tone === "ok" ? "rgba(10,122,58,0.14)" : "rgba(0,0,0,0.06)")};
`;

const LoadingText = styled.div`
    padding: 18px 10px;
    text-align: center;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 750;
`;

/**------------------
    Cropper sheet
---------------------*/
const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(9, 20, 45, 0.46);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 4500;
    padding: 18px;
`;

const Modal = styled.div`
    width: 100%;
    max-width: 420px;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 22px;
    padding: 16px;
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(0, 0, 0, 0.08);
    animation: ${sheetIn} 0.28s ease-out;
`;

const ModalTitle = styled.h2`
    margin: 2px 0 12px;
    text-align: center;
    font-size: 1.05rem;
    font-weight: 950;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const CropArea = styled.div`
    width: 220px;
    height: 220px;
    border-radius: 50%;
    margin: 0 auto 14px;
    overflow: hidden;

    /* ✅ don’t hide the preview behind pure black if anything loads slowly */
    background: radial-gradient(circle at 30% 30%, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.10));
    border: 1px solid rgba(0, 0, 0, 0.08);

    display: grid;
    place-items: center;
`;

const CropPreview = styled.img<{ $zoom: number }>`
    width: 100%;
    height: 100%;
    object-fit: cover;

    /* ✅ zoom without “reflow” sizing issues */
    transform: scale(${({ $zoom }) => $zoom});
    transform-origin: center;
    will-change: transform;

    /* some mobile browsers benefit from this */
    backface-visibility: hidden;
`;

const SliderRow = styled.div`
    margin-bottom: 12px;

    label {
        display: block;
        margin-bottom: 6px;
        font-size: 0.9rem;
        font-weight: 750;
        color: ${({ theme }) => theme.colors.text_primary};
    }

    input[type="range"] {
        width: 100%;
    }
`;

const ModalActions = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
`;

/**----------
    Types
-------------*/
interface ExtendedUser {
    id: string;
    email: string;
    displayName?: string;
    age?: number;
    years_since_onset?: number;
    avatarUrl?: string;
    coping_worked?: string[];
    coping_not_worked?: string[];
}

function parseCommaList(raw: string): string[] {
    return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

function toNumberOrUndef(raw: string): number | undefined {
    if (raw === "") return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
}

function eqStringArray(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function profilesEqual(a: ExtendedUser, b: ExtendedUser): boolean {
    return (
        a.email === b.email &&
        (a.displayName ?? "") === (b.displayName ?? "") &&
        (a.age ?? null) === (b.age ?? null) &&
        (a.years_since_onset ?? null) === (b.years_since_onset ?? null) &&
        (a.avatarUrl ?? "") === (b.avatarUrl ?? "")
    );
}

/**---------
    Page
------------*/
export default function ProfilePage() {
    const router = useRouter();
    const { isAuthenticated, logout, refreshUser, user } = useAuth();

    const { worked: copingWorked, notWorked: copingNotWorked, setFromBackend } = useCopingStrategies();

    const [profile, setProfile] = useState<ExtendedUser | null>(null);
    const [initialProfile, setInitialProfile] = useState<ExtendedUser | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatarUrl || toImgSrc(UserIcon));
    const [avatarSource, setAvatarSource] = useState<HTMLImageElement | null>(null);

    // ✅ Keep the object URL alive while cropping; revoke on close/apply
    const [avatarObjectUrl, setAvatarObjectUrl] = useState<string | null>(null);

    const [zoom, setZoom] = useState(1);
    const [showCropper, setShowCropper] = useState(false);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
    const [passwordTone, setPasswordTone] = useState<"ok" | "warn">("warn");

    // keep latest setFromBackend without adding it to every callback dep list
    const setFromBackendRef = useRef(setFromBackend);
    useEffect(() => {
        setFromBackendRef.current = setFromBackend;
    }, [setFromBackend]);

    // cleanup any remaining object URL on unmount
    useEffect(() => {
        return () => {
            if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
        };
    }, [avatarObjectUrl]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace("/login?next=/profile");
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            try {
                const res = await axiosClient.get<{ ok: boolean; user: ExtendedUser }>("/auth/me");
                if (cancelled) return;

                const u = res.data.user;
                setProfile(u);
                setInitialProfile(u);
                setAvatarPreview(u.avatarUrl || toImgSrc(UserIcon));
                setFromBackendRef.current(u.coping_worked, u.coping_not_worked);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, router]);

    const hasChanges = useMemo(() => {
        if (!profile || !initialProfile) return false;
        if (!profilesEqual(profile, initialProfile)) return true;

        const initialWorked = initialProfile.coping_worked ?? [];
        const initialNotWorked = initialProfile.coping_not_worked ?? [];
        if (!eqStringArray(copingWorked, initialWorked)) return true;
        if (!eqStringArray(copingNotWorked, initialNotWorked)) return true;

        return false;
    }, [profile, initialProfile, copingWorked, copingNotWorked]);

    const handleProfileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile((prev) => {
            if (!prev) return prev;

            const { name, value } = e.target;

            if (name === "age") return { ...prev, age: toNumberOrUndef(value) };
            if (name === "years_since_onset") return { ...prev, years_since_onset: toNumberOrUndef(value) };

            return { ...prev, [name]: value };
        });
    }, []);

    const handleCopingInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            const parsed = parseCommaList(value);

            if (name === "coping_worked") setFromBackendRef.current(parsed, copingNotWorked);
            if (name === "coping_not_worked") setFromBackendRef.current(copingWorked, parsed);
        },
        [copingNotWorked, copingWorked]
    );

    const closeCropper = useCallback(() => {
        setShowCropper(false);
        setAvatarSource(null);

        setAvatarObjectUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
    }, []);

    const handleAvatarUpload = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // allow re-selecting the same file
            e.target.value = "";

            // revoke old URL if any
            setAvatarObjectUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return prev;
            });

            const url = URL.createObjectURL(file);
            setAvatarObjectUrl(url);

            const img = new globalThis.Image();
            img.onload = () => {
                setAvatarSource(img);
                setZoom(1);
                setShowCropper(true);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                setAvatarObjectUrl(null);
            };
            img.src = url;
        },
        []
    );

    const applyAvatarCrop = useCallback(() => {
        if (!avatarSource) return;

        const canvas = document.createElement("canvas");
        const size = 220;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const imgW = avatarSource.width;
        const imgH = avatarSource.height;

        const baseScale = size / Math.min(imgW, imgH);
        const effectiveZoom = baseScale * zoom;

        const w = imgW * effectiveZoom;
        const h = imgH * effectiveZoom;
        const x = (size - w) / 2;
        const y = (size - h) / 2;

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarSource, x, y, w, h);

        const url = canvas.toDataURL("image/jpeg", 0.88);

        setAvatarPreview(url);
        setProfile((p) => (p ? { ...p, avatarUrl: url } : p));

        // ✅ close + revoke object URL AFTER we no longer need it
        closeCropper();
    }, [avatarSource, zoom, closeCropper]);

    const handleSave = useCallback(async () => {
        if (!profile) return;

        setSaving(true);
        try {
            const payload: ExtendedUser & { coping_worked: string[]; coping_not_worked: string[] } = {
                ...profile,
                coping_worked: copingWorked,
                coping_not_worked: copingNotWorked,
            };

            const res = await axiosClient.patch<{ ok: boolean; user: ExtendedUser }>("/users/profile", payload);
            setProfile(res.data.user);
            setInitialProfile(res.data.user);

            await refreshUser();
        } finally {
            setSaving(false);
        }
    }, [profile, copingWorked, copingNotWorked, refreshUser]);

    const handlePasswordChange = useCallback(async () => {
        setPasswordMsg(null);
        setPasswordTone("warn");

        if (newPassword !== confirmPassword) {
            setPasswordMsg("Passwords do not match.");
            return;
        }
        if (!oldPassword || !newPassword) {
            setPasswordMsg("Please fill in your old and new password.");
            return;
        }

        try {
            await authApi.changePassword({ oldPassword, newPassword });
            setPasswordTone("ok");
            setPasswordMsg("Password updated!");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            setPasswordTone("warn");
            setPasswordMsg("Incorrect old password.");
        }
    }, [oldPassword, newPassword, confirmPassword]);

    const handleLogout = useCallback(() => {
        logout();
        router.replace("/login");
    }, [logout, router]);

    if (!isAuthenticated) return <LoadingText>Please login…</LoadingText>;
    if (loading) return <LoadingText>Loading your profile…</LoadingText>;

    const avatarSrc = avatarPreview || profile?.avatarUrl || user?.avatarUrl || toImgSrc(UserIcon);

    return (
        <>
            <Shell>
                <Wrap>
                    <TopBar>
                        <BackButton type="button" onClick={() => router.push("/home")} aria-label="Go back">
                            <Image src={BackIcon} alt="Go back" width={26} height={26} />
                        </BackButton>
                        <TopTitle>Your profile</TopTitle>
                        <TopSpacer aria-hidden="true" />
                    </TopBar>

                    <Sheet>
                        <Hero>
                            <AvatarRow>
                                <AvatarOuter>
                                    <AvatarImg
                                        src={avatarSrc}
                                        alt="Avatar"
                                        width={108}
                                        height={108}
                                        unoptimized
                                    />
                                </AvatarOuter>

                                <ChangeAvatarButton>
                                    Change
                                    <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                                </ChangeAvatarButton>
                            </AvatarRow>

                            <SectionHint>
                                Update your name, coping strategies, or avatar. Your email can’t be changed here.
                            </SectionHint>
                        </Hero>
                    </Sheet>

                    <Grid>
                        <Sheet>
                            <SectionTitle>Account</SectionTitle>

                            <Row>
                                <Full>
                                    <FormInput
                                        label="Email"
                                        name="email"
                                        value={profile?.email || ""}
                                        disabled
                                        onChange={() => {
                                            // no-op: required by FormInput typing
                                        }}
                                    />
                                </Full>

                                <Full>
                                    <FormInput
                                        label="Display name"
                                        name="displayName"
                                        value={profile?.displayName || ""}
                                        onChange={handleProfileChange}
                                        autoComplete="nickname"
                                    />
                                </Full>

                                <FormInput
                                    label="Age"
                                    name="age"
                                    type="number"
                                    value={profile?.age ?? ""}
                                    onChange={handleProfileChange}
                                    inputMode="numeric"
                                />

                                <FormInput
                                    label="Years since onset"
                                    name="years_since_onset"
                                    type="number"
                                    value={profile?.years_since_onset ?? ""}
                                    onChange={handleProfileChange}
                                    inputMode="numeric"
                                />
                            </Row>

                            <SectionTitle>Coping strategies</SectionTitle>

                            <Card>
                                <FormInput
                                    label="Strategies that worked"
                                    name="coping_worked"
                                    placeholder="e.g. fidget toy, deep breathing, wearing gloves"
                                    value={copingWorked.join(", ")}
                                    onChange={handleCopingInputChange}
                                />

                                <FormInput
                                    label="Strategies that didn’t help"
                                    name="coping_not_worked"
                                    placeholder="e.g. journaling, stress ball"
                                    value={copingNotWorked.join(", ")}
                                    onChange={handleCopingInputChange}
                                />
                            </Card>
                        </Sheet>

                        <Sheet>
                            <SectionTitle>Password</SectionTitle>
                            <SectionHint>Choose a strong password you don’t reuse elsewhere.</SectionHint>

                            <Card>
                                <FormInput
                                    label="Old password"
                                    name="old_password"
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    autoComplete="current-password"
                                />

                                <FormInput
                                    label="New password"
                                    name="new_password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                />

                                <FormInput
                                    label="Confirm new password"
                                    name="confirm_password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />

                                <ThemeButton onClick={handlePasswordChange}>Update password</ThemeButton>

                                {passwordMsg && <StatusText $tone={passwordTone}>{passwordMsg}</StatusText>}
                            </Card>
                        </Sheet>
                    </Grid>

                    <StickyBar>
                        <ActionsRow>
                            <PrimarySaveButton onClick={handleSave} $pulse={hasChanges}>
                                {saving ? "Saving…" : hasChanges ? "Save changes" : "Saved"}
                            </PrimarySaveButton>

                            <SecondaryButton onClick={handleLogout}>Logout</SecondaryButton>
                        </ActionsRow>

                        {hasChanges && (
                            <StatusText $tone="warn">
                                You have unsaved changes. Tap <strong>Save changes</strong> to apply them.
                            </StatusText>
                        )}
                    </StickyBar>
                </Wrap>
            </Shell>

            {showCropper && avatarSource && (
                <Overlay role="dialog" aria-modal="true" aria-label="Adjust your avatar">
                    <Modal>
                        <ModalTitle>Adjust your avatar</ModalTitle>

                        <CropArea>
                            {/* ✅ Use the object URL, don’t revoke until close/apply */}
                            <CropPreview
                                src={avatarObjectUrl ?? avatarSource.src}
                                alt="crop preview"
                                $zoom={zoom}
                            />
                        </CropArea>

                        <SliderRow>
                            <label htmlFor="avatar-zoom">Zoom</label>
                            <input
                                id="avatar-zoom"
                                type="range"
                                min={1}
                                max={2.4}
                                step={0.02}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                            />
                        </SliderRow>

                        <ModalActions>
                            <SecondaryButton onClick={closeCropper}>Cancel</SecondaryButton>
                            <ThemeButton onClick={applyAvatarCrop}>Apply</ThemeButton>
                        </ModalActions>
                    </Modal>
                </Overlay>
            )}
        </>
    );
}
