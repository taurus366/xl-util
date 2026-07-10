import { InjectionToken, Signal } from '@angular/core';

export const XL_BADGE_PROVIDER = new InjectionToken<Signal<Record<string, number>>>('XL_BADGE_PROVIDER');
