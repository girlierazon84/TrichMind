// client/src/pages/RegistrationPage.tsx

import styled from "styled-components";
import { RegisterPredictForm } from "@/components/RegisterPredictForm.tsx";


const RegistrationContainer = styled.main`
  padding: 2rem;
  background: ${({ theme }) => theme.colors.page_bg || "#c9e3e4"};
`;

export default function RegistrationPage() {
  return (
    <RegistrationContainer>
      <h1>Create Your Account</h1>
      <RegisterPredictForm />
    </RegistrationContainer>
  );
}
