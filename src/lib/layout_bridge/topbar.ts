// libs/xl-util/src/index.ts
import { InjectionToken } from '@angular/core';

export interface TopBarConfig {
    name: string;
    logoUrl?: string;
    copyright?: string;
    logoStyle?: {[key: string]: string};
}

export const XL_TOPBAR_CONFIG = new InjectionToken<TopBarConfig>('XL_TOPBAR_CONFIG');
