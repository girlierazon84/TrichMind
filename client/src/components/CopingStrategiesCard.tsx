// client/src/components/CopingStrategiesCard.tsx

import React from "react";
import styled, { keyframes } from "styled-components";
import checkIcon from "@/assets/icons/check.png";
import failedIcon from "@/assets/icons/failed.png";

/**-------------------
    🧩 Interfaces
----------------------*/
export interface CopingStrategiesCardProps {
  worked?: string[];
  notWorked?: string[];
  onToggle?: (name: string, bucket: "worked" | "notWorked") => void;
}

/**-------------------
    Animations
----------------------*/
const cardEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

/**-------------------
    Styled Components
----------------------*/
const Card = styled.div`
  width: 100%;
  max-width: 960px;
  background: ${({ theme }) => theme.colors.card_bg};
  padding: ${({ theme }) => theme.spacing(4)};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.colors.card_shadow};
  margin: ${({ theme }) => theme.spacing(4)} 0;
  animation: ${cardEnter} 0.45s ease-out;
  transform-style: preserve-3d;
  transition: transform 0.22s ease-out, box-shadow 0.22s ease-out;

  &:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
  }
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  font-weight: 600;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text_primary};
`;

const Subtitle = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text_secondary};
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
  padding: 0.45rem 0.95rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  background-color: ${({ $type }) =>
    $type === "worked" ? "#21b2ba1a" : "#e74c3c1a"};
  color: ${({ $type }) => ($type === "worked" ? "#21b2ba" : "#e74c3c")};
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  transition:
    background-color 0.2s ease-out,
    transform 0.16s ease-out,
    box-shadow 0.2s ease-out;

  &:hover {
    background-color: ${({ $type }) =>
      $type === "worked" ? "#21b2ba2b" : "#e74c3c2b"};
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.07);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px) scale(0.98);
    box-shadow: none;
  }

  img {
    width: 16px;
    height: 16px;
  }
`;

/**-------------------------------------
    Coping Strategies Card Component
----------------------------------------*/
export const CopingStrategiesCard: React.FC<CopingStrategiesCardProps> = ({
  worked,
  notWorked,
  onToggle,
}) => {
  // Only use what the app passes in (HomePage via useCopingStrategies)
  const resolvedWorked: string[] = worked ?? [];
  const resolvedNotWorked: string[] = notWorked ?? [];

  const hasAny =
    (resolvedWorked && resolvedWorked.length > 0) ||
    (resolvedNotWorked && resolvedNotWorked.length > 0);

  return (
    <Card>
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
              $type="worked"
              onClick={() => onToggle?.(name, "worked")}
            >
              <img src={checkIcon} alt="Effective strategy" />
              {name}
            </PillButton>
          ))}

          {resolvedNotWorked.map((name) => (
            <PillButton
              key={`notWorked-${name}`}
              $type="notWorked"
              onClick={() => onToggle?.(name, "notWorked")}
            >
              <img src={failedIcon} alt="Less effective strategy" />
              {name}
            </PillButton>
          ))}
        </PillRow>
      ) : (
        <Subtitle>
          Add coping strategies when registering or in your profile to see them here.
        </Subtitle>
      )}
    </Card>
  );
};

export default CopingStrategiesCard;
