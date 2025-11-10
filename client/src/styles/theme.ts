// client/src/styles/theme.ts

/* eslint-disable @typescript-eslint/no-empty-object-type */
import "styled-components";

export const theme = {
  colors: {
    primary: "#21b2ba",
    secondary: "#31becc",
    thirdly: "#add6da",
    fourthly: "#c2d1d7",
    fifthly: "#0d6275",
    sixthly: "#e0f7f9",
    page_bg: "#c9e3e4",
    card_bg: "#fbffff",
    card_shadow: "0px 2px 6px rgba(0,0,0,0.08)",
    text_primary: "#2c2e2e",
    text_secondary: "#797979",
    high_risk: "#ff0004",
    high_risk_gradient: "linear-gradient(135deg, #ff0004 0%, #ff6467 100%)",
    medium_risk: "#f76e19",
    medium_risk_gradient: "linear-gradient(135deg, #f76e19 0%, #fbb56a 100%)",
    low_risk: "#22c55e",
    low_risk_gradient: "linear-gradient(135deg, #22c55e 0%, #a4e3b8 100%)"
  },
  spacing: (factor: number) => `${0.25 * factor}rem`,
  radius: {
    sm: "4px",
    md: "8px",
    lg: "16px"
  }
} as const;

export type AppTheme = typeof theme;

// 👇 Integrate strongly typed theme into styled-components
declare module "styled-components" {
  export interface DefaultTheme extends AppTheme {}
}
