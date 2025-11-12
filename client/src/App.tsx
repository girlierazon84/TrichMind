// client/src/App.tsx

import { ThemeProvider } from "styled-components";
import { theme } from "@/styles/theme";
import { GlobalStyle } from "@/styles/GlobalStyle";
import { AppRoutes } from "@/routes/AppRoutes";

export const App = () => (
  <ThemeProvider theme={theme}>
    <GlobalStyle />
    <AppRoutes />
  </ThemeProvider>
);

export default App;
