import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { LanguageService } from '../../services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { LANGUAGES, type Language } from '../../models/language.models';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzDropDownModule,
    TranslateModule
  ],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss']
})
export class LanguageSwitcherComponent {
  private readonly languageService = inject(LanguageService);
  protected readonly languages = LANGUAGES;

  getCurrentLanguage(): string {
    return this.languageService.getCurrentLanguage();
  }

  getCurrentLanguageFlag(): string {
    return this.languages.find(lang => lang.code === this.getCurrentLanguage())?.flag || '🌐';
  }

  switchLanguage(lang: Language): void {
    this.languageService.setLanguage(lang);
  }
} 