// client/src/components/CopingStrategiesCard.tsx

import React from "react";
import styled from "styled-components";
import { fadeIn, slideUp } from "@/styles";


/* ──────────────────────────────
    🧩 Interfaces
────────────────────────────── */
export interface CopingStrategiesCardProps {
    worked?: string[];
    notWorked?: string[];
    onToggle?: (name: string, bucket: "worked" | "notWorked") => void;
}

const Card = styled.div`
    background: ${({ theme }) => theme.colors.card_bg};
    padding: 1.5rem;
    border-radius: 16px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
    margin: 1.5rem 0;
    animation: ${fadeIn} 0.5s ease-out;
`;

const Title = styled.h3`
    font-weight: 600;
    font-size: 1.1rem;
    color: ${({ theme }) => theme.colors.text_primary};
    margin-bottom: 1rem;
`;

const PillRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: flex-start;
`;

const PillButton = styled.button<{ $type: "worked" | "notWorked"; $index: number }>`
    border: none;
    border-radius: 9999px;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    background-color: ${({ $type }) =>
        $type === "worked" ? "#21b2ba22" : "#e74c3c22"};
    color: ${({ $type }) => ($type === "worked" ? "#21b2ba" : "#e74c3c")};
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.25s ease-out, transform 0.2s ease-out, box-shadow 0.25s ease-out;
    animation: ${slideUp} 0.45s ease-out;
    animation-delay: ${({ $index }) => $index * 80}ms;
    animation-fill-mode: both;

    &:hover {
        background-color: ${({ $type }) =>
            $type === "worked" ? "#21b2ba33" : "#e74c3c33"};
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.06);
    }

    &:active {
        transform: translateY(1px) scale(0.98);
    }

    img {
        width: 16px;
        height: 16px;
    }
`;

export const CopingStrategiesCard: React.FC<CopingStrategiesCardProps> = ({
    worked = ["Fidget toy"],
    notWorked = ["Journaling"],
    onToggle,
}) => (
    <Card>
        <Title>💪 Coping Strategies</Title>
        <PillRow>
            {worked.map((name, index) => (
                <PillButton
                    key={`worked-${name}`}
                    $type="worked"
                    $index={index}
                    onClick={() => onToggle?.(name, "worked")}
                >
                    <img src="/assets/icons/check.png" alt="Effective strategy" />
                    {name}
                </PillButton>
            ))}
            {notWorked.map((name, index) => (
                <PillButton
                    key={`notWorked-${name}`}
                    $type="notWorked"
                    $index={worked.length + index}
                    onClick={() => onToggle?.(name, "notWorked")}
                >
                    <img src="/assets/icons/failed.png" alt="Less effective strategy" />
                    {name}
                </PillButton>
            ))}
        </PillRow>
    </Card>
);

export default CopingStrategiesCard;
