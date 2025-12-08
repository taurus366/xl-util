import { signal } from '@angular/core';

export abstract class BaseCrud<T> {

    // SIGNALS вместо стандартни променливи
    items = signal<T[]>([]);
    selectedItem = signal<T | null>(null);

    // CRUD операции (имплементират се в service)
    abstract loadData(): void;
    abstract createItem(item: T): void;
    abstract updateItem(item: T): void;
    abstract deleteItem(item: T): void;
    abstract deleteAll(): void;

    // ---------- Общи UI helper-и ----------
    openCreateDialog() {
        this.selectedItem.set(null);
    }

    openEditDialog(item: T) {
        this.selectedItem.set({ ...item }); // копие!
    }

    saveItem(item: T) {
        if ((item as any).id) {
            this.updateItem(item);
        } else {
            this.createItem(item);
        }
    }

    // ---------- Локален state: helpers ----------
    setItems(list: T[]) {
        this.items.set(list);
    }

    addItem(item: T) {
        this.items.update((arr) => [...arr, item]);
    }

    updateLocalItem(item: T) {
        this.items.update((arr) => {
            const index = arr.findIndex(i => (i as any).id === (item as any).id);
            if (index >= 0) {
                arr[index] = item;
            }
            return [...arr];
        });
    }

    removeLocalItem(item: T) {
        this.items.update((arr) =>
            arr.filter(i => (i as any).id !== (item as any).id)
        );
    }
}
