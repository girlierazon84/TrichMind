import styled from "styled-components";

export const ThemedButton = styled.button`
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.card_bg};
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    cursor: pointer;
    font-weight: 600;
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
    transition: all 0.3s ease;

    &:hover {
        background: ${({ theme }) => theme.colors.fifthly};
        transform: translateY(-2px);
    }
`;
