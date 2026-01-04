// client/src/app/(auth)/login/page.tsx

import { Suspense } from "react";
import LoginClient from "./LoginClient";


type Props = {
    searchParams?: { next?: string };
};

export default function LoginPage({ searchParams }: Props) {
    const redirectTo = searchParams?.next ?? "/home";

    return (
        <Suspense fallback={null}>
            <LoginClient redirectTo={redirectTo} />
        </Suspense>
    );
}
