// client/src/styles/GlobalStyle.ts

import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
        *, *::before, *::after { box-sizing: border-box; }
    html, body, #root { height: 100%; }
    body {
        margin: 0;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", "Noto Sans", Arial, "Apple Color Emoji", "Segoe UI Emoji";
        background: ${({ theme }) => theme.colors.page_bg};
        color: ${({ theme }) => theme.colors.text_primary};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
    button { cursor: pointer; }
`;
