import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TranslateModule } from '@ngx-translate/core';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { WatermarkComponent } from '../watermark/watermark.component';
import { WorkExperience } from '../../models/cv.models';

@Component({
  selector: 'app-experience-card',
  standalone: true,
  imports: [
    CommonModule,
    NzIconModule,
    TranslateModule,
    NzModalModule,
    NzTagModule,
    WatermarkComponent
  ],
  templateUrl: './experience-card.component.html',
  styleUrls: [ './experience-card.component.scss' ]
})
export class ExperienceCardComponent {
  @Input() experience!: WorkExperience;
  @ViewChild('companyDetailDialog') companyDetailDialog!: TemplateRef<any>;

  constructor(private modalService: NzModalService) {
  }

  getCompanyLogo(company: string): string {
    // Convert company name to lowercase and replace spaces/special chars with hyphens
    const filename = company.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace any non-alphanumeric chars with hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    return `${ filename }.png`;
  }

  openCompanyDialog(): void {
    this.modalService.create({
      nzTitle: '',
      nzContent: this.companyDetailDialog,
      nzFooter: null,
      nzWidth: 800,
      nzClassName: 'company-detail-modal',
      nzCentered: true,
      nzMaskClosable: true
    });
  }
}
