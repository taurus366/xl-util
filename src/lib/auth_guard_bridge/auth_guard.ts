// libs/xl-util/src/index.ts
import { InjectionToken, Type } from '@angular/core';
import { CanActivate } from '@angular/router';

// Токен за класа на гарда
export const XL_AUTH_GUARD_TOKEN = new InjectionToken<Type<CanActivate>>('XL_AUTH_GUARD_TOKEN');
