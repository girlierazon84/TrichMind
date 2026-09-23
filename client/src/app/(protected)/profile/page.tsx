// client/src/app/(protected)/profile/page.tsx

"use client";

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import Image from "next/image";
import styled, { css, keyframes } from "styled-components";
import { useRouter } from "next/navigation";
import { useAuth, useCopingStrategies } from "@/hooks";
import { authApi, userApi } from "@/services";
import { ThemeButton, FormInput } from "@/components";
import { BackIcon, UserIcon } from "@/assets/icons";
import { toImgSrc } from "@/utils";

/**---------------
    Animations
------------------*/
const pageEnter = keyframes`
    from {
        opacity: 0;
        transform: translateY(12px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const sheetIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(18px) scale(0.99);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
`;

const pulse = keyframes`
    0% {
        box-shadow: 0 0 0 0 rgba(91, 138, 255, 0.45);
        transform: translateY(0);
    }

    70% {
        box-shadow: 0 0 0 12px rgba(91, 138, 255, 0);
        transform: translateY(-1px);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(91, 138, 255, 0);
        transform: translateY(0);
    }
`;

/**--------------------------
    Layout
-----------------------------*/
const Shell = styled.main`
    width: 100%;
    min-height: 100dvh;
    overflow-x: clip;

    display: flex;
    justify-content: center;

    padding:
        max(10px, env(safe-area-inset-top, 0px))
        10px
        calc(108px + env(safe-area-inset-bottom, 0px));

    animation: ${pageEnter} 0.45s ease-out;

    background: ${({ theme }) =>
        `linear-gradient(
            180deg,
            rgba(226, 244, 247, 1) 0%,
            rgba(230, 247, 247, 1) 120px,
            ${theme.colors.page_bg || "#f4fbfc"} 320px
        )`};

    @media (min-width: 480px) {
        padding-left: 14px;
        padding-right: 14px;
    }

    @media (min-width: 900px) {
        padding: 22px 18px 30px;
    }
`;

const Wrap = styled.div`
    width: 100%;
    max-width: 780px;
    min-width: 0;

    display: flex;
    flex-direction: column;
    gap: 10px;

    @media (min-width: 768px) {
        gap: 12px;
    }
`;

const TopBar = styled.header`
    position: sticky;
    top: 0;
    z-index: 40;

    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;

    min-height: 54px;
    padding: 6px 2px;

    background: rgba(238, 249, 250, 0.88);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);

    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    @media (min-width: 900px) {
        position: static;
        background: transparent;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        border-bottom: none;
    }
`;

const BackButton = styled.button`
    width: 42px;
    height: 42px;

    border: none;
    background: transparent;

    padding: 8px;
    border-radius: 14px;

    cursor: pointer;

    display: grid;
    place-items: center;

    touch-action: manipulation;

    &:hover {
        background: rgba(0, 0, 0, 0.04);
    }

    &:active {
        transform: scale(0.97);
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.colors.primary};
        outline-offset: 2px;
    }
`;

const TopTitle = styled.h1`
    margin: 0;

    text-align: center;

    font-size: 1.08rem;
    font-weight: 900;
    line-height: 1.2;

    color: ${({ theme }) => theme.colors.text_primary};

    letter-spacing: 0.01em;

    @media (min-width: 768px) {
        font-size: 1.2rem;
    }
`;

const TopSpacer = styled.div`
    width: 42px;
    height: 42px;
`;

const Sheet = styled.section`
    width: 100%;
    min-width: 0;

    background: ${({ theme }) => theme.colors.card_bg};

    border-radius: 18px;

    padding: 12px;

    border: 1px solid rgba(0, 0, 0, 0.06);

    box-shadow: ${({ theme }) => theme.colors.card_shadow};

    animation: ${sheetIn} 0.35s ease-out;

    @media (min-width: 480px) {
        border-radius: 20px;
        padding: 14px;
    }

    @media (min-width: 768px) {
        border-radius: 22px;
        padding: 16px;
    }
`;

const Hero = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    gap: 12px;

    width: 100%;
`;

const AvatarRow = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    position: relative;

    width: 100%;

    margin-top: 4px;
    margin-bottom: 8px;
`;

