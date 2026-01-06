// client/src/components/CopingStrategiesCard.tsx

"use client";

import React from "react";
import Image from "next/image";
import styled, { keyframes, css } from "styled-components";
import { CheckMarkIcon, XFailedIcon } from "@/assets/icons";


export interface CopingStrategiesCardProps {
    worked?: string[];
    notWorked?: string[];
    onToggle?: (name: string, bucket: "worked" | "notWorked") => void;
}

/**-------------------------------------
    Animations
----------------------------------------*/
const cardEnter = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const shimmer = keyframes`
  0%   { transform: translateX(-30%) rotate(8deg); opacity: 0; }
  25%  { opacity: 0.16; }
  70%  { opacity: 0.12; }
  100% { transform: translateX(130%) rotate(8deg); opacity: 0; }
`;

/**-------------------------------------
    Styled components
----------------------------------------*/
const Card = styled.section`
    position: relative;
    width: 100%;
    max-width: 960px;
    margin: 0;

    border-radius: ${({ theme }) => theme.radius.lg};
    padding: ${({ theme }) => theme.spacing(4)};
    overflow: hidden;

    background: ${({ theme }) => theme.colors.card_bg};
    border: 1px solid rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(6px);

    animation: ${cardEnter} 0.45s ease-out;
    transition: transform 0.18s ease-out, box-shadow 0.22s ease-out;

    box-shadow: 0 16px 40px rgba(13, 98, 117, 0.22);

    &::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0.04) 35%,
            rgba(255, 255, 255, 0) 70%
        );
        pointer-events: none;
    }

    &::before {
        content: "";
        position: absolute;
        inset: -30% -40%;
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.38) 50%,
            rgba(255, 255, 255, 0) 100%
        );
        filter: blur(10px);
        opacity: 0;
        animation: ${shimmer} 6.2s ease-in-out infinite;
        pointer-events: none;
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 52px rgba(13, 98, 117, 0.26);
    }
`;

const TitleRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 1rem;
    gap: 10px;
`;

const Title = styled.h3`
    font-weight: 950;
    font-size: 1.05rem;
    color: ${({ theme }) => theme.colors.text_primary};
    margin: 0;
`;

const Subtitle = styled.span`
    font-size: 0.85rem;
    font-weight: 650;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const PillRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
`;

const PillButton = styled.button<{ $type: "worked" | "notWorked" }>`
    border: none;
    border-radius: 9999px;
    padding: 0.5rem 0.95rem;
    font-size: 0.9rem;
    font-weight: 850;
    cursor: pointer;

    display: inline-flex;
    align-items: center;
    gap: 0.5rem;

    backdrop-filter: blur(6px);
    transition: transform 0.15s ease-out, filter 0.15s ease-out, box-shadow 0.18s ease-out;

    ${({ $type }) => {
        const baseBg = $type === "worked" ? "rgba(33, 178, 186, 0.14)" : "rgba(231, 76, 60, 0.14)";
        const baseBorder = $type === "worked" ? "rgba(33, 178, 186, 0.30)" : "rgba(231, 76, 60, 0.30)";
        const baseText = $type === "worked" ? "rgba(0,0,0,0.76)" : "rgba(0,0,0,0.76)";

        return css`
            background: ${baseBg};
            border: 1px solid ${baseBorder};
            color: ${baseText};
        `;
    }}

    &:hover {
        transform: translateY(-1px);
        filter: brightness(1.02);
        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.10);
    }

    &:active {
        transform: translateY(0);
        box-shadow: none;
    }

    &:focus-visible {
        outline: 2px solid rgba(0, 0, 0, 0.22);
        outline-offset: 2px;
    }
`;

export const CopingStrategiesCard: React.FC<CopingStrategiesCardProps> = ({
    worked,
    notWorked,
    onToggle,
}) => {
    const resolvedWorked = worked ?? [];
    const resolvedNotWorked = notWorked ?? [];
    const hasAny = resolvedWorked.length > 0 || resolvedNotWorked.length > 0;

    return (
        <Card aria-label="Coping strategies">
            <TitleRow>
                <Title>Coping Strategies</Title>
                {hasAny && (
                    <Subtitle>
                        {resolvedWorked.length} helpful • {resolvedNotWorked.length} less helpful
                    </Subtitle>
                )}
            </TitleRow>

            {hasAny ? (
                <PillRow>
                    {resolvedWorked.map((name) => (
                        <PillButton
                            key={`worked-${name}`}
                            type="button"
                            $type="worked"
                            onClick={() => onToggle?.(name, "worked")}
                            aria-label={`Coping strategy "${name}" marked as helpful. Click to change.`}
                        >
                            <span aria-hidden="true">
                                <Image src={CheckMarkIcon} alt="" width={16} height={16} />
                            </span>
                            {name}
                        </PillButton>
                    ))}

                    {resolvedNotWorked.map((name) => (
                        <PillButton
                            key={`notWorked-${name}`}
                            type="button"
                            $type="notWorked"
                            onClick={() => onToggle?.(name, "notWorked")}
                            aria-label={`Coping strategy "${name}" marked as less helpful. Click to change.`}
                        >
                            <span aria-hidden="true">
                                <Image src={XFailedIcon} alt="" width={16} height={16} />
                            </span>
                            {name}
                        </PillButton>
                    ))}
                </PillRow>
            ) : (
                <Subtitle>Add coping strategies in your profile to see them here.</Subtitle>
            )}
        </Card>
    );
};

export default CopingStrategiesCard;
