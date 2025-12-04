// client/src/pages/ProfilePage.tsx

import React, { useEffect, useState, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useAuth, useCopingStrategies } from "@/hooks";
import { axiosClient, authApi } from "@/services";
import { ThemeButton, FormInput } from "@/components";
import { BackIcon, UserIcon } from "@/assets/icons";


/**---------------
    Animations
------------------*/
const pageFade = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(91, 138, 255, 0.5); transform: translateY(0); }
  70%  { box-shadow: 0 0 0 12px rgba(91, 138, 255, 0); transform: translateY(-1px); }
  100% { box-shadow: 0 0 0 0 rgba(91, 138, 255, 0); transform: translateY(0); }
`;

/**----------------------
    Styled Components
-------------------------*/
const Wrapper = styled.main`
  margin: 2.5rem auto;
  padding: 2.2rem 2rem 2.5rem;
  animation: ${pageFade} 0.45s ease-out;
  max-width: 780px;
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
    transition: 0.2s ease;
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
  text-align: center;
`;

const AvatarWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.8rem;
  position: relative;
`;

const AvatarOuter = styled.div`
  width: 126px;
  height: 126px;
  border-radius: 50%;
  padding: 3px;
  background: radial-gradient(circle at 30% 0, #fff, transparent 55%),
    radial-gradient(circle at 80% 110%, rgba(140, 189, 255, 0.7), transparent 60%);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Avatar = styled.img`
  width: 116px;
  height: 116px;
  border-radius: 50%;
  object-fit: cover;          /* center by default */
`;

const EditAvatarButton = styled.label`
  position: absolute;
  bottom: 4px;
  right: calc(50% - 60px);
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  cursor: pointer;
  font-weight: 600;
`;

/* FORM SECTIONS */
const SectionRow = styled.div`
  display: grid;
  grid-template-columns: 1.3fr 1.1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
`;

const Section = styled.section`
  padding: 1.25rem;
`;

const SectionTitle = styled.h3`
  margin-bottom: 0.75rem;
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

const PrimarySaveButton = styled(ThemeButton)<{ $pulse?: boolean }>`
  ${({ $pulse }) =>
    $pulse &&
    css`
      animation: ${pulse} 1.6s ease-out infinite;
    `};
`;

// Secondary button variant
const SecondaryButton = styled(ThemeButton)`
  opacity: 0.8;
`;

// Loading text shown while auth/profile loads
const LoadingText = styled.div`
  padding: 1.5rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.primary};
`;

const PasswordMessage = styled.div<{ success?: boolean }>`
  margin-top: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  color: ${({ success, theme }) => (success ? "#0a7a3a" : theme.colors.primary)};
  background: ${({ success }) => (success ? "rgba(10,122,58,0.06)" : "transparent")};
`;

/* --------------- CROP MODAL ---------------- */
const CropOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 4500;
`;

const CropCard = styled.div`
  background: ${({ theme }) => theme.colors.card_bg};
  padding: 1.5rem;
  border-radius: 18px;
  width: 90%;
  max-width: 420px;
`;

const CropTitle = styled.h2`
  text-align: center;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
`;

const CropArea = styled.div`
  width: 220px;
  height: 220px;
  border-radius: 50%;
  margin: 0 auto 1.2rem;
  overflow: hidden;
  background: #000;

  display: flex;
  align-items: center;
  justify-content: center;

  img {
    user-select: none;
    pointer-events: none;
    will-change: transform;
  }
`;

const CropPreview = styled.img<{ $zoom: number }>`
  width: ${({ $zoom }) => $zoom * 100}%;
  height: ${({ $zoom }) => $zoom * 100}%;
  object-fit: cover;
`;

const SliderRow = styled.div`
  margin-bottom: 1.2rem;

  label {
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.9rem;
  }

  input[type="range"] {
    width: 100%;
  }
