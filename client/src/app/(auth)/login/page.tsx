// client/src/app/(auth)/login/page.tsx

import LoginClient from "./LoginClient";


type PageProps = {
    searchParams?: Record<string, string | string[] | undefined>;
};

function safeNext(nextValue: unknown) {
    // Avoid open-redirects; allow only internal paths
    if (typeof nextValue !== "string") return "/home";
    if (!nextValue.startsWith("/")) return "/home";
    return nextValue;
}

export default function LoginPage({ searchParams }: PageProps) {
    const redirectTo = safeNext(searchParams?.next);
    return <LoginClient redirectTo={redirectTo} />;
}
