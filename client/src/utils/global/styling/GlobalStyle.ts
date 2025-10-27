import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    body {
        font-family: "Segoe UI", Roboto, Arial, sans-serif;
        background-color: ${({ theme }) => theme.page_bg};
        color: ${({ theme }) => theme.text_primary};
        transition: background-color 0.3s ease, color 0.3s ease;
    }

    h1, h2, h3, h4, h5, h6 {
        color: ${({ theme }) => theme.text_primary};
    }

    p {
        color: ${({ theme }) => theme.text_secondary};
    }

    a {
        color: ${({ theme }) => theme.primary};
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
`;
