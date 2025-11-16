// client/src/pages/ProfilePage.tsx

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useAuth } from "@/hooks";
import { axiosClient, authApi } from "@/services";
import { ThemeButton, FormInput } from "@/components";
import { useNavigate } from "react-router-dom";
import { BackIcon, UserIcon } from "@/assets/icons";

/* -----------------------------------------------------
    Animations
----------------------------------------------------- */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* -----------------------------------------------------
    Styled Components
----------------------------------------------------- */
const Wrapper = styled.main`
  margin: 2.5rem auto;
  padding: 2rem;
  animation: ${fadeIn} 0.4s ease-out;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.2rem;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;

  img {
    width: 28px;
    height: 28px;
    filter: grayscale(0.3);
    transition: transform 0.2s ease, filter 0.2s ease;
  }

  &:hover img {
    transform: translateX(-3px);
    filter: grayscale(0);
  }
`;

const Title = styled.h1`
  font-size: 1.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  flex: 1;
  margin: 0;
  text-align: center;
`;

const AvatarWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  position: relative;
`;

const Avatar = styled.img`
  width: 110px;
  height: 110px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${({ theme }) => theme.colors.primary};
`;

const EditAvatarButton = styled.label`
  position: absolute;
  bottom: 4px;
  right: calc(50% - 55px);
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 0.35rem 0.7rem;
  border-radius: 20px;
  font-size: 0.75rem;
  cursor: pointer;
`;

const SectionTitle = styled.h3`
  margin: 1.25rem 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
`;

const ButtonRow = styled.div`
  margin-top: 2rem;
  display: flex;
  gap: 1rem;

  button {
    flex: 1;
  }
`;

const LoadingText = styled.p`
  text-align: center;
  padding: 2rem;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.high_risk};
  text-align: center;
`;

const SuccessMessage = styled.p`
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;
`;

const PasswordBox = styled.div`
  margin-top: 2rem;
  padding: 1.25rem;
`;

const PasswordTitle = styled.h3`
  font-size: 1.05rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const PasswordMessage = styled.p<{ success?: boolean }>`
  color: ${({ success, theme }) =>
    success ? theme.colors.primary : theme.colors.high_risk};
  margin-top: 1rem;
  text-align: center;
`;

/* -----------------------------------------------------
    Component
----------------------------------------------------- */
interface ExtendedUser {
  id: string;
  email: string;
  displayName?: string;
  age?: number;
  years_since_onset?: number;
  avatarUrl?: string;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const [profile, setProfile] = useState<ExtendedUser | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changing, setChanging] = useState(false);

  /* Load profile */
  useEffect(() => {
    if (!isAuthenticated) return;

    axiosClient
      .get<{ ok: boolean; user: ExtendedUser }>("/api/auth/me")
      .then((res) => {
        setProfile(res.data.user);
        setAvatarPreview(res.data.user.avatarUrl || "/assets/icons/user.png");
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  /* Input change */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  /* Avatar upload */
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
  };

  /* Save profile */
  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axiosClient.patch<{ ok: boolean; user: ExtendedUser }>(
        "/api/users/profile",
        profile
      );

      setProfile(res.data.user);
      setSuccess("Profile updated successfully!");
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  /* Change password */
  const handlePasswordChange = async () => {
    setPasswordMsg(null);
    setPasswordSuccess(false);

    if (!oldPassword || !newPassword) {
      setPasswordMsg("All fields required.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg("Passwords do not match.");
      return;
    }

    setChanging(true);

    try {
      await authApi.changePassword({ oldPassword, newPassword });
      setPasswordSuccess(true);
      setPasswordMsg("Password updated successfully!");

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordMsg("Incorrect old password.");
    } finally {
      setChanging(false);
    }
  };

  /* UI states */
  if (!isAuthenticated) return <LoadingText>Please login…</LoadingText>;
  if (loading) return <LoadingText>Loading your profile…</LoadingText>;
  if (!profile) return <ErrorMessage>Error loading profile.</ErrorMessage>;

  return (
    <Wrapper>
      <Header>
        <BackButton onClick={() => navigate("/")}>
          <img src={BackIcon} alt="Go back" />
        </BackButton>
        <Title>Your Profile</Title>
      </Header>

      <AvatarWrapper>
        <Avatar src={avatarPreview || UserIcon} alt="avatar" />
        <EditAvatarButton>
          Change
          <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
        </EditAvatarButton>
      </AvatarWrapper>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <SectionTitle>Account</SectionTitle>

      <FormInput
        label="Email"
        name="email"
        value={profile.email}
        disabled
        onChange={() => {}}
      />

      <FormInput
        label="Display Name"
        name="displayName"
        value={profile.displayName || ""}
        onChange={handleChange}
      />

      <SectionTitle>Details</SectionTitle>

      <FormInput
        label="Age"
        name="age"
        type="number"
        value={profile.age ?? ""}
        onChange={handleChange}
      />

      <FormInput
        label="Years Since Onset"
        name="years_since_onset"
        type="number"
        value={profile.years_since_onset ?? ""}
        onChange={handleChange}
      />

      {/* Password Change */}
      <PasswordBox>
        <PasswordTitle>Change Password</PasswordTitle>

        <FormInput
          label="Current Password"
          name="oldPassword"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />

        <FormInput
          label="New Password"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <FormInput
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <ThemeButton onClick={handlePasswordChange} disabled={changing}>
          {changing ? "Updating…" : "Update Password"}
        </ThemeButton>

        {passwordMsg && (
          <PasswordMessage success={passwordSuccess}>
            {passwordMsg}
          </PasswordMessage>
        )}
      </PasswordBox>

      <ButtonRow>
        <ThemeButton onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </ThemeButton>

        <ThemeButton onClick={logout}>Logout</ThemeButton>
      </ButtonRow>
    </Wrapper>
  );
};

export default ProfilePage;
