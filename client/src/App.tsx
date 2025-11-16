// client/src/App.tsx

import { ThemeProvider } from "styled-components";
import { theme, GlobalStyle } from "@/styles";
import { AppRoutes } from "@/routes";
import { BottomNav } from "./components";
import { useAuth } from "./hooks";

export const App = () => {
  const { isAuthenticated } = useAuth();
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppRoutes />   {/* <-- Router will be inside AppRoutes */}

      {/* Show bottom nav only when logged in */}
      {isAuthenticated && <BottomNav />}
    </ThemeProvider>
  );
};

export default App;
