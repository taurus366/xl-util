import { inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SelectionService } from '../input_list/selectionService';

export interface ICrudDetailService<T> {
    onSaveSuccess$: Subject<T>;
    // тук можеш да добавиш и други общи неща като isVisible, selectedItem и т.н.
}

export abstract class BaseListCrud<T> {

    constructor(protected detailService: ICrudDetailService<T>) {
        this.detailService.onSaveSuccess$
            .pipe(takeUntilDestroyed())
        .subscribe(() => {
            this.loadList(this.lastFirst, this.lastRows, this.lastFilters);
        })
    }


    protected selectionService = inject(SelectionService);
    /**
     * Универсален метод за избор
     */
    public selectItem(item: T) {
        if (!item) return;

        // Пращаме обекта към "пощенската кутия"
        this.selectionService.select(item);

        // Ако списъкът е отворен в PrimeNG DynamicDialog, тук можеш да го затвориш
        // if (this.ref) this.ref.close(item);
    }


    // Инжектираме HttpClient тук, за да не го пишеш във всеки наследник
    protected http = inject(HttpClient);

    // Данни за таблицата
    items = signal<T[]>([]);
    totalRecords = signal(0);
    loading = signal(false);

    // Всеки сървис ще дефинира основния си път (напр. 'users/list')
    abstract listRoute: string;


    public lastFirst = 0;
    public lastRows = 10;
    public lastFilters: any = null;
    /**
     * Зарежда списъка от бекенда.
     * @param first Индекс на първия запис
     * @param rows Брой записи на страница
     * @param filters Филтри от PrimeNG таблицата
     */
    loadList(first: number, rows: number, filters?: any) {
        this.lastFirst = first;
        this.lastRows = rows;
        this.lastFilters = filters;

        this.loading.set(true);

        // Вече ползваме само и единствено endpoint на класа
        const path = this.listRoute;

        // Гарантираме, че пътят започва с / за интерцептора
        const url = path.startsWith('/') ? path : `/${path}`;

        const params: any = {
            page: (first / rows).toString(),
            size: rows.toString()
        };

        // Ако имаш филтри от PrimeNG, те ще влязат тук
        // Можеш да ги добавиш към params, ако бекендът ги очаква
        // if (filters) {
        //     // Пример: params.filters = JSON.stringify(filters);
        // }

        this.http.get<any>(url, { params }).subscribe({
            next: (res) => {
                const data = res.content || res;

                // Проверяваме всички възможни места за totalElements
                let total = data.length;

                if (res.page && res.page.totalElements !== undefined) {
                    // Форматът, който получаваш в момента (Spring Boot 3 / HATEOAS)
                    total = res.page.totalElements;
                } else if (res.totalElements !== undefined) {
                    // Стандартният формат на Spring Page
                    total = res.totalElements;
                }

                this.setItems(data, total);
            },
            error: (err) => {
                console.error(`Грешка при зареждане на ${url}:`, err);
                this.loading.set(false);
            }
        });
    }

    /**
     * Изтриване - автоматично ползва базовия endpoint
     */
    deleteItem(id: any) {
        const url = this.listRoute.startsWith('/') ? this.listRoute : `/${this.listRoute}`;
        return this.http.delete(`${url}/${id}`).subscribe(() => {
            this.removeLocalItem(id);
        });
    }

    // ---------- Хелпъри (остават същите) ----------

    setItems(list: T[], total: number) {
        this.items.set(list);
        this.totalRecords.set(total);
        this.loading.set(false);
    }

    removeLocalItem(id: any) {
        this.items.update((arr) => arr.filter(i => (i as any).id !== id));
        this.totalRecords.update((n) => n - 1);
    }

    // ... Lookup логиката си остава същата ...
}
