// client/src/App.tsx

import styled, { ThemeProvider } from "styled-components";
import { theme } from "@/styles/theme";
import { GlobalStyle } from "@/styles/GlobalStyle";
import RegistrationPage from "@/pages/RegistrationPage";
import { BottomNav } from "@/components/BottomNav";

// ──────────────────────────────
// Styled Components
// ──────────────────────────────
const Page = styled.main`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 4rem 1rem;
  background: ${({ theme }) => theme.colors.page_bg || "#c9e3e4"};
`;

const Container = styled.div`
  width: 100%;
  max-width: 760px;
  text-align: center;
`;

// ──────────────────────────────
// Main App
// ──────────────────────────────
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Page>
        <Container>
          <RegistrationPage />
        </Container>
      </Page>
      <BottomNav />
    </ThemeProvider>
  );
}
