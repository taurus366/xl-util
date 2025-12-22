import { inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

// export interface IDetailConfig {
//     save: string;
//     get?: string;
//     delete?: string;
// }

export abstract class BaseDetailCrud<T> {
    protected http = inject(HttpClient);

    selectedItem = signal<T | null>(null);
    isSaving = signal(false);
    loading = signal(false);

    // Този сигнал контролира дали диалогът е отворен или затворен
    isVisible = signal(false);

    public onSaveSuccess$ = new Subject<T>();

    abstract saveRoute: string;
    abstract getRoute: string;
    abstract deleteRoute: string;

    /** Зарежда данни и отваря диалога */
    // loadData(id: any) {
    //     this.loading.set(true);
    //     this.isVisible.set(true); // Показваме диалога (може да покаже лоудър вътре)
    //
    //     const url = this.endpoint.startsWith('/') ? this.endpoint : `/${this.endpoint}`;
    //     this.http.get<T>(`${url}/${id}`).subscribe({
    //         next: (data) => {
    //             this.selectedItem.set(data);
    //             this.loading.set(false);
    //         },
    //         error: () => {
    //             this.loading.set(false);
    //             this.closeDetail(); // Затваряме при грешка
    //         }
    //     });
    // }

    saveItem(item: T) {
        this.isSaving.set(true);
        // const id = (item as any).id;
        const url = this.saveRoute.startsWith('/') ? this.saveRoute : `/${this.saveRoute}`;

        // const request$ = id
            // ? this.http.put<T>(`${url}/${id}`, item)
            // : this.http.post<T>(`${url}`, item);

        const request$ =
            this.http.post<T>(`${url}`, item);

        request$.subscribe({
            next: (savedItem) => {
                this.isSaving.set(false);
                // this.onSaveSuccess(savedItem);
                this.onSaveSuccess$.next(savedItem);
                this.closeDetail(); // Автоматично затваряне след успех
            },
            error: () => this.isSaving.set(false)
        });
    }

    // protected onSaveSuccess(item: T) {}

    // --- UI Helpers, които контролират сигнала ---

    openCreateDialog() {
        this.selectedItem.set({} as T);
        this.isVisible.set(true);
    }

    openEditDialog(item: T) {
        this.selectedItem.set({ ...item });
        this.isVisible.set(true);
    }

    closeDetail() {
        this.isVisible.set(false);
        this.selectedItem.set(null);
        this.isSaving.set(false);
    }
}
