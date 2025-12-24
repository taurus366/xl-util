import { Route, Router } from '@angular/router';

export const GLOBAL_ROUTE_STORE: Route[] = [];

export function registerRoute(routes: Route[]) {
    GLOBAL_ROUTE_STORE.push(...routes);
}
