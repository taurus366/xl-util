import { effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { SelectionService } from '../input_list/selectionService';
import { DialogService } from 'primeng/dynamicdialog';
import { getComponentByPath } from '../menu/route-store';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';

// export interface IDetailConfig {
//     save: string;
//     get?: string;
//     delete?: string;
// }

export abstract class BaseDetailCrud<T> {
    protected http = inject(HttpClient);
    protected selectionService = inject(SelectionService);
    private messageService = inject(MessageService);

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
            error: (err) => {
                this.isSaving.set(false)
                this.messageService.add({
                    severity: 'error',
                    summary: 'Грешка при зареждане',
                    detail: err.message || 'Сървърът не отговаря. Моля, опитайте по-късно.',
                    sticky: true // Съобщението стои, докато потребителят не го затвори
                });
            }
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

//     ROUTE OPEN PATH
    // Дефинираме сигнала
    public selectedFromLookup = signal<any>(null);
    protected constructor() {
        effect(() => {
            const item = this.selectionService.selectedItem();

            // ВАЖНО: Проверяваме item И дали диалогът е ВИДИМ в момента
            if (item && this.isVisible()) {
                console.log('Прилагане на избор:', item);
                this.handleLookupSelection(item);

                // ИЗЧИСТВАМЕ веднага, за да не се задейства пак при преначертаване
                this.selectionService.clear();
            }
        });
    }

    // Метод за изпращане на данни
    select(item: any) {
        this.selectedFromLookup.set(item);

        // Малък timeout за изчистване, за да не се задейства повторно при следващ избор
        setTimeout(() => this.selectedFromLookup.set(null), 100);
    }

    /**
     * Този метод може да бъде презаписан (override) в конкретния сървис
     * (напр. в UserDetailService), за да знаеш кое поле точно да попълниш.
     */
    protected handleLookupSelection(item: any) {
        const current = this.selectedItem();
        if (current) {
            // Пример: ако избираме адрес за потребителя
            // this.selectedItem.set({ ...current, address: item });
            console.log('BaseDetail прие избора:', item);
        }
    }

    protected dialogService = inject(DialogService);

    /**
     * Универсален метод за отваряне на лупичка чрез патове (Dart style)
     * @param routePath Пътят от registerRoute (напр. 'user/list')
     * @param target Целта (напр. 'MANAGER'), за да знаеш кое поле попълваш
     */
    async openLookup(routePath: string, header: string = 'Избор'): Promise<any> {
        const component = await getComponentByPath(routePath);

        if (!component) {
            console.error(`Компонентът за път "${routePath}" не е намерен!`);
            return;
        }

       const ref = this.dialogService.open(component, {
            header: header,
            width: '80%',
            data: {
                mode: 'lookup'
            }
        });
        return await firstValueFrom(ref!.onClose);
    }
}
