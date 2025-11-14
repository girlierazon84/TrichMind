// client/src/pages/ProfilePage.tsx

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useAuth } from "@/hooks";
import { axiosClient } from "@/services";
import { ThemeButton } from "@/components";

interface ExtendedUser {
    age?: number;
    years_since_onset?: number;
    [key: string]: unknown; // allow extra backend fields safely
}

const Wrapper = styled.main`
    max-width: 720px;
    margin: 2rem auto;
    padding: 2rem;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 16px;
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
`;

const Title = styled.h1`
    font-size: 1.8rem;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1.5rem;
`;

const Row = styled.div`
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.text_secondary};
`;

const Label = styled.span`
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const Value = styled.span`
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text_primary};
`;

export const ProfilePage: React.FC = () => {
    const { user, isAuthenticated, logout } = useAuth();

    const [extended, setExtended] = useState<ExtendedUser | null>(null);

    useEffect(() => {
        if (!user) return;

        axiosClient
            .get<{ ok: boolean; user: ExtendedUser }>("/api/auth/me")
            .then((res) => setExtended(res.data.user))
            .catch(() => setExtended(null));
    }, [user]);

    if (!isAuthenticated) return <p>Please login...</p>;
    if (!user) return <p>Loading profile...</p>;

    return (
        <Wrapper>
            <Title>Your Profile</Title>

            <Row>
                <Label>Email:</Label>
                <Value>{user.email}</Value>
            </Row>

            <Row>
                <Label>Display Name:</Label>
                <Value>{user.displayName || "Not set"}</Value>
            </Row>

            {extended && (
                <>
                    <Row>
                        <Label>Age:</Label>
                        <Value>{extended.age ?? "—"}</Value>
                    </Row>

                    <Row>
                        <Label>Years Since Onset:</Label>
                        <Value>{extended.years_since_onset ?? "—"}</Value>
                    </Row>
                </>
            )}

            <ThemeButton
                style={{ marginTop: "2rem", width: "100%" }}
                onClick={logout}
            >
                Logout
            </ThemeButton>
        </Wrapper>
    );
};

export default ProfilePage;
