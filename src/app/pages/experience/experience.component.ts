import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CVService } from '../../services/cv.service';
import { ExperiencePageProps } from './experience.types';
import {
  EXPERIENCE_PAGE_CONFIG,
  EXPERIENCE_SECTIONS,
  TIMELINE_CONFIG
} from './experience.constants';
import { SectionHeaderComponent } from '../../components/section-header/section-header.component';
import { TranslateModule } from '@ngx-translate/core';
import { CombinedExperienceCardComponent, CompanyExperience } from '../../components/combined-experience-card';
import { EducationCardComponent } from '../../components/education-card/education-card.component';

@Component({
  selector: 'app-experience-page',
  standalone: true,
  imports: [
    CommonModule,
    NzTimelineModule,
    NzIconModule,
    SectionHeaderComponent,
    TranslateModule,
    CombinedExperienceCardComponent,
    EducationCardComponent
  ],
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss']
})
export class ExperiencePageComponent {
  readonly cvService = inject(CVService);

  // Constants
  readonly config: ExperiencePageProps = EXPERIENCE_PAGE_CONFIG;
  readonly sections = EXPERIENCE_SECTIONS;
  readonly timelineConfig = TIMELINE_CONFIG;

  // State
  readonly cv = this.cvService.cv;

  // Group experiences by company - using computed for better performance
  readonly groupedExperiences = computed(() => {
    const experiences = this.cv()?.experience?.workExperience || [];
    const grouped = new Map<string, CompanyExperience>();

    experiences.forEach(exp => {
      if (!grouped.has(exp.company)) {
        grouped.set(exp.company, {
          company: exp.company,
          companyInfo: exp.companyInfo,
          positions: []
        });
      }

      const companyExp = grouped.get(exp.company)!;
      companyExp.positions.push({
        position: exp.position,
        startDate: exp.startDate,
        endDate: exp.endDate || '',
        current: exp.current,
        location: exp.location,
        type: exp.type,
        responsibilities: exp.responsibilities || [],
        achievements: exp.achievements || []
      });
    });

    // Sort positions within each company by date (newest first)
    grouped.forEach(companyExp => {
      companyExp.positions.sort((a, b) => {
        const dateA = new Date(a.startDate);
        const dateB = new Date(b.startDate);
        return dateB.getTime() - dateA.getTime();
      });
    });

    // Convert to array and sort companies by most recent position
    return Array.from(grouped.values()).sort((a, b) => {
      const dateA = new Date(a.positions[0].startDate);
      const dateB = new Date(b.positions[0].startDate);
      return dateB.getTime() - dateA.getTime();
    });
  });

  // Helper method to get company logo filename
  getCompanyLogo(company: string): string {
    // Convert company name to lowercase and replace spaces/special chars with hyphens
    const filename = company.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace any non-alphanumeric chars with hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    return `${filename}.png`;
  }
}
