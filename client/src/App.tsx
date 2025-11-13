// client/src/App.tsx

import { ThemeProvider } from "styled-components";
import { theme, GlobalStyle } from "@/styles";
import { AppRoutes } from "@/routes";

export const App = () => (
  <ThemeProvider theme={theme}>
    <GlobalStyle />
    <AppRoutes />   {/* <-- Router will be inside AppRoutes */}
  </ThemeProvider>
);

export default App;
