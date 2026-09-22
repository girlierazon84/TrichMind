// client/src/app/(auth)/login/page.tsx

import LoginClient from "./LoginClient";


type LoginPageProps = {
    searchParams: Promise<{
        next?: string | string[];
    }>;
};

function getSafeRedirect(
    value: string | string[] | undefined
): string {
    const redirect =
        Array.isArray(value)
            ? value[0]
            : value;

    if (!redirect) {
        return "/home";
    }

    if (
        !redirect.startsWith("/") ||
        redirect.startsWith("//")
    ) {
        return "/home";
    }

    return redirect;
}

export default async function LoginPage({
    searchParams,
}: LoginPageProps) {
    const params = await searchParams;

    const redirectTo =
        getSafeRedirect(params.next);

    return (
        <LoginClient
            redirectTo={redirectTo}
        />
    );
}
