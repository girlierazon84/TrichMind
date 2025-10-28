// client/src/App.tsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { MOTIF } from "./theme";
import { GlobalStyle } from "./utils/global/styling/GlobalStyle";

import ResetPasswordPage from "./pages/ResetPasswordPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import BottomNav from "./components/BottomNav";

// Example placeholder pages
import HomePage from "./pages/HomePage"; // ✅ optional for demo
import HealthPage from "./pages/HealthPage";
import JournalPage from "./pages/JournalPage";
import TriggersPage from "./pages/TriggersInsightsPage";
import TrichGamePage from "./pages/TrichGamePage";
import TrichBotPage from "./pages/TrichBotPage";

function AppContent() {
  const location = useLocation();

  // Paths where BottomNav should NOT appear
  const hideNavPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  const shouldHideNav = hideNavPaths.includes(location.pathname);

  return (
    <>
      <Routes>
        {/* 🔐 Auth routes (no bottom nav) */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* 🌐 Main app routes (with nav) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/triggersinsights" element={<TriggersPage />} />
        <Route path="/trichgame" element={<TrichGamePage />} />
        <Route path="/trichbot" element={<TrichBotPage />} />
      </Routes>

      {/* ✅ Show BottomNav only if not in auth pages */}
      {!shouldHideNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={MOTIF}>
      <GlobalStyle />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
