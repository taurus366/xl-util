import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';

@Component({
    selector: 'xl-language-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, Select],
    template: `
        <p-select
            [options]="languages"
            [(ngModel)]="selectedLanguage"
            optionLabel="name"
            (onChange)="changeLang($event.value.code)"
            class="w-full md:w-56"
            styleClass="border-none bg-transparent">

            <ng-template #selectedItem let-selectedOption>
                <div class="flex items-center gap-2" *ngIf="selectedOption">
                    <span [class]="'flag flag-' + (selectedOption.code === 'en' ? 'gb' : selectedOption.code)"></span>
                    <span>{{ selectedOption.name }}</span>
                </div>
            </ng-template>

            <ng-template #item let-lang>
                <div class="flex items-center gap-2">
                    <span [class]="'flag flag-' + (lang.code === 'en' ? 'gb' : lang.code)"></span>
                    <span>{{ lang.name }}</span>
                </div>
            </ng-template>
        </p-select>
    `
})
export class LanguageSelectorComponent implements OnInit {
    languages = [
        { name: 'Български', code: 'bg' },
        { name: 'English', code: 'en' }
    ];
    selectedLanguage: any;

    constructor(private translate: TranslateService) {}

    ngOnInit() {
        // Проверка за запазен език или език на браузъра
        const currentLang = localStorage.getItem('lang') || this.translate.getBrowserLang() || 'bg';
        this.selectedLanguage = this.languages.find((l) => l.code === currentLang) || this.languages[0];
        this.translate.use(this.selectedLanguage.code);
    }

    changeLang(code: string) {
        this.translate.use(code);
        localStorage.setItem('lang', code);
    }
}
