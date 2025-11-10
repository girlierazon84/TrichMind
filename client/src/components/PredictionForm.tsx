// client/src/components/PredictionForm.tsx

import React, { useState } from "react";
import styled from "styled-components";
import { PredictInput } from "@/hooks/usePredict";

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
  background: ${({ theme }) => theme.colors.card_bg};
  padding: ${({ theme }) => theme.spacing(8)};
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.colors.card_shadow};
`;

const Row = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Label = styled.label`
  font-weight: 600;
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing(4)};
  border: 1px solid #d7dde2;
  border-radius: 8px;
`;

const Submit = styled.button`
  padding: ${({ theme }) => theme.spacing(4)};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
`;

type Props = {
  onSubmit: (payload: PredictInput) => void;
};

export function PredictionForm({ onSubmit }: Props) {
  const [form, setForm] = useState<PredictInput>({
    pulling_severity: 5,
    pulling_frequency_encoded: 2,
    awareness_level_encoded: 0.7,
    how_long_stopped_days_est: 30,
    successfully_stopped_encoded: 1,
    years_since_onset: 3,
    age: 25,
    age_of_onset: 22
  });

  function update<K extends keyof PredictInput>(key: K, value: number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <Row>
        <Label>Pulling Severity (0–10)</Label>
        <Input
          type="number"
          min={0}
          max={10}
          step={1}
          value={form.pulling_severity}
          onChange={(e) => update("pulling_severity", Number(e.target.value))}
        />
      </Row>

      <Row>
        <Label>Pulling Frequency Encoded (0–5)</Label>
        <Input
          type="number"
          min={0}
          max={5}
          step={1}
          value={form.pulling_frequency_encoded}
          onChange={(e) =>
            update("pulling_frequency_encoded", Number(e.target.value))
          }
        />
      </Row>

      <Row>
        <Label>Awareness Level Encoded (0–1)</Label>
        <Input
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={form.awareness_level_encoded}
          onChange={(e) =>
            update("awareness_level_encoded", Number(e.target.value))
          }
        />
      </Row>

      <Submit type="submit">Predict</Submit>
    </Form>
  );
}
