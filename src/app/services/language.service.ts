import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly translateService = inject(TranslateService);
  private currentLanguage = new BehaviorSubject<string>('en');
  language$ = this.currentLanguage.asObservable();

  constructor() {
    // Try to get language from localStorage
    const savedLang = localStorage.getItem('language');
    const browserLang = navigator.language.toLowerCase();
    
    // Set initial language
    let initialLang = 'en';
    if (savedLang && (savedLang === 'en' || savedLang === 'vi')) {
      initialLang = savedLang;
    } else if (browserLang.startsWith('vi')) {
      initialLang = 'vi';
    }

    // Initialize translation service
    this.translateService.setDefaultLang('en');
    this.setLanguage(initialLang);
  }

  getCurrentLanguage(): string {
    return this.currentLanguage.value;
  }

  setLanguage(lang: string): void {
    this.currentLanguage.next(lang);
    this.translateService.use(lang);
    localStorage.setItem('language', lang);
  }
} 