const AvatarOuter = styled.div`
    width: 104px;
    height: 104px;

    border-radius: 50%;

    padding: 3px;

    background:
        radial-gradient(
            circle at 30% 0,
            #fff,
            transparent 55%
        ),
        radial-gradient(
            circle at 80% 110%,
            rgba(140, 189, 255, 0.7),
            transparent 60%
        );

    display: grid;
    place-items: center;

    @media (min-width: 480px) {
        width: 116px;
        height: 116px;
    }

    @media (min-width: 768px) {
        width: 122px;
        height: 122px;
    }
`;

const AvatarImg = styled(Image)`
    width: 96px;
    height: 96px;

    border-radius: 50%;
    object-fit: cover;

    @media (min-width: 480px) {
        width: 108px;
        height: 108px;
    }

    @media (min-width: 768px) {
        width: 114px;
        height: 114px;
    }
`;

const ChangeAvatarButton = styled.label`
    position: absolute;

    bottom: -4px;
    left: 50%;

    transform: translateX(22px);

    display: inline-flex;
    align-items: center;
    justify-content: center;

    min-height: 34px;

    background: ${({ theme }) => theme.colors.primary};
    color: #fff;

    padding: 0.38rem 0.72rem;

    border-radius: 999px;

    font-size: 0.76rem;
    font-weight: 800;

    cursor: pointer;
    user-select: none;
    touch-action: manipulation;

    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);

    &:hover {
        filter: brightness(0.98);
    }

    &:active {
        transform: translateX(22px) scale(0.98);
    }

    &:focus-within {
        outline: 2px solid rgba(0, 0, 0, 0.14);
        outline-offset: 2px;
    }

    @media (max-width: 359px) {
        transform: translateX(15px);

        &:active {
            transform: translateX(15px) scale(0.98);
        }
    }
`;

const SectionTitle = styled.h2`
    margin: 14px 2px 9px;

    font-size: 0.94rem;
    font-weight: 950;

    color: ${({ theme }) => theme.colors.text_primary};

    letter-spacing: 0.01em;
`;

const SectionHint = styled.p`
    width: 100%;

    margin: 0 2px 10px;

    font-size: 0.84rem;
    line-height: 1.5;

    color: ${({ theme }) => theme.colors.text_secondary};

    text-align: left;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);

    gap: 10px;

    width: 100%;
    min-width: 0;

    @media (min-width: 900px) {
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
        gap: 14px;
        align-items: start;
    }
`;

const Card = styled.div`
    width: 100%;
    min-width: 0;

    border-radius: 16px;

    padding: 12px;

    background: rgba(0, 0, 0, 0.02);

    border: 1px solid rgba(0, 0, 0, 0.06);

    display: flex;
    flex-direction: column;
    gap: 10px;

    @media (min-width: 768px) {
        border-radius: 18px;
        padding: 16px;
    }
`;

const Row = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);

    gap: 10px;

    width: 100%;
    min-width: 0;

    @media (min-width: 620px) {
        grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr);
    }
`;

const Full = styled.div`
    grid-column: 1 / -1;
    min-width: 0;
`;

/**------------------------------
    Sticky actions
---------------------------------*/
const StickyBar = styled.div`
    position: sticky;
    bottom: 0;
    z-index: 25;

    width: 100%;

    margin-top: 4px;

    padding:
        10px
        0
        calc(12px + env(safe-area-inset-bottom, 0px));

    background: linear-gradient(
        to bottom,
        rgba(244, 251, 252, 0),
        ${({ theme }) => theme.colors.page_bg || "#f4fbfc"} 26%
    );

    @media (min-width: 900px) {
        position: static;

        padding: 4px 0 0;

        background: transparent;
    }
`;

const ActionsRow = styled.div`
    display: grid;
    grid-template-columns: 1fr;

    gap: 8px;

    @media (min-width: 420px) {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }
`;

const PrimarySaveButton = styled(ThemeButton)<{
    $pulse?: boolean;
}>`
    width: 100%;
    min-height: 46px;

    ${({ $pulse }) =>
        $pulse &&
        css`
            animation: ${pulse} 1.6s ease-out infinite;
        `}
`;

const SecondaryButton = styled(ThemeButton)`
    width: 100%;
    min-height: 46px;

    opacity: 0.92;
`;

const PasswordButton = styled(ThemeButton)`
    width: 100%;
    min-height: 44px;

    margin-top: 2px;
