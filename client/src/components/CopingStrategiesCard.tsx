// client/src/components/CopingStrategiesCard.tsx
import React from "react";
import styled from "styled-components";

export interface CopingStrategiesCardProps {
    worked?: string[];
    notWorked?: string[];
    onToggle?: (name: string, bucket: "worked" | "notWorked") => void;
}

const Card = styled.div`
    background: ${({ theme }) => theme.colors.card_bg};
    padding: 1.5rem;
    border-radius: 16px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
    margin: 1.5rem 0;
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

const PillButton = styled.button<{ $type: "worked" | "notWorked" }>`
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
    transition: background-color 0.3s ease;

    &:hover {
        background-color: ${({ $type }) =>
            $type === "worked" ? "#21b2ba33" : "#e74c3c33"};
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
            {worked.map((name) => (
                <PillButton
                    key={`worked-${name}`}
                    $type="worked"
                    onClick={() => onToggle?.(name, "worked")}
                >
                    <img src="/assets/icons/check.png" alt="Check" />
                    {name}
                </PillButton>
            ))}
            {notWorked.map((name) => (
                <PillButton
                    key={`notWorked-${name}`}
                    $type="notWorked"
                    onClick={() => onToggle?.(name, "notWorked")}
                >
                    <img src="/assets/icons/failed.png" alt="Failed" />
                    {name}
                </PillButton>
            ))}
        </PillRow>
    </Card>
);

export default CopingStrategiesCard;
