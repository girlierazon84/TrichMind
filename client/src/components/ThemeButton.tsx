// client/src/components/ThemeButton.tsx
"use client";

import styled from "styled-components";

/**------------------------------------------------------------------------------
    ThemeButton Component - A styled button that adapts to the current theme.
---------------------------------------------------------------------------------*/
export const ThemeButton = styled.button`
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.card_bg};
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    width: 100%;
    cursor: pointer;
    font-weight: 600;
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
    transition: all 0.3s ease;

    &:hover {
        background: ${({ theme }) => theme.colors.fifthly};
        transform: translateY(-2px);
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }
`;

export default ThemeButton;
