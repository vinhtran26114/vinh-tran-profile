import { Component, Input, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { TranslateModule } from '@ngx-translate/core';
import { WatermarkComponent } from '../watermark/watermark.component';

export interface CompanyExperience {
  company: string;
  companyInfo?: {
    description: string;
    address: string;
    website: string;
    contact?: string;
  };
  positions: Array<{
    position: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    location: string;
    type: string;
    responsibilities: string[];
    achievements: string[];
  }>;
}

@Component({
  selector: 'app-combined-experience-card',
  standalone: true,
  imports: [
    CommonModule,
    NzIconModule,
    NzTagModule,
    NzModalModule,
    TranslateModule,
    WatermarkComponent
  ],
  templateUrl: './combined-experience-card.component.html',
  styleUrls: ['./combined-experience-card.component.scss']
})
export class CombinedExperienceCardComponent {
  @Input() companyExperience!: CompanyExperience;
  @ViewChild('companyDetailDialog', { static: true }) companyDetailDialog!: TemplateRef<any>;
  
  private modalService = inject(NzModalService);

  openCompanyDialog(): void {
    this.modalService.create({
      nzContent: this.companyDetailDialog,
      nzFooter: null,
      nzWidth: '900px',
      nzClassName: 'company-detail-modal',
      nzCentered: true,
      nzMaskClosable: true
    });
  }

  getCompanyLogo(company: string): string {
    const filename = company.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${filename}.png`;
  }

  getTotalDuration(): string {
    const positions = this.companyExperience.positions;
    if (positions.length === 0) return '';
    
    const firstPosition = positions[positions.length - 1]; // Oldest position
    const lastPosition = positions[0]; // Newest position
    
    const startDate = firstPosition.startDate;
    const endDate = lastPosition.current ? 'Present' : lastPosition.endDate;
    
    return `${startDate} - ${endDate}`;
  }

  getCurrentPosition(): string {
    return this.companyExperience.positions[0]?.position || '';
  }
}
