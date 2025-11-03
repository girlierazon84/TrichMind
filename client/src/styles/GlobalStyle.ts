// client/src/styles/GlobalStyle.ts

import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: "Poppins", sans-serif;
    background-color: #c9e3e4;
    color: #2c2e2e;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    max-height: 100vh;
    max-width: 100vw;
    overflow-x: hidden;
  }
`;
