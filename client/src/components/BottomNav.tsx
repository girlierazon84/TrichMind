// client/src/components/BottomNav.tsx

import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";

// Icons
import homeIcon from "../assets/icons/home.png";
import healthIcon from "../assets/icons/health.png";
import journalIcon from "../assets/icons/journal.png";
import triggersIcon from "../assets/icons/triggers.png";
import trichGameIcon from "../assets/icons/trichgame.png";
import trichBotIcon from "../assets/icons/trichbot.png";


// -----------------------------------------------------
//    Bottom Navigation Bar Component
// -----------------------------------------------------
type BottomNavBarProps = { visible: boolean };

// Styled Components
const BottomNavBar = styled.nav<BottomNavBarProps>`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 70px;
    background: ${({ theme }) => theme.colors.card_bg};
    border-top: 1px solid ${({ theme }) => theme.colors.fourthly};
    display: flex;
    justify-content: space-around;
    align-items: center;
    z-index: 1000;
    box-shadow: 0 -3px 10px rgba(0, 0, 0, 0.1);

    transition: opacity 0.35s ease, transform 0.35s ease;
    opacity: ${({ visible }) => (visible ? 1 : 0)};
    transform: ${({ visible }) => (visible ? "translateY(0)" : "translateY(100%)")};
    pointer-events: ${({ visible }) => (visible ? "auto" : "none")};

    @media (min-width: 1025px) {
        nav {
            display: none;
        }
    }
`;

const NavItem = styled(NavLink)`
    text-decoration: none;
    color: ${({ theme }) => theme.colors.text_secondary};
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 500;
    transition: color 0.2s ease;

    &.active {
        color: ${({ theme }) => theme.colors.primary};
    }

    img {
        width: 28px;
        height: 28px;
        margin-bottom: 4px;
        filter: grayscale(0.7);
        transition: filter 0.2s ease;
        user-select: none;
    }

    &.active img {
        filter: grayscale(0);
    }

    @media (max-width: 768px) {
        font-size: 0.7rem;
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
    { to: "/", icon: homeIcon, label: "Home" },
    { to: "/health", icon: healthIcon, label: "Health" },
    { to: "/journal", icon: journalIcon, label: "Journal" },
    { to: "/triggersinsights", icon: triggersIcon, label: "Triggers & Insights" },
    { to: "/trichgame", icon: trichGameIcon, label: "TrichGame" },
    { to: "/trichbot", icon: trichBotIcon, label: "TrichBot" },
] as const;

// BottomNav Component
export const BottomNav = () => {
    const [visible, setVisible] = useState<boolean>(true);

    // Effect to handle keyboard visibility on mobile devices
    useEffect(() => {
        // Detect mobile keyboard by comparing height changes
        const threshold = 150; // px difference = keyboard up
        let initialHeight = window.innerHeight;

        // Resize handler
        const handleResize = () => {
            // If orientation changes, refresh baseline
            if (Math.abs(window.innerHeight - initialHeight) > 300) {
                initialHeight = window.innerHeight;
            }
            const heightDiff = initialHeight - window.innerHeight;
            setVisible(heightDiff < threshold);
        };

        // Event listeners
        window.addEventListener("resize", handleResize);
        // Also hide on focusin of inputs (helps on some devices)
        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
                setVisible(false);
            }
        };
        const handleFocusOut = () => setVisible(true);

        window.addEventListener("focusin", handleFocusIn);
        window.addEventListener("focusout", handleFocusOut);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("focusin", handleFocusIn);
            window.removeEventListener("focusout", handleFocusOut);
        };
    }, []);

    return (
        <BottomNavBar visible={visible} aria-label="Bottom navigation">
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
    );
}

export default BottomNav;