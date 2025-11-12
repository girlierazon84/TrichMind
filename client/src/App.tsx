// client/src/App.tsx

import styled, { ThemeProvider } from "styled-components";
import { theme } from "@/styles/theme";
import { GlobalStyle } from "@/styles/GlobalStyle";
import { RegistrationPage } from "@/pages/RegistrationPage";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import LoginPage from "./pages/LoginPage";

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

const WelcomeMessage = styled.h2`
  color: ${({ theme }) => theme.colors.text_primary};
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2rem;
`;

// ──────────────────────────────
// Main App Component
// ──────────────────────────────
export const App = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Page>
        <Container>
          {!isAuthenticated ? (
            <>
              <RegistrationPage />
              <LoginPage />
            </>
          ) : (
            <WelcomeMessage>
              Welcome back, {user?.displayName || user?.email}! 🎉
            </WelcomeMessage>
          )}
        </Container>
      </Page>

      {/* 👇 Only render BottomNav after successful login */}
      {isAuthenticated && <BottomNav />}
    </ThemeProvider>
  );
};

export default App;
