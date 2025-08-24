import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { CV } from '../models/cv.models';
import { LanguageService } from './language.service';

@Injectable({
  providedIn: 'root'
})
export class CVService {
  private readonly languageService = inject(LanguageService);
  private readonly http = inject(HttpClient);
  
  private cvData = signal<CV | null>(null);
  private loading = signal<boolean>(true);
  private error = signal<string | null>(null);

  constructor() {
    // Load initial CV data
    this.loadCV();

    // Subscribe to language changes
    this.languageService.language$.subscribe(() => {
      this.loadCV();
    });
  }

  get cv() { return this.cvData.asReadonly(); }
  get isLoading() { return this.loading.asReadonly(); }
  get hasError() { return this.error.asReadonly(); }

  loadCV() {
    this.loading.set(true);
    this.error.set(null);

    const lang = this.languageService.getCurrentLanguage();
    const langPrefix = lang === 'vi' ? '.vi' : '';

    forkJoin({
      personalInfo: this.http.get<any>(`assets/json/personal-info${langPrefix}.json`),
      experience: this.http.get<any>(`assets/json/experience${langPrefix}.json`),
      education: this.http.get<any>(`assets/json/education${langPrefix}.json`),
      skills: this.http.get<any>(`assets/json/skills${langPrefix}.json`),
      projects: this.http.get<any>(`assets/json/projects${langPrefix}.json`)
    }).subscribe({
      next: (data) => {
        this.cvData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading CV:', err);
        // If Vietnamese files not found, fallback to English
        if (lang === 'vi') {
          this.loadEnglishCV();
        } else {
          this.error.set('Failed to load CV data');
          this.loading.set(false);
        }
      }
    });
  }

  private loadEnglishCV() {
    forkJoin({
      personalInfo: this.http.get<any>('assets/json/personal-info.json'),
      experience: this.http.get<any>('assets/json/experience.json'),
      education: this.http.get<any>('assets/json/education.json'),
      skills: this.http.get<any>('assets/json/skills.json'),
      projects: this.http.get<any>('assets/json/projects.json')
    }).subscribe({
      next: (data) => {
        this.cvData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading English CV:', err);
        this.error.set('Failed to load CV data');
        this.loading.set(false);
      }
    });
  }
}
