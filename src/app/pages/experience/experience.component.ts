import { Component, inject } from '@angular/core';
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
import { ExperienceCardComponent } from '../../components/experience-card/experience-card.component';
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
    ExperienceCardComponent,
    EducationCardComponent
  ],
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss']
})
export class ExperiencePageComponent {
  private readonly cvService = inject(CVService);

  // Constants
  readonly config: ExperiencePageProps = EXPERIENCE_PAGE_CONFIG;
  readonly sections = EXPERIENCE_SECTIONS;
  readonly timelineConfig = TIMELINE_CONFIG;

  // State
  readonly cv = this.cvService.cv;

  // Helper method to get company logo filename
  getCompanyLogo(company: string): string {
    // Convert company name to lowercase and replace spaces/special chars with hyphens
    const filename = company.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace any non-alphanumeric chars with hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    return `${filename}.png`;
  }
}
