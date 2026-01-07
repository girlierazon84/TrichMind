// client/src/components/BottomNav.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { usePathname } from "next/navigation";
import styled, { css } from "styled-components";

import {
    HomeIcon,
    HealthIcon,
    JournalIcon,
    TriggersInsightsIcon,
    TrichGameIcon,
    TrichBotIcon,
} from "@/assets/icons";


/**------------------------------------
    Bottom Navigation Bar Component
---------------------------------------*/
type BottomNavBarProps = { $visible: boolean };

const BottomNavWrapper = styled.div<BottomNavBarProps>`
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;

    padding: 0.35rem 0.75rem calc(0.35rem + env(safe-area-inset-bottom, 0px));
    display: flex;
    justify-content: center;

    z-index: 2000;

    pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
    transition: opacity 0.35s ease, transform 0.35s ease;
    opacity: ${({ $visible }) => ($visible ? 1 : 0)};
    transform: ${({ $visible }) => ($visible ? "translateY(0)" : "translateY(100%)")};

    @media (min-width: 1025px) {
        display: none;
    }
`;

const BottomNavBar = styled.nav`
    width: 100%;
    max-width: 520px;
    height: 66px;

    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 22px;
    border: 1px solid ${({ theme }) => theme.colors.primary};

    box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.16);
    backdrop-filter: blur(18px);

    display: grid;
    grid-template-columns: repeat(6, 1fr);
    align-items: center;
`;

const NavItem = styled(Link)<{ $active?: boolean }>`
    text-decoration: none;
    color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.text_secondary)};

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    gap: 3px;
    padding: 8px 0;

    font-size: 0.7rem;
    font-weight: 750;

    transition: color 0.2s ease, transform 0.2s ease;
    position: relative;

    &:hover {
        color: ${({ theme }) => theme.colors.primary};
    }

    ${({ $active, theme }) =>
        $active &&
        css`
            transform: translateY(-2px);

            &::after {
                content: "";
                position: absolute;
                bottom: 6px;
                left: 50%;
                transform: translateX(-50%);
                width: 26px;
                height: 3px;
                border-radius: 999px;
                background: ${theme.colors.primary};
            }
        `}
`;

type NavConfig = {
    href: string;
    icon: StaticImageData;
    label: string;
    matchPrefix?: boolean;
};

function isActivePath(pathname: string, href: string, matchPrefix?: boolean) {
    if (!matchPrefix) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
}

export const BottomNav = () => {
    const pathname = usePathname() ?? "/home";
    const [visible, setVisible] = useState(true);

    const navItems: ReadonlyArray<NavConfig> = useMemo(
        () => [
            { href: "/home", icon: HomeIcon, label: "Home" },
            { href: "/journal", icon: JournalIcon, label: "Journal", matchPrefix: true },
            { href: "/health", icon: HealthIcon, label: "Health", matchPrefix: true },
            { href: "/triggersinsights", icon: TriggersInsightsIcon, label: "Insights", matchPrefix: true },
            { href: "/trichgame", icon: TrichGameIcon, label: "TrichGame", matchPrefix: true },
            { href: "/trichbot", icon: TrichBotIcon, label: "TrichBot", matchPrefix: true },
        ],
        []
    );

    useEffect(() => {
        if (typeof window === "undefined") return;

        const threshold = 150;
        let initialHeight = window.innerHeight;

        const handleResize = () => {
            if (Math.abs(window.innerHeight - initialHeight) > 300) {
                initialHeight = window.innerHeight;
            }
            const heightDiff = initialHeight - window.innerHeight;
            setVisible(heightDiff < threshold);
        };

        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) setVisible(false);
        };

        const handleFocusOut = () => setVisible(true);

        window.addEventListener("resize", handleResize);
        window.addEventListener("focusin", handleFocusIn);
        window.addEventListener("focusout", handleFocusOut);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("focusin", handleFocusIn);
            window.removeEventListener("focusout", handleFocusOut);
        };
    }, []);

    return (
        <BottomNavWrapper $visible={visible} aria-label="Bottom navigation">
            <BottomNavBar>
                {navItems.map((item) => {
                    const active = isActivePath(pathname, item.href, item.matchPrefix);

                    return (
                        <NavItem
                            key={item.href}
                            href={item.href}
                            $active={active}
                            aria-current={active ? "page" : undefined}
                            aria-label={item.label}
                            prefetch
                        >
                            <Image
                                src={item.icon}
                                alt={item.label}
                                width={22}
                                height={22}
                                draggable={false}
                                style={{
                                    filter: active ? "grayscale(0)" : "grayscale(0.45)",
                                    transform: active ? "scale(1.07)" : "scale(1)",
                                    transition: "filter 0.2s ease, transform 0.2s ease",
                                }}
                            />
                            <span>{item.label}</span>
                        </NavItem>
                    );
                })}
            </BottomNavBar>
        </BottomNavWrapper>
    );
};

export default BottomNav;
