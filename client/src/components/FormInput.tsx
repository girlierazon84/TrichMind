// client/src/components/FormInput.tsx

"use client";

import React from "react";
import styled from "styled-components";


export interface FormInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value" | "name"> {
    required?: boolean;
    disabled?: boolean;
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
const InputWrapper = styled.div`
    display: flex;
    flex-direction: column;
        width: 100%;
    margin-bottom: 1rem;
`;

const StyledLabel = styled.label`
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.35rem;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const InputContainer = styled.div`
    position: relative;
    display: flex;
    align-items: center;
`;

const InputField = styled.input<{ $hasError?: boolean; $hasIcon?: boolean }>`
    width: 100%;
    padding: 0.75rem 1rem;
    padding-right: ${({ $hasIcon }) => ($hasIcon ? "2.75rem" : "1rem")};
    font-size: 1rem;

    border: 2px solid ${({ $hasError, theme }) => ($hasError ? theme.colors.high_risk : theme.colors.fourthly)};
    border-radius: 12px;

    outline: none;
    background-color: ${({ theme }) => theme.colors.card_bg};
    color: ${({ theme }) => theme.colors.text_primary};
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

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

const IconSlot = styled.div`
    position: absolute;
    right: 1rem;
    display: grid;
    place-items: center;
    opacity: 0.75;

    svg,
    img {
        width: 20px;
        height: 20px;
    }
`;

const ErrorText = styled.span`
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.high_risk};
    margin-top: 0.25rem;
`;

/**------------------------
    FormInput Component
---------------------------*/
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
    ...rest
}) => {
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
                    $hasIcon={!!icon}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${name}-error` : undefined}
                    {...rest}
                />
                {icon ? <IconSlot>{icon}</IconSlot> : null}
            </InputContainer>

            {error && <ErrorText id={`${name}-error`}>{error}</ErrorText>}
        </InputWrapper>
    );
};

export default FormInput;
