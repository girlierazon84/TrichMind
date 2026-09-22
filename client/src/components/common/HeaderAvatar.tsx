// client/src/components/common/HeaderAvatar.tsx

"use client";

import Image from "next/image";
import styled from "styled-components";
import { useAuth } from "@/hooks";
import { UserIcon } from "@/assets/icons";
import { toImgSrc } from "@/utils";


const AvatarButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;

    display: grid;
    place-items: center;

    border-radius: 50%;

    &:focus-visible {
        outline: 2px solid
            ${({ theme }) =>
                theme.colors.primary};

        outline-offset: 3px;
    }
`;

const AvatarImg = styled(Image)<{
    $size: number;
}>`
    width: ${({ $size }) =>
        `${$size}px`};

    height: ${({ $size }) =>
        `${$size}px`};

    border-radius: 50%;
    object-fit: cover;

    border: 2px solid
        rgba(255, 255, 255, 0.9);

    box-shadow: 0 4px 10px
        rgba(0, 0, 0, 0.18);
`;

type Props = {
    onClick?: () => void;
    size?: number;
};

export default function HeaderAvatar({
    onClick,
    size = 34,
}: Props) {
    const { user } = useAuth();

    /**----------------------------------------------------------------------
        AuthProvider is the single source of truth for the user's avatar.
    -------------------------------------------------------------------------*/
    const src =
        toImgSrc(
            user?.avatarUrl
        ) ||
        toImgSrc(UserIcon);

    return (
        <AvatarButton
            type="button"
            onClick={onClick}
            aria-label="Open profile"
            title="Open profile"
        >
            <AvatarImg
                src={src}
                alt={
                    user?.displayName ||
                    user?.email ||
                    "Profile"
                }
                width={size}
                height={size}
                $size={size}
                unoptimized
            />
        </AvatarButton>
    );
}
