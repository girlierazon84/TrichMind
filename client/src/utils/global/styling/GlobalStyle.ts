// client/src/utils/global/styling/GlobalStyle.ts
import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
    /* Reset and base box model */
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    /* Body and main background */
    body {
        font-family: "Segoe UI", Roboto, Arial, sans-serif;
        background-color: ${({ theme }) => theme?.page_bg || "#f7f9fa"};
        color: ${({ theme }) => theme?.text_primary || "#2c2e2e"};
        transition: background-color 0.3s ease, color 0.3s ease;
        min-height: 100vh;
        line-height: 1.5;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
        color: ${({ theme }) => theme?.text_primary || "#2c2e2e"};
        font-weight: 600;
    }

    /* Paragraphs */
    p {
        color: ${({ theme }) => theme?.text_secondary || "#666"};
        font-size: 1rem;
        line-height: 1.6;
    }

    /* Links */
    a {
        color: ${({ theme }) => theme?.primary || "#21b2ba"};
        text-decoration: none;
        transition: color 0.2s ease;

        &:hover {
            text-decoration: underline;
            color: ${({ theme }) => theme?.secondary || "#31becc"};
        }
    }

    /* Inputs and textareas */
    input, textarea {
        font-family: inherit;
        border: 1px solid ${({ theme }) => theme?.fourthly || "#ccc"};
        border-radius: 6px;
        padding: 0.6rem 0.8rem;
        width: 100%;
        outline: none;
        background-color: #fff;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;

        &:focus {
            border-color: ${({ theme }) => theme?.primary || "#21b2ba"};
            box-shadow: 0 0 0 3px ${({ theme }) => theme?.thirdly || "#add6da"};
        }
    }

    /* Buttons */
    button {
        font-family: inherit;
        cursor: pointer;
        border: none;
        border-radius: 6px;
        padding: 0.6rem 1rem;
        background: ${({ theme }) => theme?.primary || "#21b2ba"};
        color: white;
        transition: background 0.3s ease, transform 0.2s ease;

        &:hover {
            background: ${({ theme }) => theme?.secondary || "#31becc"};
            transform: translateY(-1px);
        }

        &:active {
            transform: translateY(0);
        }
    }

    /* Text selection */
    ::selection {
        background: ${({ theme }) => theme?.secondary || "#31becc"};
        color: #fff;
    }
`;
