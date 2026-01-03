// client/src/components/CopingStrategiesCard.tsx

"use client";

import React from "react";
import Image from "next/image";
import styled, { keyframes } from "styled-components";
import { CheckMarkIcon, XFailedIcon } from "@/assets/icons";


/**--------------------------------------------------
    Props for the CopingStrategiesCard component.
-----------------------------------------------------*/
export interface CopingStrategiesCardProps {
  worked?: string[];
  notWorked?: string[];
  onToggle?: (name: string, bucket: "worked" | "notWorked") => void;
}

/**-------------------------------------
    Styled components and animations
----------------------------------------*/
// Animation for card entrance
const cardEnter = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

// Styled card container
const Card = styled.section`
  perspective: 900px;
  width: 100%;
  max-width: 960px;
  margin: 2rem 0 0 0;

  background: ${({ theme }) => theme.colors.card_bg};
  padding: ${({ theme }) => theme.spacing(4)};
  border-radius: ${({ theme }) => theme.radius.lg};

  animation: ${cardEnter} 0.45s ease-out;
  transform-style: preserve-3d;
  transition: transform 0.22s ease-out, box-shadow 0.22s ease-out;

  box-shadow: 0 16px 40px #0d6275;

  &:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 20px 48px #0d6275;
  }
`;

// Title row containing title and subtitle
const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1rem;
`;

// Title text
const Title = styled.h3`
  font-weight: 600;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text_primary};
  margin: 0;
`;

// Subtitle text
const Subtitle = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text_secondary};
`;

// Row for pills
const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

// Styled pill button
const PillButton = styled.button<{ $type: "worked" | "notWorked" }>`
  border: none;
  border-radius: 9999px;
  padding: 0.45rem 0.95rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;

  background-color: ${({ $type }) => ($type === "worked" ? "#21b2ba1a" : "#e74c3c1a")};
  color: ${({ $type }) => ($type === "worked" ? "#21b2ba" : "#e74c3c")};

  display: inline-flex;
  align-items: center;
  gap: 0.45rem;

  transition: background-color 0.2s ease-out, transform 0.16s ease-out, box-shadow 0.2s ease-out;

  &:hover {
    background-color: ${({ $type }) => ($type === "worked" ? "#21b2ba2b" : "#e74c3c2b")};
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.07);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px) scale(0.98);
    box-shadow: none;
  }
`;

/**-------------------------------------------------------
    CopingStrategiesCard Component
    Displays coping strategies categorized as "worked"
    and "not worked".
----------------------------------------------------------*/
export const CopingStrategiesCard: React.FC<CopingStrategiesCardProps> = ({
  worked,
  notWorked,
  onToggle,
}) => {
  // Default to empty arrays if undefined
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
              {/* Decorative icon (screen readers already read the text) */}
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
