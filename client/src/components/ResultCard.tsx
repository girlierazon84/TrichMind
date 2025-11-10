// client/src/components/ResultCard.tsx

import React from "react";
import styled from "styled-components";
import { PredictResponse } from "@/hooks/usePredict";

const Card = styled.div`
  margin-top: ${({ theme }) => theme.spacing(8)};
  background: ${({ theme }) => theme.colors.card_bg};
  padding: ${({ theme }) => theme.spacing(8)};
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.colors.card_shadow};
`;

const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing(4)} 0;
`;

export function ResultCard({ result }: { result: PredictResponse }) {
  return (
    <Card>
      <Title>Prediction</Title>
      <div>Risk score: {result.risk_score.toFixed(2)}</div>
      <div>Bucket: {result.risk_bucket}</div>
      <div>Confidence: {result.confidence.toFixed(2)}</div>
      <div>Model: {result.model_version}</div>
    </Card>
  );
}
