// client/src/styles/GlobalStyle.ts

import { createGlobalStyle } from "styled-components";


// -----------------------------------------------------
//    Global Styles
// -----------------------------------------------------
export const GlobalStyle = createGlobalStyle`
    *, *::before, *::after {
        box-sizing: border-box;
    }

    html, body, #root {
        height: 100%;
        margin: 0;
        padding: 0;
    }

    body {
        margin: 0;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell,
            "Helvetica Neue", "Noto Sans", Arial, "Apple Color Emoji",
            "Segoe UI Emoji";

        /* -----------------------------------------------------------
            Premium Smooth Gradient Background
            - Soft diagonal blend
            - No harsh stops
            - Wellness-style ambiance
        ----------------------------------------------------------- */
        background: linear-gradient(
            135deg,
            ${({ theme }) => theme.colors.page_bg} 0%,
            ${({ theme }) => theme.colors.card_bg} 30%,
            ${({ theme }) => theme.colors.page_bg} 100%
        );

        color: ${({ theme }) => theme.colors.text_primary};

        /* Smoothing */
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;

        /* Prevent gradient shift during page scroll */
        background-attachment: fixed;
    }

    button {
        cursor: pointer;
    }
`;

export default GlobalStyle;
