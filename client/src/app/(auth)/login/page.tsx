// client/src/app/(auth)/login/page.tsx

import LoginClient from "./LoginClient";


type Props = {
    searchParams?: { next?: string };
};

export default function LoginPage({ searchParams }: Props) {
    const redirectTo = searchParams?.next ?? "/home";
    return <LoginClient redirectTo={redirectTo} />;
}
