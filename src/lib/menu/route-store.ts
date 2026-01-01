import { Route, Router } from '@angular/router';

export const GLOBAL_ROUTE_STORE: Route[] = [];

export function registerRoute(routes: Route[]) {
    GLOBAL_ROUTE_STORE.push(...routes);
}

export async function getComponentByPath(path: string): Promise<any> {
    const route = GLOBAL_ROUTE_STORE.find(r => r.path === path);

    if (!route) return null;

    if (route.component) return route.component;

    if (route.loadComponent) {
        const loaded: any = await route.loadComponent();

        // В Angular 'loadComponent' може да върне:
        // 1. Директно класа (ако е default export)
        // 2. Обект { UserListComponent: ... }
        if (loaded.default) return loaded.default;

        // Търсим първия експортнат клас, който завършва на 'Component'
        const key = Object.keys(loaded).find(k => k.endsWith('Component'));
        return key ? loaded[key] : loaded;
    }

    return null;
}
