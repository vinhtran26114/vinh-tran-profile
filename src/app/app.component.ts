import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslateModule],
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit {
  private readonly languageService = inject(LanguageService);

  ngOnInit() {
    // Subscribe to language changes
    this.languageService.language$.subscribe(lang => {
      // Set the lang attribute on the root element
      document.documentElement.setAttribute('lang', lang);
    });
  }
}
