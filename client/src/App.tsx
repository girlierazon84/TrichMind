// client/src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import styled, { ThemeProvider } from "styled-components";
import { theme } from "@/styles/theme";
import { GlobalStyle } from "@/styles/GlobalStyle";
import { RegistrationPage } from "@/pages/RegistrationPage";
import LoginPage from "@/pages/LoginPage";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";

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
      <BrowserRouter>
        <Page>
          <Container>
            <Routes>
              {/* 🏠 Default route: redirect depending on auth */}
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    <WelcomeMessage>
                      Welcome back, {user?.displayName || user?.email}! 🎉
                    </WelcomeMessage>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              {/* 🔐 Login page */}
              <Route
                path="/login"
                element={
                  !isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />
                }
              />

              {/* 📝 Registration page */}
              <Route
                path="/register"
                element={
                  !isAuthenticated ? (
                    <RegistrationPage />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              {/* 🧭 Catch-all: redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Container>
        </Page>

        {/* 👇 Render bottom nav only for authenticated users */}
        {isAuthenticated && <BottomNav />}
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
