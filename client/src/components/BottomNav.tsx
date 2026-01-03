// client/src/components/BottomNav.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { usePathname } from "next/navigation";
import styled, { css } from "styled-components";

// Icons (should be StaticImageData exports, e.g. `export { default as HomeIcon } from "./home.png";`)
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

/**--------------------------------------------------------
    Styled component for the bottom navigation wrapper.
    It handles visibility and positioning.
-----------------------------------------------------------*/
// Bottom navigation wrapper styled component
const BottomNavWrapper = styled.div<BottomNavBarProps>`
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 0.35rem 0.75rem calc(0.35rem + env(safe-area-inset-bottom, 0px));
    display: flex;
    justify-content: center;
    z-index: 1000;

    pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
    transition: opacity 0.35s ease, transform 0.35s ease;
    opacity: ${({ $visible }) => ($visible ? 1 : 0)};
    transform: ${({ $visible }) => ($visible ? "translateY(0)" : "translateY(100%)")};

    /* Hide bottom nav on desktop */
    @media (min-width: 1025px) {
        display: none;
    }
`;

// Bottom navigation bar styled component
const BottomNavBar = styled.nav`
    width: 100%;
    max-width: 520px;
    height: 64px;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 20px 20px 0 0;
    border: 1px solid ${({ theme }) => theme.colors.fourthly};
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.16);

    display: flex;
    justify-content: space-around;
    align-items: center;

    backdrop-filter: blur(18px);
`;

// Navigation item styled component
const NavItem = styled(Link) <{ $active?: boolean }>`
    flex: 1;
    text-decoration: none;
    color: ${({ theme, $active }) =>
                $active ? theme.colors.primary : theme.colors.text_secondary};

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;

    font-size: 0.72rem;
    font-weight: 500;
    transition: color 0.2s ease, transform 0.2s ease;
    position: relative;

    span {
        position: relative;
        padding-bottom: 2px;
    }

    &:hover {
        color: ${({ theme }) => theme.colors.primary};
    }

    ${({ $active, theme }) =>
        $active &&
        css`
            transform: translateY(-2px);

            span::after {
                content: "";
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                bottom: -2px;
                width: 70%;
                height: 2px;
                border-radius: 999px;
                background: ${theme.colors.primary};
            }
        `
    }

    @media (max-width: 480px) {
        font-size: 0.68rem;
    }
`;

// Navigation configuration type
type NavConfig = {
    href: string;
    icon: StaticImageData;
    label: string;
    // optional: highlight parent route prefixes like /journal/entry/123
    matchPrefix?: boolean;
};

// Function to determine if a nav item is active based on the current pathname and href
function isActivePath(pathname: string, href: string, matchPrefix?: boolean) {
    // Exact match for root path /
    if (href === "/") return pathname === "/";
    if (!matchPrefix) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
}

// Bottom navigation component
export const BottomNav = () => {
    // Get the current pathname
    const pathname = usePathname() ?? "/";
    const [visible, setVisible] = useState(true);

    // Define navigation items using useMemo for performance optimization
    const navItems: ReadonlyArray<NavConfig> = useMemo(
        () => [
            { href: "/", icon: HomeIcon, label: "Home" },
            { href: "/journal", icon: JournalIcon, label: "Journal", matchPrefix: true },
            { href: "/health", icon: HealthIcon, label: "Health", matchPrefix: true },
            {
                href: "/triggersinsights",
                icon: TriggersInsightsIcon,
                label: "Insights",
                matchPrefix: true,
            },
            { href: "/trichgame", icon: TrichGameIcon, label: "TrichGame", matchPrefix: true },
            { href: "/trichbot", icon: TrichBotIcon, label: "TrichBot", matchPrefix: true },
        ],
        []
    );

    // Effect to handle visibility based on keyboard presence and window resize
    useEffect(() => {
        // Ensure window is defined (client-side) before adding event listeners
        if (typeof window === "undefined") return;

        // Threshold in pixels to determine keyboard presence on mobile devices
        const threshold = 150;
        let initialHeight = window.innerHeight;

        // Handler for window resize events to detect keyboard presence
        const handleResize = () => {
            // orientation change / big resize baseline refresh
            if (Math.abs(window.innerHeight - initialHeight) > 300) {
                initialHeight = window.innerHeight;
            }
            // Determine if the keyboard is likely open based on height difference
            const heightDiff = initialHeight - window.innerHeight;
            setVisible(heightDiff < threshold);
        };

        // Handlers for focusin and focusout events to manage visibility
        const handleFocusIn = (e: FocusEvent) => {
            // Check if the focused element is an input field to hide the nav
            const target = e.target as HTMLElement | null;
            if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
                setVisible(false);
            }
        };

        // Restore visibility when focus is lost from input fields
        const handleFocusOut = () => setVisible(true);

        // Add event listeners for resize and focus events
        window.addEventListener("resize", handleResize);
        window.addEventListener("focusin", handleFocusIn);
        window.addEventListener("focusout", handleFocusOut);

        return () => {
            // Cleanup event listeners on component unmount or re-render
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
                                width={24}
                                height={24}
                                draggable={false}
                                style={{
                                    filter: active ? "grayscale(0)" : "grayscale(0.4)",
                                    transform: active ? "scale(1.06)" : "scale(1)",
                                    transition: "filter 0.2s ease, transform 0.2s ease",
                                    marginBottom: 2,
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