`;

const CropButtons = styled.div`
  display: flex;
  gap: 0.75rem;

  button {
    flex: 1;
  }
`;

/**--------------------
    Component Types
-----------------------*/
interface ExtendedUser {
  id: string;
  email: string;
  displayName?: string;
  age?: number;
  years_since_onset?: number;
  avatarUrl?: string;

  // Mirror backend fields used in /auth/me
  coping_worked?: string[];
  coping_not_worked?: string[];
}

/**--------------
    Component
-----------------*/
export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const {
    worked: copingWorked,
    notWorked: copingNotWorked,
    setFromBackend,
  } = useCopingStrategies();

  const [profile, setProfile] = useState<ExtendedUser | null>(null);
  const [initialProfile, setInitialProfile] = useState<ExtendedUser | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarSource, setAvatarSource] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showCropper, setShowCropper] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    axiosClient
      // ❗ axiosClient base is /api → use /auth/me
      .get<{ ok: boolean; user: ExtendedUser }>("/auth/me")
      .then((res) => {
        const user = res.data.user;
        setProfile(user);
        setInitialProfile(user);
        setAvatarPreview(user.avatarUrl || UserIcon);

        // Seed coping strategies hook from backend values
        setFromBackend(user.coping_worked, user.coping_not_worked);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, setFromBackend]);

  // Track if form has changed (profile-only; coping is auto-saved via hook)
  const hasChanges = useMemo(() => {
    if (!profile || !initialProfile) return false;
    return JSON.stringify(profile) !== JSON.stringify(initialProfile);
  }, [profile, initialProfile]);

  // Input change for profile numeric/string fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;

    const { name, value } = e.target;

    setProfile({
      ...profile,
      [name]:
        name === "age" || name === "years_since_onset"
          ? value === ""
            ? undefined
            : Number(value)
          : value,
    });
  };

  // Coping strategies inputs → shared hook (comma-separated lists)
  const handleCopingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsed = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (name === "coping_worked") {
      setFromBackend(parsed, copingNotWorked);
    } else if (name === "coping_not_worked") {
      setFromBackend(copingWorked, parsed);
    }
  };

  // Avatar upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      setAvatarSource(img);
      setZoom(1);
      setShowCropper(true);
    };
    img.src = URL.createObjectURL(file);
  };

  // Save avatar crop into avatarUrl (as smaller JPEG base64)
  const applyAvatarCrop = () => {
    if (!avatarSource) return;

    const canvas = document.createElement("canvas");
    const size = 220; // enough for 116px avatar and keeps payload small
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgW = avatarSource.width;
    const imgH = avatarSource.height;

    // Base scale so the smaller side fits the canvas (cover-style, centred)
    const baseScale = size / Math.min(imgW, imgH);
    const effectiveZoom = baseScale * zoom;

    const w = imgW * effectiveZoom;
    const h = imgH * effectiveZoom;
    const x = (size - w) / 2;
    const y = (size - h) / 2;

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarSource, x, y, w, h);

    // JPEG with moderate quality → smaller than PNG
    const url = canvas.toDataURL("image/jpeg", 0.85);
    setAvatarPreview(url);
    setProfile((p) => (p ? { ...p, avatarUrl: url } : p));
    setShowCropper(false);
  };

  // Save profile
  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      // Send profile plus coping arrays
      const payload = {
        ...profile,
        coping_worked: copingWorked,
        coping_not_worked: copingNotWorked,
      };

      const res = await axiosClient.patch<{ ok: boolean; user: ExtendedUser }>(
        // ❗ base /api + /users/profile
        "/users/profile",
        payload
      );
      setProfile(res.data.user);
      setInitialProfile(res.data.user);
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handlePasswordChange = async () => {
    setPasswordMsg(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordMsg("Passwords do not match.");
      return;
    }

    try {
      await authApi.changePassword({ oldPassword, newPassword });
      setPasswordSuccess(true);
      setPasswordMsg("Password updated!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordMsg("Incorrect old password.");
    }
  };

  // UI states
  if (!isAuthenticated) return <LoadingText>Please login…</LoadingText>;
  if (loading) return <LoadingText>Loading your profile…</LoadingText>;

  console.log("[Profile] Coping strategies in ProfilePage →", {
    copingWorked,
    copingNotWorked,
  });

  return (
    <>
      <Wrapper>
        <Header>
          <BackButton onClick={() => navigate("/")}>
            <img src={BackIcon} alt="Go back" />
          </BackButton>
          <Title>Your Profile</Title>
        </Header>

        {/* Avatar */}
        <AvatarWrapper>
          <AvatarOuter>
            <Avatar src={avatarPreview || UserIcon} alt="avatar" />
          </AvatarOuter>

          <EditAvatarButton>
            Change
            <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
          </EditAvatarButton>
        </AvatarWrapper>

        {/* FORM */}
        <SectionRow>
          <Section>
            <SectionTitle>Account</SectionTitle>

            <FormInput
              label="Email"
              name="email"
              value={profile?.email || ""}
              disabled
              onChange={() => {}}
            />

            <FormInput
              label="Display Name"
              name="displayName"
              value={profile?.displayName || ""}
              onChange={handleChange}
            />

            <SectionTitle>Details</SectionTitle>

            <FormInput
              label="Age"
              name="age"
              type="number"
              value={profile?.age ?? ""}
              onChange={handleChange}
            />

            <FormInput
              label="Years Since Onset"
              name="years_since_onset"
              type="number"
              value={profile?.years_since_onset ?? ""}
              onChange={handleChange}
            />

            <SectionTitle>Coping Strategies</SectionTitle>

            <FormInput
              label="Strategies that worked for you"
              name="coping_worked"
              placeholder="e.g. fidget toy, deep breathing, wearing gloves"
              value={copingWorked.join(", ")}
              onChange={handleCopingInputChange}
            />

            <FormInput
              label="Strategies that did not help"
              name="coping_not_worked"
              placeholder="e.g. journaling, stress ball"
              value={copingNotWorked.join(", ")}
              onChange={handleCopingInputChange}
            />
          </Section>

          <Section>
            <SectionTitle>Password</SectionTitle>

            <FormInput
              label="Old Password"
              name="old_password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />

            <FormInput
              label="New Password"
              name="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <FormInput
              label="Confirm Password"
              name="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <ThemeButton onClick={handlePasswordChange}>Update Password</ThemeButton>

            {passwordMsg && (
              <PasswordMessage success={passwordSuccess}>{passwordMsg}</PasswordMessage>
            )}
          </Section>
        </SectionRow>

        <ButtonRow>
          <PrimarySaveButton onClick={handleSave} $pulse={hasChanges}>
            {saving ? "Saving…" : hasChanges ? "Save Changes" : "Saved"}
          </PrimarySaveButton>

          <ThemeButton onClick={logout}>Logout</ThemeButton>
        </ButtonRow>
      </Wrapper>

      {/* Avatar Cropper */}
      {showCropper && avatarSource && (
        <CropOverlay>
          <CropCard>
            <CropTitle>Adjust your avatar</CropTitle>

            <CropArea>
              <CropPreview src={avatarSource.src} alt="crop" $zoom={zoom} />
            </CropArea>

            <SliderRow>
              <label>Zoom</label>
              <input
                type="range"
                title="range"
                min={1}
                max={2.4}
                step={0.02}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
              />
            </SliderRow>

            <CropButtons>
              <SecondaryButton onClick={() => setShowCropper(false)}>
                Cancel
              </SecondaryButton>

              <ThemeButton onClick={applyAvatarCrop}>Apply Avatar</ThemeButton>
            </CropButtons>
          </CropCard>
        </CropOverlay>
      )}
    </>
  );
};

export default ProfilePage;
