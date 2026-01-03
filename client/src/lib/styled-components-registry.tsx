// client/src/lib/styled-components-registry.tsx

"use client";

import React, { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import {
    ServerStyleSheet,
    StyleSheetManager
} from "styled-components";


// This component sets up a styled-components registry for server-side rendering (SSR)
export default function StyledComponentsRegistry({
    children,
}: {
    children: React.ReactNode;
}) {
    // Create a ServerStyleSheet instance only once per request
    const [sheet] = useState(() => new ServerStyleSheet());

    // On the server, collect and inject the styles into the HTML
    useServerInsertedHTML(() => {
        // Get the styles from the sheet
        const styles = sheet.getStyleElement();
        sheet.instance.clearTag();
        return <>{styles}</>;
    });

    // On the client, simply render the children without the StyleSheetManager
    if (typeof window !== "undefined") return <>{children}</>;

    return (
        <StyleSheetManager sheet={sheet.instance}>
            {children}
        </StyleSheetManager>
    );
}
