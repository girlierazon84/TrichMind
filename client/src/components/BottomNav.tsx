import { NavLink } from "react-router-dom";
import styled from "styled-components";

// ✅ Import icons (Vite handles static asset imports automatically)
import homeIcon from "../assets/icons/home.png";
import healthIcon from "../assets/icons/health.png";
import journalIcon from "../assets/icons/journal.png";
import triggersIcon from "../assets/icons/triggers.png";
import trichGameIcon from "../assets/icons/trichgame.png";
import trichBotIcon from "../assets/icons/trichbot.png";

// ✅ Styled Components for mobile-only bottom nav
const BottomNavBar = styled.nav`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 70px;
    background: ${({ theme }) => theme.card_bg || "#ffffff"};
    border-top: 1px solid ${({ theme }) => theme.fourthly || "#ddd"};
    display: flex;
    justify-content: space-around;
    align-items: center;
    z-index: 1000;
    box-shadow: 0 -3px 10px rgba(0, 0, 0, 0.1);
`;

const NavItem = styled(NavLink)`
    text-decoration: none;
    color: ${({ theme }) => theme.text_secondary || "#666"};
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 500;
    transition: color 0.2s ease;

    &.active {
        color: ${({ theme }) => theme.primary || "#21b2ba"};
    }

    img {
        width: 28px;
        height: 28px;
        margin-bottom: 4px;
        filter: grayscale(0.7);
        transition: filter 0.2s ease;
    }

    &.active img {
        filter: grayscale(0);
    }
`;

// ✅ Navigation items
const navItems = [
    { to: "/", icon: homeIcon, label: "Home" },
    { to: "/health", icon: healthIcon, label: "Health" },
    { to: "/journal", icon: journalIcon, label: "Journal" },
    { to: "/triggersinsights", icon: triggersIcon, label: "Triggers" },
    { to: "/trichgame", icon: trichGameIcon, label: "Game" },
    { to: "/trichbot", icon: trichBotIcon, label: "Bot" },
];

export default function BottomNav() {
    return (
        <BottomNavBar>
            {navItems.map((item) => (
                <NavItem
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => (isActive ? "active" : "")}
                >
                    <img src={item.icon} alt={item.label} />
                    <span>{item.label}</span>
                </NavItem>
            ))}
        </BottomNavBar>
    );
}
