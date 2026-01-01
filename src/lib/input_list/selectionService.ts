// selection.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SelectionService {
    // Сигнал, който държи избрания обект
    private _selectedItem = signal<any>(null);

    // Публичен сигнал за четене
    public selectedItem = this._selectedItem.asReadonly();

    // Метод за изпращане на данни
    select(item: any) {
        this._selectedItem.set(item);
        // След като го "вземем", може да искаме да го занулим веднага
        // за да е готов за следващия избор
        setTimeout(() => this._selectedItem.set(null), 100);
    }

    // Добавяме метод за ръчно изчистване
    clear() {
        this._selectedItem.set(null);
    }
}
