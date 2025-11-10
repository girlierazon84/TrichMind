// client/src/components/PredictionForm.tsx

import styled from "styled-components";
import { usePredict } from "@/hooks/usePredict";
import { ThemedButton } from "./ThemeButton";


const PredictionFormContainer = styled.form`
  .error {
    color: ${({ theme }) => theme.colors.high_risk}
  }
`;

export function PredictForm() {
  const { predict, result, loading, error } = usePredict();

  const handleSubmit = async () => {
    await predict({
      pulling_severity: 5,
      pulling_frequency_encoded: 2,
      awareness_level_encoded: 0.7,
      how_long_stopped_days_est: 30,
      successfully_stopped_encoded: 1,
      years_since_onset: 3,
      age: 25,
      age_of_onset: 22,
      emotion: "anxious",
    });
  };

  return (
    <PredictionFormContainer>
      <ThemedButton onClick={handleSubmit} disabled={loading}>
        Predict
      </ThemedButton>
      {error && <p className="error">{error}</p>}
      {result && <p>Risk: {result.risk_bucket}</p>}
    </PredictionFormContainer>
  );
}
