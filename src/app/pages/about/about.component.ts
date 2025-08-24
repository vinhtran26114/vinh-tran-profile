import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonalInfoComponent } from '../../components/personal-info/personal-info.component';
import { CVService } from '../../services/cv.service';
import { AboutPageProps } from './about.types';
import { ABOUT_PAGE_CONFIG, ABOUT_PAGE_SECTIONS } from './about.constants';
import { SectionHeaderComponent } from '../../components/section-header/section-header.component';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule,
    PersonalInfoComponent,
    SectionHeaderComponent,
    NzIconModule
  ],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  private readonly cvService = inject(CVService);

  // Constants
  readonly config: AboutPageProps = ABOUT_PAGE_CONFIG;
  readonly sections = ABOUT_PAGE_SECTIONS;

  // State
  readonly cv = this.cvService.cv;

  // No header actions; PDF export stays in the global header
}