`;

const StatusText = styled.p<{
    $tone?: "ok" | "warn";
}>`
    margin: 9px 0 0;

    padding: 10px 12px;

    border-radius: 14px;

    font-weight: 750;
    font-size: 0.86rem;
    line-height: 1.45;

    overflow-wrap: anywhere;

    color: ${({ theme, $tone }) =>
        $tone === "ok"
            ? "#0a7a3a"
            : theme.colors.text_primary};

    background: ${({ $tone }) =>
        $tone === "ok"
            ? "rgba(10,122,58,0.06)"
            : "rgba(0,0,0,0.03)"};

    border: 1px solid
        ${({ $tone }) =>
            $tone === "ok"
                ? "rgba(10,122,58,0.14)"
                : "rgba(0,0,0,0.06)"};
`;

const LoadingText = styled.div`
    min-height: 100dvh;

    display: grid;
    place-items: center;

    padding: 24px 16px;

    text-align: center;

    color: ${({ theme }) => theme.colors.primary};

    font-weight: 750;
`;

/**------------------
    Cropper
---------------------*/
const Overlay = styled.div`
    position: fixed;
    inset: 0;

    z-index: 4500;

    display: flex;
    justify-content: center;
    align-items: flex-end;

    overflow-y: auto;

    padding:
        16px
        10px
        max(10px, env(safe-area-inset-bottom, 0px));

    background: rgba(9, 20, 45, 0.46);

    @media (min-width: 600px) {
        align-items: center;

        padding: 18px;
    }
`;

const Modal = styled.div`
    width: 100%;
    max-width: 420px;

    max-height: calc(100dvh - 24px);

    overflow-y: auto;

    background: ${({ theme }) => theme.colors.card_bg};

    border-radius: 22px 22px 16px 16px;

    padding: 14px;

    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.35);

    border: 1px solid rgba(0, 0, 0, 0.08);

    animation: ${sheetIn} 0.28s ease-out;

    @media (min-width: 600px) {
        border-radius: 22px;
        padding: 16px;
    }
`;

const ModalTitle = styled.h2`
    margin: 2px 0 14px;

    text-align: center;

    font-size: 1.02rem;
    font-weight: 950;

    color: ${({ theme }) => theme.colors.text_primary};
`;

const CropArea = styled.div`
    width: min(220px, 68vw);
    aspect-ratio: 1 / 1;

    border-radius: 50%;

    margin: 0 auto 14px;

    overflow: hidden;

    background:
        radial-gradient(
            circle at 30% 30%,
            rgba(0, 0, 0, 0.04),
            rgba(0, 0, 0, 0.1)
        );

    border: 1px solid rgba(0, 0, 0, 0.08);

    display: grid;
    place-items: center;
`;

const CropPreview = styled.img<{
    $zoom: number;
}>`
    width: 100%;
    height: 100%;

    object-fit: cover;

    transform: scale(
        ${({ $zoom }) => $zoom}
    );

    transform-origin: center;

    will-change: transform;

    backface-visibility: hidden;
`;

const SliderRow = styled.div`
    margin-bottom: 12px;

    label {
        display: block;

        margin-bottom: 7px;

        font-size: 0.88rem;
        font-weight: 750;

        color: ${({ theme }) => theme.colors.text_primary};
    }

    input[type="range"] {
        width: 100%;
        min-height: 30px;
    }
`;

const ModalActions = styled.div`
    display: grid;
    grid-template-columns: 1fr;

    gap: 8px;

    @media (min-width: 380px) {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }
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

function parseCommaList(
    raw: string
): string[] {
    return raw
        .split(",")
        .map((value) =>
            value.trim()
        )
        .filter(Boolean);
}

function toNumberOrUndef(
    raw: string
): number | undefined {
    if (raw === "") {
        return undefined;
    }

    const value =
        Number(raw);

    return Number.isFinite(value)
        ? value
        : undefined;
}

function eqStringArray(
    a: string[],
    b: string[]
): boolean {
    if (
        a.length !== b.length
    ) {
        return false;
    }

    for (
        let index = 0;
        index < a.length;
        index += 1
    ) {
        if (
            a[index] !== b[index]
        ) {
            return false;
        }
    }

    return true;
}

function profilesEqual(
    a: ExtendedUser,
    b: ExtendedUser
): boolean {
    return (
        a.email === b.email &&
        (a.displayName ?? "") ===
            (b.displayName ?? "") &&
        (a.age ?? null) ===
            (b.age ?? null) &&
        (a.years_since_onset ??
            null) ===
            (b.years_since_onset ??
                null) &&
        (a.avatarUrl ?? "") ===
            (b.avatarUrl ?? "")
    );
}

