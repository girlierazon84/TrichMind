// client/src/styles/styled.d.ts

import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      thirdly: string;
      fourthly: string;
      fifthly: string;
      sixthly: string;
      page_bg: string;
      card_bg: string;
      card_shadow: string;
      text_primary: string;
      text_secondary: string;
      high_risk: string;
      high_risk_gradient: string;
      medium_risk: string;
      medium_risk_gradient: string;
      low_risk: string;
      low_risk_gradient: string;
    };
    spacing: (factor: number) => string;
    radius: {
      sm: string;
      md: string;
      lg: string;
    };
  }
}
