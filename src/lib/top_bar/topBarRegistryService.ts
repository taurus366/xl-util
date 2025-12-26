import { Injectable, signal } from '@angular/core';

// xl-util
// Вече пазим обекти с име и компонент
const componentsToLoad = signal<{ name: string, component: any }[]>([]);

export function registerTopbarAction(component: any) {
    // Вземаме статичното име от класа
    const name = component.menuName;
    // Проверяваме дали името съществува и дали не е празен низ
    if (!name) {
        throw new Error(
            `[Topbar Error]: Component "${component.name}" must have a "static menuName" defined! ` +
            `Example: static menuName = 'user';`
        );
    }
    componentsToLoad.update(prev => [...prev, { name, component }]);
}

@Injectable({ providedIn: 'root' })
export class TopbarRegistryService {
    // 1. Главните бутони в лентата
    public actions = signal<any[]>([]);

    // 2. Речник за подменюта: { 'user': [tpl, tpl], 'settings': [tpl] }
    // Използваме Record<string, any[]>, за да можем да достъпваме по име
    public submenus = signal<Record<string, any[]>>({});

    public getComponentsToLoad() {
        return componentsToLoad;
    }

    // Регистрация на главен бутон
    registerTemplate(tpl: any) {
        this.actions.update(prev => {
            if (prev.includes(tpl)) return prev;
            return [...prev, tpl];
        });
    }

    removeTemplate(tpl: any) {
        this.actions.update(prev => prev.filter(item => item !== tpl));
    }

    // НОВИЯТ МЕТОД: Регистрация в конкретно подменю
    registerSubmenuAction(menuId: string, tpl: any) {
        this.submenus.update(prev => {
            const currentMenuActions = prev[menuId] || [];
            if (currentMenuActions.includes(tpl)) return prev;

            return {
                ...prev,
                [menuId]: [...currentMenuActions, tpl]
            };
        });
    }

    // Почистване на подменю при OnDestroy
    removeSubmenuAction(menuId: string, tpl: any) {
        this.submenus.update(prev => {
            if (!prev[menuId]) return prev;
            return {
                ...prev,
                [menuId]: prev[menuId].filter(item => item !== tpl)
            };
        });
    }
}
