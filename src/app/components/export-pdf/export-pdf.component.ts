import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateModule } from '@ngx-translate/core';
import { PdfService } from '../../services/pdf.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-export-pdf',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzToolTipModule,
    TranslateModule
  ],
  templateUrl: './export-pdf.component.html',
  styleUrls: ['./export-pdf.component.scss']
})
export class ExportPdfComponent {
  private pdfService = inject(PdfService);
  private messageService = inject(NzMessageService);
  public languageService = inject(LanguageService);

  isExporting = false;

  async exportToPDF(): Promise<void> {
    try {
      this.isExporting = true;
      await this.pdfService.generateBeautifulPdf();
      this.messageService.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      this.messageService.error('Failed to export PDF');
    } finally {
      this.isExporting = false;
    }
  }
} 