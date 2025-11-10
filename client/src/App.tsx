// client/src/App.tsx

import React from "react";
import styled, { ThemeProvider } from "styled-components";
import { theme } from "@/styles/theme";
import { GlobalStyle } from "@/styles/GlobalStyle";
import { usePredict } from "@/hooks/usePredict";
import { PredictionForm } from "@/components/PredictionForm";
import { ResultCard } from "@/components/ResultCard";

const Page = styled.main`
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 4rem 1rem;
`;

const Container = styled.div`
  width: 100%;
  max-width: 760px;

  p {
    color: ${(props) => props.theme.colors.high_risk};
  }
`;

export default function App() {
  const { predict, result, loading, error } = usePredict("/predict");

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Page>
        <Container>
          <PredictionForm onSubmit={predict} />
          {loading && <h5>Predicting…</h5>}
          {error && <p>{error}</p>}
          {result && <ResultCard result={result} />}
        </Container>
      </Page>
    </ThemeProvider>
  );
}
