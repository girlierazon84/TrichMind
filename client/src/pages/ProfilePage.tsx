// client/src/pages/ProfilePage.tsx

import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { useAuth } from "@/hooks";
import { axiosClient, authApi } from "@/services";
import { ThemeButton, FormInput } from "@/components";
import { useNavigate } from "react-router-dom";
import { BackIcon, UserIcon } from "@/assets/icons";


/* -----------------------------------------------------
    Animations
----------------------------------------------------- */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const cardRise = keyframes`
  from { opacity: 0; transform: translateY(22px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const pulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(73, 143, 255, 0.45); }
  70%  { box-shadow: 0 0 0 12px rgba(73, 143, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(73, 143, 255, 0); }
`;

/* -----------------------------------------------------
    Styled Components — Layout
----------------------------------------------------- */
const Wrapper = styled.main`
  min-height: calc(100vh - 70px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2.5rem 1.5rem;
  animation: ${fadeIn} 0.45s ease-out;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem 3.5rem;
  }
`;

const ProfileCard = styled.section`
  width: 100%;
  max-width: 720px;
  background: ${({ theme }) => theme.colors.card_bg};
  border-radius: 24px;
  padding: 2rem 2.4rem 2.4rem;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.16);
  animation: ${cardRise} 0.5s ease-out;

  @media (max-width: 768px) {
    padding: 1.6rem 1.4rem 2.2rem;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.4rem;
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

/* -----------------------------------------------------
    Avatar & Cropping
----------------------------------------------------- */
const AvatarWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  position: relative;
`;

const AvatarFrame = styled.div`
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 3px solid ${({ theme }) => theme.colors.primary};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 30% 20%, #ffffff, #dbeafe);
`;

const AvatarImage = styled.img<{ $zoom?: number }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(${({ $zoom = 1 }) => $zoom});
  transition: transform 0.2s ease-out;
`;

const EditAvatarButton = styled.label`
  position: absolute;
  bottom: 4px;
  right: calc(50% - 55px);
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  cursor: pointer;
  font-weight: 600;
`;

/* Cropping Modal */
const CropOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 6000;
`;

const CropCard = styled.div`
  background: ${({ theme }) => theme.colors.card_bg};
  border-radius: 20px;
  padding: 1.8rem 1.6rem 1.4rem;
  max-width: 420px;
  width: 92%;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.5);
`;

const CropTitle = styled.h2`
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
  text-align: center;
  color: ${({ theme }) => theme.colors.primary};
`;

const CropPreview = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

const CropSlider = styled.input.attrs({ type: "range" })`
  width: 100%;
  margin: 0.5rem 0 1rem;
`;

const CropActions = styled.div`
  display: flex;
  justify-content: center;
`;

/* -----------------------------------------------------
    Text & Messages
----------------------------------------------------- */
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
  border-radius: 16px;
  background: rgba(148, 163, 184, 0.07);
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

/* Pulsing Save Button */
const SaveButton = styled(ThemeButton)<{ $dirty?: boolean }>`
  ${({ $dirty }) =>
    $dirty &&
    css`
      animation: ${pulse} 1.4s ease-out infinite;
    `}
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
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [showCropper, setShowCropper] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

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
        setAvatarPreview(res.data.user.avatarUrl || UserIcon);
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  /* Input change */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setIsDirty(true);
  };

  /* Avatar upload — open cropper */
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    setAvatarZoom(1.1); // small zoom by default
    setShowCropper(true);
    setIsDirty(true);
  };

  const closeCropper = () => {
    setShowCropper(false);
  };

  /* Save profile (avatarUrl would normally be handled by backend upload) */
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
      setIsDirty(false);
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
      <ProfileCard>
        <Header>
          <BackButton onClick={() => navigate("/")}>
            <img src={BackIcon} alt="Go back" />
          </BackButton>
          <Title>Your Profile</Title>
        </Header>

        {/* Avatar */}
        <AvatarWrapper>
          <AvatarFrame>
            <AvatarImage
              src={avatarPreview || UserIcon}
              alt="avatar"
              $zoom={avatarZoom}
            />
          </AvatarFrame>
          <EditAvatarButton>
            Change
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleAvatarUpload}
            />
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

        {/* Action Buttons */}
        <ButtonRow>
          <SaveButton onClick={handleSave} disabled={saving || !isDirty} $dirty={isDirty}>
            {saving ? "Saving…" : isDirty ? "Save Changes" : "All Saved"}
          </SaveButton>

          <ThemeButton onClick={logout}>Logout</ThemeButton>
        </ButtonRow>
      </ProfileCard>

      {/* Simple “cropping” modal with zoom control */}
      {showCropper && avatarPreview && (
        <CropOverlay onClick={closeCropper}>
          <CropCard onClick={(e) => e.stopPropagation()}>
            <CropTitle>Adjust your avatar</CropTitle>

            <CropPreview>
              <AvatarFrame>
                <AvatarImage
                  src={avatarPreview}
                  alt="avatar preview"
                  $zoom={avatarZoom}
                />
              </AvatarFrame>
            </CropPreview>

            <CropSlider
              min={1}
              max={1.8}
              step={0.02}
              value={avatarZoom}
              onChange={(e) => setAvatarZoom(parseFloat(e.target.value))}
            />

            <CropActions>
              <ThemeButton onClick={closeCropper}>Looks good</ThemeButton>
            </CropActions>
          </CropCard>
        </CropOverlay>
      )}
    </Wrapper>
  );
};

export default ProfilePage;
