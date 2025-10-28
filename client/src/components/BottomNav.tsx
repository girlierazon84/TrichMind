// client/src/components/BottomNav.tsx
import { NavLink } from "react-router-dom";
import styled from "styled-components";

// ✅ Import icons via Vite (ensures correct bundling)
import homeIcon from "../assets/icons/home.png";
import healthIcon from "../assets/icons/health.png";
import journalIcon from "../assets/icons/journal.png";
import triggersIcon from "../assets/icons/triggers.png";
import trichGameIcon from "../assets/icons/trichgame.png";
import trichBotIcon from "../assets/icons/trichbot.png";

// ✅ Styled-components version — no external CSS required
const Nav = styled.nav`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 70px;
    background: ${({ theme }) => theme.card_bg || "#fff"};
    display: flex;
    justify-content: space-around;
    align-items: center;
    border-top: 1px solid ${({ theme }) => theme.fourthly || "#ddd"};
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    z-index: 1000;

    @media (min-width: 768px) {
        position: static;
        height: auto;
        background: transparent;
        box-shadow: none;
        border: none;
    }
`;

const NavItem = styled(NavLink)`
    text-decoration: none;
    color: ${({ theme }) => theme.text_secondary || "#666"};
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s ease;

    &.active {
        color: ${({ theme }) => theme.primary || "#21b2ba"};
    }

    img {
        width: 26px;
        height: 26px;
        margin-bottom: 4px;
        filter: grayscale(0.6);
        transition: filter 0.2s ease;
    }

    &.active img {
        filter: grayscale(0);
    }

    &:hover {
        color: ${({ theme }) => theme.secondary || "#31becc"};
    }
`;

// ✅ Icon item list
const items = [
    { to: "/", icon: homeIcon, label: "Home" },
    { to: "/health", icon: healthIcon, label: "Health" },
    { to: "/journal", icon: journalIcon, label: "Journal" },
    { to: "/triggersinsights", icon: triggersIcon, label: "Triggers" },
    { to: "/trichgame", icon: trichGameIcon, label: "TrichGame" },
    { to: "/trichbot", icon: trichBotIcon, label: "TrichBot" },
];

export default function BottomNav() {
    return (
        <Nav>
            {items.map((item) => (
                <NavItem
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => (isActive ? "active" : "")}
                >
                    <img src={item.icon} alt={item.label} />
                    <span>{item.label}</span>
                </NavItem>
            ))}
        </Nav>
    );
}
