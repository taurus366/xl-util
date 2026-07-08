import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export const XL_BADGE_PROVIDER = new InjectionToken<Observable<Record<string, number>>>('XL_BADGE_PROVIDER');
