// xl-util/menu-store.ts
import { MenuItem } from 'primeng/api';

// Тук ще се събират всички менюта
export const GLOBAL_MENU_STORE: MenuItem[] = [];

export function registerMenu(items: MenuItem[]) {
    GLOBAL_MENU_STORE.push(...items);
}
