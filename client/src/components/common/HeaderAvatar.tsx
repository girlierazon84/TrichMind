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
`;

const AvatarImg = styled(Image)`
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
`;

type Props = {
    onClick?: () => void;
    size?: number; // default 34
};

export default function HeaderAvatar({ onClick, size = 34 }: Props) {
    const { user } = useAuth();

    const src = toImgSrc(user?.avatarUrl) || toImgSrc(UserIcon);

    return (
        <AvatarButton onClick={onClick} aria-label="Open profile">
            <AvatarImg src={src} alt={user?.email || "Profile"} width={size} height={size} />
        </AvatarButton>
    );
}
