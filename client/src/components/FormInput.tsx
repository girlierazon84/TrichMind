import React from "react";
import styled from "styled-components";

interface FormInputProps {
    label?: string;
    type?: string;
    name: string;
    value: string;
    placeholder?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    icon?: React.ReactNode;
}

/** 🌿 Wrapper for label + input + error message */
const InputWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-bottom: 1rem;
`;

/** 🏷️ Input label styling */
const Label = styled.label`
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.35rem;
    color: ${({ theme }) => theme.colors.text_primary};
`;

/** ✍️ Styled input field */
const InputField = styled.input<{ hasError?: boolean }>`
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border: 2px solid
        ${({ hasError, theme }) =>
            hasError ? theme.colors.high_risk : theme.colors.fourthly};
    border-radius: 12px;
    outline: none;
    background-color: ${({ theme }) => theme.colors.card_bg};
    color: ${({ theme }) => theme.colors.text_primary};
    transition: all 0.2s ease;

    &:focus {
        border-color: ${({ theme }) => theme.colors.primary};
        box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.thirdly};
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

/** 🚨 Error message */
const ErrorText = styled.span`
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.high_risk};
    margin-top: 0.25rem;
`;

/** 🌟 Input with optional icon */
const InputContainer = styled.div`
    position: relative;
    display: flex;
    align-items: center;

    svg,
    img {
        position: absolute;
        right: 1rem;
        width: 20px;
        height: 20px;
        opacity: 0.6;
    }

    input {
        width: 100%;
        padding-right: 2.5rem; /* space for icon */
    }
`;

export const FormInput: React.FC<FormInputProps> = ({
    label,
    type = "text",
    name,
    value,
    placeholder,
    onChange,
    required,
    disabled,
    error,
    icon,
}) => {
    return (
        <InputWrapper>
            {label && <Label htmlFor={name}>{label}</Label>}
            <InputContainer>
                <InputField
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    hasError={!!error}
                />
                {icon}
            </InputContainer>
            {error && <ErrorText>{error}</ErrorText>}
        </InputWrapper>
    );
};

export default FormInput;
