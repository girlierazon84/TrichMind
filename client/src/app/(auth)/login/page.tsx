// client/src/app/(auth)/login/page.tsx

import { Suspense } from "react";
import styled from "styled-components";
import LoginClient from "./LoginClient";


const LoadingFallback = styled.div`
    padding: 24px;
`;

export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingFallback>Loading…</LoadingFallback>}>
            <LoginClient />
        </Suspense>
    );
}
