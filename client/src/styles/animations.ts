// client/src/styles/animations.ts

import { keyframes } from "styled-components";

/* Smooth fade in */
export const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

/* Slide in from bottom */
export const slideUp = keyframes`
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
`;

/* Slide in from right */
export const slideRight = keyframes`
    from { opacity: 0; transform: translateX(24px); }
    to { opacity: 1; transform: translateX(0); }
`;

/* Gentle scale pop */
export const scaleIn = keyframes`
    from { opacity: 0; transform: scale(0.93); }
    to { opacity: 1; transform: scale(1); }
`;
