// client/src/components/BottomNav.tsx

import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";

// Icons
import {
    HomeIcon,
    HealthIcon,
    JournalIcon,
    TriggersInsightsIcon,
    TrichGameIcon,
    TrichBotIcon,
} from "../assets/icons";

/**------------------------------------
    Bottom Navigation Bar Component
---------------------------------------*/
type BottomNavBarProps = { visible: boolean };

/* Outer wrapper to keep things centered + safe-area friendly */
const BottomNavWrapper = styled.div<BottomNavBarProps>`
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 0.35rem 0.75rem calc(0.35rem + env(safe-area-inset-bottom, 0px));
    display: flex;
    justify-content: center;
    z-index: 1000;
    pointer-events: ${({ visible }) => (visible ? "auto" : "none")};

    transition: opacity 0.35s ease, transform 0.35s ease;
    opacity: ${({ visible }) => (visible ? 1 : 0)};
    transform: ${({ visible }) => (visible ? "translateY(0)" : "translateY(100%)")};

    /* Hide bottom nav on desktop, show only on mobile/tablet */
    @media (min-width: 1025px) {
        display: none;
    }
`;

// The actual nav bar
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

    /* Slight glass effect on supported devices */
    backdrop-filter: blur(18px);
`;

const NavItem = styled(NavLink)`
    flex: 1;
    text-decoration: none;
    color: ${({ theme }) => theme.colors.text_secondary};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;

    font-size: 0.72rem;
    font-weight: 500;
    transition: color 0.2s ease, transform 0.2s ease;

    position: relative;

    /* Base label styling so we can attach the underline to it */
    span {
        position: relative;
        padding-bottom: 2px;
    }

    /* Hover: change color and icon tone */
    &:hover {
        color: ${({ theme }) => theme.colors.primary};
    }

    &:hover img {
        filter: grayscale(0);
    }

    /* Active route: colored + slightly lifted + underline under text */
    &.active {
        color: ${({ theme }) => theme.colors.primary};
        transform: translateY(-2px);
    }

    &.active span::after {
        content: "";
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: -2px;
        width: 70%;
        height: 2px;
        border-radius: 999px;
        background: ${({ theme }) => theme.colors.primary};
    }

    img {
        width: 24px;
        height: 24px;
        margin-bottom: 2px;
        filter: grayscale(0.4);
        transition: filter 0.2s ease, transform 0.2s ease;
        user-select: none;
    }

    &.active img {
        filter: grayscale(0);
        transform: scale(1.06);
    }

    @media (max-width: 480px) {
        font-size: 0.68rem;
        img {
            width: 20px;
            height: 20px;
        }
    }
`;

// Navigation Configuration
type NavConfig = { to: string; icon: string; label: string };

// Immutable array of navigation items
const navItems: ReadonlyArray<NavConfig> = [
    { to: "/", icon: HomeIcon, label: "Home" },
    { to: "/journal", icon: JournalIcon, label: "Journal" },
    { to: "/health", icon: HealthIcon, label: "Health" },
    { to: "/triggersinsights", icon: TriggersInsightsIcon, label: "Insights" },
    { to: "/trichgame", icon: TrichGameIcon, label: "TrichGame" },
    { to: "/trichbot", icon: TrichBotIcon, label: "TrichBot" },
] as const;

// BottomNav Component
export const BottomNav = () => {
    const [visible, setVisible] = useState<boolean>(true);

    // Effect to handle keyboard visibility on mobile devices
    useEffect(() => {
        const threshold = 150; // px difference = keyboard up
        let initialHeight = window.innerHeight;

        const handleResize = () => {
            // If orientation changes, refresh baseline
            if (Math.abs(window.innerHeight - initialHeight) > 300) {
                initialHeight = window.innerHeight;
            }
            const heightDiff = initialHeight - window.innerHeight;
            setVisible(heightDiff < threshold);
        };

        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
                setVisible(false);
            }
        };

        const handleFocusOut = () => {
            setVisible(true);
        };

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
        <BottomNavWrapper visible={visible} aria-label="Bottom navigation">
            <BottomNavBar>
                {navItems.map((item) => (
                    <NavItem
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => (isActive ? "active" : "")}
                        aria-label={item.label}
                    >
                        <img src={item.icon} alt={item.label} draggable={false} />
                        <span>{item.label}</span>
                    </NavItem>
                ))}
            </BottomNavBar>
        </BottomNavWrapper>
    );
};

export default BottomNav;
