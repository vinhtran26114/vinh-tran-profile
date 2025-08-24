import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { ExportPdfComponent } from '../export-pdf/export-pdf.component';
import { LanguageService } from '../../services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil, debounceTime, filter } from 'rxjs/operators';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzIconModule,
    NzButtonModule,
    LanguageSwitcherComponent,
    ExportPdfComponent,
    TranslateModule
  ],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private router = inject(Router);
  public languageService = inject(LanguageService);

  isMobile = window.innerWidth < 768;
  isMobileMenuOpen = false;

  navItems = [
    { path: '', label: 'NAV.ABOUT', icon: 'user', exact: true },
    { path: 'experience', label: 'NAV.EXPERIENCE', icon: 'history', exact: false },
    { path: 'skills', label: 'NAV.SKILLS', icon: 'tool', exact: false },
    { path: 'projects', label: 'NAV.PROJECTS', icon: 'project', exact: false }
  ];

  ngOnInit(): void {
    // Handle window resize
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(250),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isMobile = window.innerWidth < 768;
        if (!this.isMobile) {
          this.isMobileMenuOpen = false;
        }
      });

    // Close mobile menu on navigation
    this.router.events
      .pipe(
        filter(event => event.constructor.name === 'NavigationEnd'),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.closeMobileMenu();
        // Scroll to top on navigation
        window.scrollTo(0, 0);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
