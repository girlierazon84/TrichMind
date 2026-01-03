// client/src/components/FormInput.tsx
"use client";

import React from "react";
import styled from "styled-components";


// Props for the FormInput component
export interface FormInputProps
    extends Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        "onChange" | "type" | "value" | "name"
    > {
    // Whether the input is required or not (added for clarity)
    required?: boolean;
    // Whether the input is disabled or not
    disabled?: boolean;
    // Label for the input field
    label?: string;
    type?: React.HTMLInputTypeAttribute;
    name: string;
    value: string | number;
    placeholder?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    icon?: React.ReactNode;
}

/**------------------------------------
    Styled Components for FormInput
---------------------------------------*/
// Wrapper for the entire input component including label and error message
const InputWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-bottom: 1rem;
`;

// Styled label for the input field
const StyledLabel = styled.label`
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.35rem;
    color: ${({ theme }) => theme.colors.text_primary};
    text-align: justify;
`;

// Styled input field with dynamic error styling based on props
const InputField = styled.input<{ $hasError?: boolean }>`
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border: 2px solid
        ${({ $hasError, theme }) => ($hasError ? theme.colors.high_risk : theme.colors.fourthly)};
            border-radius: 12px;
            outline: none;
            background-color: ${({ theme }) => theme.colors.card_bg};
            color: ${({ theme }) => theme.colors.text_primary};
            transition: all 0.2s ease;

    &::placeholder {
        font-style: italic;
        font-size: 0.85rem;
        opacity: 0.8;
    }

    &:focus {
        border-color: ${({ theme }) => theme.colors.primary};
        box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.thirdly};
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

// Styled error message text displayed below the input field when there is an error
const ErrorText = styled.span`
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.high_risk};
    margin-top: 0.25rem;
`;

// Container for the input field and optional icon positioning
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
        padding-right: 2.5rem;
    }
`;

/**------------------------
    FormInput Component
---------------------------*/
export const FormInput: React.FC<FormInputProps> = ({
    // Destructuring props with default values where applicable
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
    ...rest
}) => {
    // Accessible labels and titles for better usability and screen reader support
    const accessibleLabel = label || name.replace(/_/g, " ");
    const accessiblePlaceholder = placeholder || `Enter ${accessibleLabel.toLowerCase()}`;
    const accessibleTitle = `${accessibleLabel}${required ? " (required)" : ""}`;

    return (
        <InputWrapper>
            {label && <StyledLabel htmlFor={name}>{label}</StyledLabel>}
            <InputContainer>
                <InputField
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    placeholder={accessiblePlaceholder}
                    title={accessibleTitle}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    $hasError={!!error}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${name}-error` : undefined}
                    {...rest}
                />
                {icon}
            </InputContainer>
            {error && <ErrorText id={`${name}-error`}>{error}</ErrorText>}
        </InputWrapper>
    );
};

export default FormInput;
