// client/src/types/styled.d.ts
import 'styled-components';
import type { MOTIF } from '../theme';

type AppTheme = typeof MOTIF;

declare module 'styled-components' {
    export interface DefaultTheme extends AppTheme {}
}
