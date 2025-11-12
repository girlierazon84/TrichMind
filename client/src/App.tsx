// client/src/App.tsx

import { ThemeProvider } from "styled-components";
import { theme, GlobalStyle } from "@/styles";
import { AppRoutes } from "@/routes/AppRoutes";

export const App = () => (
  <ThemeProvider theme={theme}>
    <GlobalStyle />
    <AppRoutes />
  </ThemeProvider>
);

export default App;
