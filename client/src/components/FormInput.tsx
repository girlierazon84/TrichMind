// client/src/components/FormInput.tsx

import React from "react";
import styled from "styled-components";

// ──────────────────────────────
// Types
// ──────────────────────────────
export interface FormInputProps
    extends Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        "onChange" | "type" | "value" | "name"
    > {
    /** Label displayed above the input */
    label?: string;
    /** HTML input type (text, number, email, etc.) */
    type?: React.HTMLInputTypeAttribute;
    /** Unique name/id for the field */
    name: string;
    /** Controlled input value */
    value: string | number;
    /** Input placeholder text */
    placeholder?: string;
    /** Change handler */
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** Optional validation message */
    error?: string;
    /** Optional right-side icon */
    icon?: React.ReactNode;
}

// ──────────────────────────────
// Styled Components
// ──────────────────────────────

/** 🌿 Wrapper for label + input + error message */
const InputWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-bottom: 1rem;
`;

/** 🏷️ Label styling */
const StyledLabel = styled.label`
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.35rem;
    color: ${({ theme }) => theme.colors.text_primary};
    text-align: justify;
`;

/** ✍️ Styled input — uses transient prop `$hasError` */
const InputField = styled.input<{ $hasError?: boolean }>`
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border: 2px solid
        ${({ $hasError, theme }) =>
            $hasError ? theme.colors.high_risk : theme.colors.fourthly};
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

// ──────────────────────────────
// Component
// ──────────────────────────────
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
    ...rest // allows props like min, max, step, autoFocus, etc.
}) => {
    const accessibleLabel = label || name.replace(/_/g, " ");
    const accessiblePlaceholder =
        placeholder || `Enter ${accessibleLabel.toLowerCase()}`;
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