/**---------
    Page
------------*/
export default function ProfilePage() {
    const router = useRouter();

    const {
        isAuthenticated,
        logout,
        refreshUser,
        user,
    } = useAuth();

    const {
        worked: copingWorked,
        notWorked: copingNotWorked,
        setFromBackend,
    } = useCopingStrategies();

    const [
        profile,
        setProfile,
    ] =
        useState<ExtendedUser | null>(
            null
        );

    const [
        initialProfile,
        setInitialProfile,
    ] =
        useState<ExtendedUser | null>(
            null
        );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        avatarPreview,
        setAvatarPreview,
    ] = useState<string>(
        () =>
            user?.avatarUrl ||
            toImgSrc(UserIcon)
    );

    const [
        avatarSource,
        setAvatarSource,
    ] =
        useState<HTMLImageElement | null>(
            null
        );

    const [
        avatarObjectUrl,
        setAvatarObjectUrl,
    ] =
        useState<string | null>(
            null
        );

    const [
        zoom,
        setZoom,
    ] = useState(1);

    const [
        showCropper,
        setShowCropper,
    ] = useState(false);

    const [
        oldPassword,
        setOldPassword,
    ] = useState("");

    const [
        newPassword,
        setNewPassword,
    ] = useState("");

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState("");

    const [
        passwordMsg,
        setPasswordMsg,
    ] =
        useState<string | null>(
            null
        );

    const [
        passwordTone,
        setPasswordTone,
    ] =
        useState<
            "ok" | "warn"
        >("warn");

    const setFromBackendRef =
        useRef(setFromBackend);

    useEffect(() => {
        setFromBackendRef.current =
            setFromBackend;
    }, [setFromBackend]);

    useEffect(() => {
        return () => {
            if (
                avatarObjectUrl
            ) {
                URL.revokeObjectURL(
                    avatarObjectUrl
                );
            }
        };
    }, [avatarObjectUrl]);

    useEffect(() => {
        if (
            !isAuthenticated
        ) {
            router.replace(
                "/login?next=/profile"
            );

            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);

            try {
                const response =
                    await userApi.getProfile();

                if (
                    cancelled ||
                    !response.ok
                ) {
                    return;
                }

                const u =
                    response.user as ExtendedUser;

                setProfile(u);
                setInitialProfile(u);

                setAvatarPreview(
                    u.avatarUrl ||
                        user?.avatarUrl ||
                        toImgSrc(
                            UserIcon
                        )
                );

                setFromBackendRef.current(
                    u.coping_worked,
                    u.coping_not_worked
                );
            } finally {
                if (!cancelled) {
                    setLoading(
                        false
                    );
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [
        isAuthenticated,
        router,
        user?.avatarUrl,
    ]);

    const hasChanges =
        useMemo(() => {
            if (
                !profile ||
                !initialProfile
            ) {
                return false;
            }

            if (
                !profilesEqual(
                    profile,
                    initialProfile
                )
            ) {
                return true;
            }

            const initialWorked =
                initialProfile
                    .coping_worked ??
                [];

            const initialNotWorked =
                initialProfile
                    .coping_not_worked ??
                [];

            if (
                !eqStringArray(
                    copingWorked,
                    initialWorked
                )
            ) {
                return true;
            }

            if (
                !eqStringArray(
                    copingNotWorked,
                    initialNotWorked
                )
            ) {
                return true;
            }

            return false;
        }, [
            profile,
            initialProfile,
            copingWorked,
            copingNotWorked,
        ]);

    const handleProfileChange =
        useCallback(
            (
                e: React.ChangeEvent<HTMLInputElement>
            ) => {
                setProfile(
                    (prev) => {
                        if (!prev) {
                            return prev;
                        }

                        const {
                            name,
                            value,
                        } =
                            e.target;

                        if (
                            name ===
                            "age"
                        ) {
                            return {
                                ...prev,
                                age: toNumberOrUndef(
                                    value
                                ),
                            };
                        }

                        if (
                            name ===
                            "years_since_onset"
                        ) {
                            return {
                                ...prev,
                                years_since_onset:
                                    toNumberOrUndef(
                                        value
                                    ),
                            };
                        }

                        return {
                            ...prev,
                            [name]:
                                value,
                        };
                    }
                );
            },
            []
        );

    const handleCopingInputChange =
        useCallback(
            (
                e: React.ChangeEvent<HTMLInputElement>
            ) => {
                const {
                    name,
                    value,
                } = e.target;

                const parsed =
                    parseCommaList(
                        value
                    );

                if (
                    name ===
                    "coping_worked"
                ) {
                    setFromBackendRef.current(
                        parsed,
                        copingNotWorked
                    );
                }

                if (
                    name ===
                    "coping_not_worked"
                ) {
                    setFromBackendRef.current(
                        copingWorked,
                        parsed
                    );
                }
            },
            [
                copingNotWorked,
                copingWorked,
            ]
        );

    const closeCropper =
        useCallback(() => {
            setShowCropper(
                false
            );

            setAvatarSource(
                null
            );

            setAvatarObjectUrl(
                (prev) => {
                    if (prev) {
                        URL.revokeObjectURL(
                            prev
                        );
                    }

                    return null;
                }
            );
        }, []);

    const handleAvatarUpload =
        useCallback(
            (
                e: React.ChangeEvent<HTMLInputElement>
            ) => {
                const file =
                    e.target.files?.[0];

                if (!file) {
                    return;
                }

                e.target.value =
                    "";

                setAvatarObjectUrl(
                    (prev) => {
                        if (prev) {
                            URL.revokeObjectURL(
                                prev
                            );
                        }

                        return null;
                    }
                );

                const url =
                    URL.createObjectURL(
                        file
                    );

                setAvatarObjectUrl(
                    url
                );

                const img =
                    new globalThis.Image();

                img.onload = () => {
                    setAvatarSource(
                        img
                    );

                    setZoom(1);

                    setShowCropper(
                        true
                    );
                };

                img.onerror = () => {
                    URL.revokeObjectURL(
                        url
                    );

                    setAvatarObjectUrl(
                        null
                    );
                };

                img.src = url;
            },
            []
        );

    const applyAvatarCrop =
        useCallback(() => {
            if (!avatarSource) {
                return;
            }

            const canvas =
                document.createElement(
                    "canvas"
                );

            const size = 220;

            canvas.width =
                size;

            canvas.height =
                size;

            const ctx =
                canvas.getContext(
                    "2d"
                );

            if (!ctx) {
                return;
            }

            const imgW =
                avatarSource.width;

            const imgH =
                avatarSource.height;

            const baseScale =
                size /
                Math.min(
                    imgW,
                    imgH
                );

            const effectiveZoom =
                baseScale *
                zoom;

            const w =
                imgW *
                effectiveZoom;

            const h =
                imgH *
                effectiveZoom;

            const x =
                (size - w) /
                2;

            const y =
                (size - h) /
                2;

            ctx.beginPath();

            ctx.arc(
                size / 2,
                size / 2,
                size / 2,
                0,
                Math.PI * 2
            );

            ctx.clip();

            ctx.drawImage(
                avatarSource,
                x,
                y,
                w,
                h
            );

            const url =
                canvas.toDataURL(
                    "image/jpeg",
                    0.88
                );

            setAvatarPreview(
                url
            );

            setProfile(
                (prev) =>
                    prev
                        ?  {
                                ...prev,
                                avatarUrl:
                                    url,
                            }
                        : prev
            );

            closeCropper();
        }, [
            avatarSource,
            zoom,
            closeCropper,
        ]);

    const handleSave =
        useCallback(async () => {
            if (!profile) {
                return;
            }

            setSaving(true);

            try {
                const payload = {
                    ...profile,

                    coping_worked:
                        copingWorked,

                    coping_not_worked:
                        copingNotWorked,
                };

                const response =
                    await userApi.updateProfile(
                        payload
                    );

                if (
                    !response.ok
                ) {
                    throw new Error(
                        response.message ||
                            response.error ||
                            "Unable to save profile."
                    );
                }

                const updated =
                    response.user as ExtendedUser;

                setProfile(
                    updated
                );

                setInitialProfile(
                    updated
                );

                setAvatarPreview(
                    updated.avatarUrl ||
                        toImgSrc(
                            UserIcon
                        )
                );

                await refreshUser();
            } finally {
                setSaving(false);
            }
        }, [
            profile,
            copingWorked,
            copingNotWorked,
            refreshUser,
        ]);

    const handlePasswordChange =
        useCallback(async () => {
            setPasswordMsg(
                null
            );

            setPasswordTone(
                "warn"
            );

            if (
                newPassword !==
                confirmPassword
            ) {
                setPasswordMsg(
                    "Passwords do not match."
                );

                return;
            }

            if (
                !oldPassword ||
                !newPassword
            ) {
                setPasswordMsg(
                    "Please fill in your old and new password."
                );

                return;
            }

            try {
                await authApi.changePassword(
                    {
                        oldPassword,
                        newPassword,
                    }
                );

                setPasswordTone(
                    "ok"
                );

                setPasswordMsg(
                    "Password updated!"
                );

                setOldPassword(
                    ""
                );

                setNewPassword(
                    ""
                );

                setConfirmPassword(
                    ""
                );
            } catch {
                setPasswordTone(
                    "warn"
                );

                setPasswordMsg(
                    "Incorrect old password."
                );
            }
        }, [
            oldPassword,
            newPassword,
            confirmPassword,
        ]);

    const handleLogout =
        useCallback(() => {
            logout();

            router.replace(
                "/login"
            );
        }, [
            logout,
            router,
        ]);

    if (
        !isAuthenticated
    ) {
        return (
            <LoadingText>
                Please login…
            </LoadingText>
        );
    }

    if (loading) {
        return (
            <LoadingText>
                Loading your
                profile…
            </LoadingText>
        );
    }

    const avatarSrc =
        avatarPreview ||
        profile?.avatarUrl ||
        user?.avatarUrl ||
        toImgSrc(UserIcon);

    return (
        <>
            <Shell>
                <Wrap>
                    <TopBar>
                        <BackButton
                            type="button"
                            onClick={() =>
                                router.push(
                                    "/home"
                                )
                            }
                            aria-label="Go back"
                            title="Go back"
                        >
                            <Image
                                src={
                                    BackIcon
                                }
                                alt=""
                                width={
                                    24
                                }
                                height={
                                    24
                                }
                                aria-hidden="true"
                            />
                        </BackButton>

                        <TopTitle>
                            Your profile
                        </TopTitle>

                        <TopSpacer
                            aria-hidden="true"
                        />
                    </TopBar>

                    <Sheet>
                        <Hero>
                            <AvatarRow>
                                <AvatarOuter>
                                    <AvatarImg
                                        src={
                                            avatarSrc
                                        }
                                        alt="Profile avatar"
                                        width={
                                            114
                                        }
                                        height={
                                            114
                                        }
                                        unoptimized
                                    />
                                </AvatarOuter>

                                <ChangeAvatarButton>
                                    Change

                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        aria-label="Choose profile picture"
                                        onChange={
                                            handleAvatarUpload
                                        }
                                    />
                                </ChangeAvatarButton>
                            </AvatarRow>

                            <SectionHint>
                                Update your
                                name, coping
                                strategies, or
                                avatar. Your
                                email can’t be
                                changed here.
                            </SectionHint>
                        </Hero>
                    </Sheet>

                    <Grid>
                        <Sheet>
                            <SectionTitle>
                                Account
                            </SectionTitle>

                            <Row>
                                <Full>
                                    <FormInput
                                        label="Email"
                                        name="email"
                                        value={
                                            profile?.email ||
                                            ""
                                        }
                                        disabled
                                        onChange={() => {
                                            // Required by FormInput typing.
                                        }}
                                    />
                                </Full>

                                <Full>
                                    <FormInput
                                        label="Display name"
                                        name="displayName"
                                        value={
                                            profile?.displayName ||
                                            ""
                                        }
                                        onChange={
                                            handleProfileChange
                                        }
                                        autoComplete="nickname"
                                    />
                                </Full>

                                <FormInput
                                    label="Age"
                                    name="age"
                                    type="number"
                                    value={
                                        profile?.age ??
                                        ""
                                    }
                                    onChange={
                                        handleProfileChange
                                    }
                                    inputMode="numeric"
                                />

                                <FormInput
                                    label="Years since onset"
                                    name="years_since_onset"
                                    type="number"
                                    value={
                                        profile?.years_since_onset ??
                                        ""
                                    }
                                    onChange={
                                        handleProfileChange
                                    }
                                    inputMode="numeric"
                                />
                            </Row>

                            <SectionTitle>
                                Coping
                                strategies
                            </SectionTitle>

                            <Card>
                                <FormInput
                                    label="Strategies that worked"
                                    name="coping_worked"
                                    placeholder="e.g. fidget toy, deep breathing, wearing gloves"
                                    value={copingWorked.join(
                                        ", "
                                    )}
                                    onChange={
                                        handleCopingInputChange
                                    }
                                />

                                <FormInput
                                    label="Strategies that didn’t help"
                                    name="coping_not_worked"
                                    placeholder="e.g. journaling, stress ball"
                                    value={copingNotWorked.join(
                                        ", "
                                    )}
                                    onChange={
                                        handleCopingInputChange
                                    }
                                />
                            </Card>
                        </Sheet>

                        <Sheet>
                            <SectionTitle>
                                Password
                            </SectionTitle>

                            <SectionHint>
                                Choose a strong
                                password you
                                don’t reuse
                                elsewhere.
                            </SectionHint>

                            <Card>
                                <FormInput
                                    label="Old password"
                                    name="old_password"
                                    type="password"
                                    value={
                                        oldPassword
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setOldPassword(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    autoComplete="current-password"
                                />

                                <FormInput
                                    label="New password"
                                    name="new_password"
                                    type="password"
                                    value={
                                        newPassword
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setNewPassword(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    autoComplete="new-password"
                                />

                                <FormInput
                                    label="Confirm new password"
                                    name="confirm_password"
                                    type="password"
                                    value={
                                        confirmPassword
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setConfirmPassword(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    autoComplete="new-password"
                                />

                                <PasswordButton
                                    type="button"
                                    onClick={
                                        handlePasswordChange
                                    }
                                >
                                    Update
                                    password
                                </PasswordButton>

                                {passwordMsg && (
                                    <StatusText
                                        $tone={
                                            passwordTone
                                        }
                                        role="status"
                                    >
                                        {
                                            passwordMsg
                                        }
                                    </StatusText>
                                )}
                            </Card>
                        </Sheet>
                    </Grid>

                    <StickyBar>
                        <ActionsRow>
                            <PrimarySaveButton
                                type="button"
                                onClick={
                                    handleSave
                                }
                                disabled={
                                    saving ||
                                    !hasChanges
                                }
                                $pulse={
                                    hasChanges &&
                                    !saving
                                }
                            >
                                {saving
                                    ? "Saving…"
                                    : hasChanges
                                        ? "Save changes"
                                        : "Saved"}
                            </PrimarySaveButton>

                            <SecondaryButton
                                type="button"
                                onClick={
                                    handleLogout
                                }
                            >
                                Logout
                            </SecondaryButton>
                        </ActionsRow>

                        {hasChanges && (
                            <StatusText
                                $tone="warn"
                                role="status"
                            >
                                You have
                                unsaved
                                changes. Tap{" "}
                                <strong>
                                    Save
                                    changes
                                </strong>{" "}
                                to apply
                                them.
                            </StatusText>
                        )}
                    </StickyBar>
                </Wrap>
            </Shell>

            {showCropper &&
                avatarSource && (
                    <Overlay
                        role="dialog"
                        aria-modal="true"
                        aria-label="Adjust your avatar"
                    >
                        <Modal>
                            <ModalTitle>
                                Adjust your
                                avatar
                            </ModalTitle>

                            <CropArea>
                                <CropPreview
                                    src={
                                        avatarObjectUrl ??
                                        avatarSource.src
                                    }
                                    alt="Avatar crop preview"
                                    $zoom={
                                        zoom
                                    }
                                />
                            </CropArea>

                            <SliderRow>
                                <label htmlFor="avatar-zoom">
                                    Zoom
                                </label>

                                <input
                                    id="avatar-zoom"
                                    type="range"
                                    min={
                                        1
                                    }
                                    max={
                                        2.4
                                    }
                                    step={
                                        0.02
                                    }
                                    value={
                                        zoom
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setZoom(
                                            Number(
                                                e
                                                    .target
                                                    .value
                                            )
                                        )
                                    }
                                />
                            </SliderRow>

                            <ModalActions>
                                <SecondaryButton
                                    type="button"
                                    onClick={
                                        closeCropper
                                    }
                                >
                                    Cancel
                                </SecondaryButton>

                                <ThemeButton
                                    type="button"
                                    onClick={
                                        applyAvatarCrop
                                    }
                                >
                                    Apply
                                </ThemeButton>
                            </ModalActions>
                        </Modal>
                    </Overlay>
                )}
        </>
    );
}