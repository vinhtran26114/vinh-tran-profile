import { inject, Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { CVService } from './cv.service';
import { LanguageService } from './language.service';
import { addCandaraFont } from "./jspdf-font";
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private readonly cvService = inject(CVService);
  private readonly languageService = inject(LanguageService);
  private readonly translateService = inject(TranslateService);

  // A4 dimensions in points (72 points per inch)
  private readonly A4_WIDTH = 595.28;  // 8.27 × 72
  private readonly A4_HEIGHT = 841.89; // 11.69 × 72
  private readonly MARGIN = 42;
  private readonly CONTENT_WIDTH = this.A4_WIDTH - (this.MARGIN * 2);
  private readonly SECTION_SPACING = 20; // Space before section headers
  private readonly AVATAR_SIZE = 110;
  private readonly SUB_SECTION_SPACING = 15; // Space between items within sections
  private readonly SECTION_HEADER_HEIGHT = 32;
  private readonly HEADER_SPACING = this.SECTION_HEADER_HEIGHT + 12; // Space after section headers
  private readonly LABEL_WIDTH = 85; // Width for labels like "Technologies:", "Environment:", etc.
  private readonly PROJECT_LINE_HEIGHT = 1; // Add this new constant for project descriptions

  private setupPdfFonts(pdf: jsPDF): void {
    try {
      const currentLang = this.languageService.getCurrentLanguage();

      if (currentLang === 'vi') {
        // Setup Vietnamese font
        this.defineVietnameseFont(pdf);
        pdf.setFont('VNFont');

        // Enable Unicode encoding for Vietnamese characters
        (pdf as any).setLanguage("vi");
        (pdf as any).setR2L(false);
      } else {
        // For English, use Candara for now
        pdf.setFont('Candara');
      }

      pdf.setFontSize(12);
      pdf.setProperties({
        title: 'CV',
        subject: 'Curriculum Vitae',
        author: 'Vinh Tran',
        keywords: 'CV, Resume',
        creator: 'CV Generator'
      });
    } catch (error) {
      console.error('Error setting up font:', error);
      // Fallback to built-in font if custom font fails to load
      pdf.setFont('Helvetica');
    }
  }

  private defineVietnameseFont(pdf: jsPDF): void {
    // Add Vietnamese font definition
    pdf.addFileToVFS('VNFont.ttf', 'VN_TOKEN');
    pdf.addFont('VNFont.ttf', 'VNFont', 'normal');
  }

  private getLineHeight(fontSize: number, isProjectContent: boolean = false): number {
    return fontSize * (isProjectContent ? this.PROJECT_LINE_HEIGHT : 1.1);
  }

  private formatLocation(location: any): string {
    if (!location) return '';
    return `${ location.city }, ${ location.country }`;
  }

  private addSectionHeader(pdf: jsPDF, title: string, yPos: number, colors: any): number {
    // Minimal, elegant section header
    yPos += this.SECTION_SPACING;
    const translatedTitle = this.translateService.instant(title);

    // Accent bar on the left
    pdf.setFillColor('#1d4ed8');
    pdf.rect(this.MARGIN, yPos - 6, 4, 18, 'F');

    // Title
    pdf.setFont('Candara', 'bold');
    pdf.setFontSize(15);
    pdf.setTextColor(colors.primary);
    pdf.text(translatedTitle, this.MARGIN + 12, yPos + 6);

    // Hairline below
    pdf.setDrawColor(colors.accent);
    pdf.setLineWidth(0.6);
    pdf.line(this.MARGIN, yPos + 14, this.A4_WIDTH - this.MARGIN, yPos + 14);

    return yPos + 24; // compact spacing after header
  }

  private checkPageBreak(pdf: jsPDF, yPos: number, requiredSpace: number = 100): number {
    if (yPos + requiredSpace > this.A4_HEIGHT - this.MARGIN) {
      pdf.addPage();
      return this.MARGIN + 20;
    }
    return yPos;
  }

  async generateBeautifulPdf(): Promise<void> {
    const cv = this.cvService.cv();
    if (!cv) {
      throw new Error('CV data not available');
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true
    });


    addCandaraFont(pdf);

    // Setup fonts
    this.setupPdfFonts(pdf);

    // Define colors - professional blue theme
    const colors = {
      primary: '#0f172a',     // Heading color
      text: '#1f2937',        // Body text
      link: '#1d4ed8',        // Link blue
      subtext: '#64748b',     // Secondary text
      background: '#ffffff',  // White
      accent: '#e5e7eb',      // Light neutral separator
      headerBg: '#ffffff',    // Clean white header background
      companyName: '#0f172a',
      titleGrey: '#334155'
    };

    let yPos = this.MARGIN + 10;

    // Header background (clean white) + subtle bottom separator line
    pdf.setFillColor(colors.headerBg);
    pdf.rect(0, 0, this.A4_WIDTH, this.MARGIN * 3.8, 'F');
    pdf.setDrawColor(colors.accent);
    pdf.setLineWidth(0.6);
    pdf.line(this.MARGIN, this.MARGIN * 3.8, this.A4_WIDTH - this.MARGIN, this.MARGIN * 3.8);

    // Add subtle border at the bottom of header
    pdf.setDrawColor(colors.accent);
    pdf.setLineWidth(1);

    // Name & title
    const fullName = `${cv.personalInfo.prefix ? cv.personalInfo.prefix + ' ' : ''}${cv.personalInfo.name || ''}`.trim();
    pdf.setFont('Candara', 'bold');
    pdf.setFontSize(26);
    pdf.setTextColor(colors.primary);
    pdf.text(fullName, this.MARGIN, yPos);

    // Add title with reduced spacing
    yPos += this.getLineHeight(24) * 0.7; // Adjusted line height to match new font size
    pdf.setFont('Candara', 'medium');
    pdf.setFontSize(15);
    pdf.setTextColor(colors.titleGrey);
    pdf.text(cv.personalInfo.title || '', this.MARGIN, yPos);

    // Accent underline under name/title
    pdf.setDrawColor('#1d4ed8');
    pdf.setLineWidth(1);
    pdf.line(this.MARGIN, yPos + 6, this.MARGIN + 120, yPos + 6);

    // Quick tags (location, availability) under title
    yPos += 14;
    const tagPaddingX = 6;
    const tagPaddingY = 4;
    const tagGap = 6;
    let tagX = this.MARGIN;
    const tagY = yPos - 10;
    const renderTag = (text: string) => {
      if (!text) return;
      pdf.setFont('Candara', 'normal');
      pdf.setFontSize(10);
      const w = pdf.getTextWidth(text) + tagPaddingX * 2;
      const h = 16;
      pdf.setFillColor('#eef2ff'); // soft indigo bg
      // @ts-ignore
      (pdf as any).roundedRect(tagX, tagY, w, h, 6, 6, 'F');
      pdf.setTextColor('#1e3a8a');
      pdf.text(text, tagX + tagPaddingX, tagY + 11);
      tagX += w + tagGap;
      pdf.setTextColor(colors.subtext);
    };
    const loc = cv.personalInfo.location ? `${cv.personalInfo.location.city}, ${cv.personalInfo.location.country}` : '';
    const work = cv.personalInfo?.availability ? `${cv.personalInfo.availability.workType} • ${cv.personalInfo.availability.workLocation}` : '';
    renderTag(loc);
    renderTag(work);

    // Add extra space after position
    yPos += 10;

    // Add avatar with border
    try {
      // Slightly smaller avatar with a soft frame and subtle shadow
      const size = this.AVATAR_SIZE - 8;
      const avatarX = this.A4_WIDTH - this.MARGIN - size;
      const avatarY = this.MARGIN + 4;

      // Soft shadow (light gray behind)
      pdf.setFillColor('#f3f4f6');
      // roundedRect: x, y, w, h, rx, ry, style
      // @ts-ignore - jsPDF roundedRect exists at runtime
      (pdf as any).roundedRect(avatarX + 2, avatarY + 2, size, size, 10, 10, 'F');

      // Frame
      pdf.setFillColor(255, 255, 255);
      // @ts-ignore
      (pdf as any).roundedRect(avatarX, avatarY, size, size, 12, 12, 'F');
      pdf.setDrawColor(colors.accent);
      pdf.setLineWidth(0.8);
      // @ts-ignore
      (pdf as any).roundedRect(avatarX, avatarY, size, size, 12, 12, 'S');

      const img = new Image();
      img.src = 'assets/images/avatar.jpeg';
      pdf.addImage(img, 'JPEG', avatarX, avatarY, size, size, undefined, 'NONE');
    } catch (error) {
      console.error('Error adding avatar:', error);
    }

    // Contact line(s) to the left of avatar
    yPos += this.getLineHeight(16) * 0.8;
    const rightLimit = this.A4_WIDTH - this.MARGIN - this.AVATAR_SIZE - 16;
    const segments: Array<{ text: string; type: 'plain'|'link' }>= [];
    if (cv.personalInfo.dateOfBirth) segments.push({ text: String(cv.personalInfo.dateOfBirth), type: 'plain' });
    if (cv.personalInfo.contact?.phone) segments.push({ text: cv.personalInfo.contact.phone, type: 'plain' });
    if (cv.personalInfo.contact?.email) segments.push({ text: cv.personalInfo.contact.email, type: 'link' });
    if (cv.personalInfo.contact?.linkedin) segments.push({ text: 'LinkedIn', type: 'link' });
    const joiner = '  •  ';
    pdf.setFont('Candara', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(colors.subtext);
    let line1 = '';
    let line2 = '';
    segments.forEach((seg) => {
      const try1 = line1 ? line1 + joiner + seg.text : seg.text;
      if (!line1 || pdf.getTextWidth(try1) <= (rightLimit - this.MARGIN)) {
        line1 = try1;
      } else {
        line2 = line2 ? line2 + joiner + seg.text : seg.text;
      }
    });
    let cursorX = this.MARGIN;
    const renderLine = (textLine: string, y: number) => {
      if (!textLine) return;
      const parts = textLine.split(joiner);
      parts.forEach((p, i) => {
        const isEmail = p.includes('@');
        const isLinkedIn = p.toLowerCase().includes('linkedin');
        const width = pdf.getTextWidth(p);
        if (isEmail || isLinkedIn) {
          pdf.setTextColor(colors.link);
          pdf.textWithLink(p, cursorX, y, { url: isEmail ? `mailto:${p}` : (cv.personalInfo.contact.linkedin || '') });
          pdf.setTextColor(colors.subtext);
        } else {
          pdf.text(p, cursorX, y);
        }
        cursorX += width;
        if (i < parts.length - 1) {
          pdf.text('  •  ', cursorX, y);
          cursorX += pdf.getTextWidth('  •  ');
        }
      });
    };
    renderLine(line1, yPos);
    if (line2) {
      yPos += this.getLineHeight(11);
      cursorX = this.MARGIN;
      renderLine(line2, yPos);
    }

    // Move y below avatar area
    yPos = Math.max(yPos + this.getLineHeight(11) * 1.2, this.MARGIN + this.AVATAR_SIZE + this.SECTION_SPACING);

    yPos += 15;

    // Add summary content in two paragraphs
    pdf.setFont('Candara', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(colors.text);
    //
    // // First paragraph - short summary
    // if (cv.personalInfo.shortSummary) {
    //   const shortSummaryLines = pdf.splitTextToSize(cv.personalInfo.shortSummary || '', this.CONTENT_WIDTH);
    //   shortSummaryLines.forEach((line: string, index: number) => {
    //     pdf.text(line, this.MARGIN, yPos + (index * this.getLineHeight(14)));
    //   });
    //   yPos += shortSummaryLines.length * this.getLineHeight(12) + this.getLineHeight(12);
    // }

    // Summary paragraph
    if (cv.personalInfo.summary) {
      const summaryText = cv.personalInfo.summary;
      const summaryLines = pdf.splitTextToSize(summaryText, this.CONTENT_WIDTH);
      summaryLines.forEach((line: string, index: number) => {
        pdf.text(line, this.MARGIN, yPos + (index * this.getLineHeight(14)));
      });
      yPos += (summaryLines.length) * this.getLineHeight(12);
    }

    yPos += this.SUB_SECTION_SPACING;

    // Add Education Section
    yPos = this.addSectionHeader(pdf, 'Education', yPos, colors);

    if (cv.education?.education) {
      cv.education.education.forEach((edu, index) => {
        // Top row: Institution (left), Duration (right)
        const duration = `${ edu.startDate } - ${ edu.endDate }`;
        pdf.setFont('Candara', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(colors.primary);
        pdf.text(edu.institution, this.MARGIN, yPos);
        pdf.setFont('Candara', 'normal');
        pdf.setTextColor(colors.subtext);
        pdf.text(duration, this.A4_WIDTH - this.MARGIN, yPos, { align: 'right' });

        // Degree and Field
        yPos += this.getLineHeight(14);
        pdf.setFont('Candara', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(colors.titleGrey);
        pdf.text(`${ edu.degree } in ${ edu.field }`, this.MARGIN, yPos);

        // Add spacing between education items
        yPos += this.SUB_SECTION_SPACING;

        // Add a subtle separator line between education items (except for the last one)
        if (index < cv.education.education.length - 1) {
          pdf.setDrawColor(colors.accent);
          pdf.setLineWidth(0.5);
          pdf.line(this.MARGIN + 40, yPos - 10, this.A4_WIDTH - this.MARGIN - 40, yPos - 10);
        }
      });
    }

    // Add Experience section
    yPos = this.addSectionHeader(pdf, 'Experience', yPos, colors);

    // Add work experience entries
    cv.experience.workExperience.forEach((exp, index) => {
      // Check if we need a new page for this experience entry
      yPos = this.checkPageBreak(pdf, yPos, 150); // Estimated minimum space needed for an experience entry

      // Top row: Company (left), Duration (right)
      const duration = `${ exp.startDate } - ${ exp.endDate || 'Present' }`;
      pdf.setFont('Candara', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(colors.primary);
      pdf.text(exp.company, this.MARGIN, yPos);
      pdf.setFont('Candara', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(colors.subtext);
      pdf.text(duration, this.A4_WIDTH - this.MARGIN, yPos, { align: 'right' });

      // Position right below company name
      yPos += this.getLineHeight(17);
      pdf.setFont('Candara', 'normal');
      pdf.setFontSize(13);
      pdf.setTextColor(colors.text);
      pdf.text(exp.position, this.MARGIN, yPos);

      // Add some space before responsibilities
      yPos += this.getLineHeight(14) * 1.2;

      // Responsibilities with proper bullet points
      pdf.setFont('Candara', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(colors.text);

      exp.responsibilities.forEach((resp: string) => {
        // Check if we need a new page for this responsibility
        yPos = this.checkPageBreak(pdf, yPos, 50); // Estimated minimum space needed for a responsibility

        // Add bullet point with proper bullet character
        pdf.text('•', this.MARGIN + 4, yPos);

        // Add responsibility text with proper wrapping
        const lines = pdf.splitTextToSize(resp, this.CONTENT_WIDTH - 22);
        lines.forEach((line: string, lineIndex: number) => {
          // Check if we need a new page for the next line
          yPos = this.checkPageBreak(pdf, yPos + (lineIndex * this.getLineHeight(12)), this.getLineHeight(1));
          pdf.text(line, this.MARGIN + 12, yPos + (lineIndex * this.getLineHeight(1.5)));
        });

        yPos += 20;
      });

      // Add more spacing between experiences
      yPos -= 10;

      // Add a subtle separator line between experiences (except for the last one)
      if (index < cv.experience.workExperience.length - 1) {
        yPos += 5;
        pdf.setDrawColor(colors.accent);
        pdf.setLineWidth(0.6);
        pdf.line(this.MARGIN, yPos, this.A4_WIDTH - this.MARGIN, yPos);
        yPos += 25;
      }
    });

    // Add Skills section with page break check
    yPos = this.checkPageBreak(pdf, yPos, 150);
    yPos = this.addSectionHeader(pdf, 'Technical Skills', yPos, colors);

    // Create two columns for skills for better readability
    const columnWidth = (this.CONTENT_WIDTH - 20) / 2;
    let column1Y = yPos;
    let column2Y = yPos;
    let currentColumn = 0; // 0 left, 1 right

    Object.entries(cv.skills.technicalSkills).forEach(([ category, skills ]) => {
      let currentY: any;
      let startX: any;

      if (currentColumn === 0) {
        currentY = column1Y;
        startX = this.MARGIN;
      } else {
        currentY = column2Y;
        startX = this.MARGIN + columnWidth + 20;
      }

      // Check if we need a new page for this skill category
      if (currentColumn === 0) {
        currentY = this.checkPageBreak(pdf, currentY, 100);
        column1Y = column2Y = currentY;
      }

      // Add category with translation
      pdf.setFont('Candara', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(colors.primary);
      const formatedCategory = this.formatCategory(category);
      pdf.text(formatedCategory, startX, currentY);

      // Add skills
      currentY += this.getLineHeight(16);
      pdf.setFont('Candara', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(colors.text);

      const skillLines = Array.isArray(skills) ? skills : [skills];

      skillLines.forEach((skill: string, index: number) => {
        pdf.text('• ' + skill, startX, currentY + (index * this.getLineHeight(13)));
      });

      const heightUsed = (skillLines.length * this.getLineHeight(13)) + 26;

      if (currentColumn === 0) {
        column1Y += heightUsed;
        currentColumn = 1;
      } else {
        column2Y += heightUsed;
        currentColumn = 0;
      }
    });

    yPos = Math.max(column1Y, column2Y);

    // Add Projects Section with page break check
    yPos = this.checkPageBreak(pdf, yPos, 300);
    yPos = this.addSectionHeader(pdf, 'Projects', yPos, colors);

    if (cv.projects?.projects) {
      // Filter out projects marked with excludeFromPdf
      const includedProjects = cv.projects.projects
        .filter(project => !project.excludeFromPdf)

      includedProjects.reverse().forEach((project, index) => {
        // Check if we need a new page for this project
        yPos = this.checkPageBreak(pdf, yPos, 150);

        // Row: Project name (left), Duration (right)
        const duration = project.duration || '';
        pdf.setFont('Candara', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(colors.primary);
        pdf.text(project.name, this.MARGIN, yPos);
        pdf.setFont('Candara', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(colors.subtext);
        pdf.text(duration, this.A4_WIDTH - this.MARGIN, yPos, { align: 'right' });

        // Description
        if (project.description) {
          yPos += this.getLineHeight(12, true) + 4; // Use project line height
          yPos = this.checkPageBreak(pdf, yPos, 50);

          // Add bullet point with proper bullet character
          pdf.text('•', this.MARGIN + 5, yPos);

          pdf.setFont('Candara', 'normal');
          pdf.setFontSize(11);
          pdf.setTextColor(colors.text);
          const descLines = pdf.splitTextToSize(project.description, this.CONTENT_WIDTH - 10);
          descLines.forEach((line: string, lineIndex: number) => {
            yPos = this.checkPageBreak(pdf, yPos + ((lineIndex === 0? 0: 1) * this.getLineHeight(12, false)), this.getLineHeight(1));
            pdf.text(line, this.MARGIN + 15, yPos); // Use project line height
          });
          yPos += 20;
        }

        // Project details with consistent styling
        const detailSpacing = this.getLineHeight(6, true);
        // Technologies
        if (project.technologies?.length) {
          yPos += detailSpacing;
          yPos = this.checkPageBreak(pdf, yPos, 50);
          pdf.setFont('Candara', 'bold');
          pdf.setTextColor(colors.primary);
          const techLabel = this.translateService.instant('Technologies') + ':';
          pdf.text(techLabel, this.MARGIN, yPos); // Aligned with project name

          // Calculate where to start the technologies text
          const labelWidth = pdf.getTextWidth(techLabel);
          const techStartX = this.MARGIN + this.LABEL_WIDTH;

          pdf.setFont('Candara', 'normal');
          pdf.setTextColor(colors.text);
          const techText = project.technologies.join(', ');
          const techLines = pdf.splitTextToSize(techText, this.CONTENT_WIDTH - this.LABEL_WIDTH - 30);
          techLines.forEach((line: string, lineIndex: number) => {
            yPos = this.checkPageBreak(pdf, yPos + (lineIndex * this.getLineHeight(11, true)), this.getLineHeight(11, true));
            pdf.text(line, techStartX, yPos + (lineIndex * this.getLineHeight(1)));
          });
          yPos += 10;
        }

        // Environment
        if (project.environment?.length) {
          yPos += detailSpacing;
          yPos = this.checkPageBreak(pdf, yPos, 50);
          pdf.setFont('Candara', 'bold');
          pdf.setTextColor(colors.primary);
          const envLabel = this.translateService.instant('Environment') + ':';
          pdf.text(envLabel, this.MARGIN, yPos);

          const envStartX = this.MARGIN + this.LABEL_WIDTH;

          pdf.setFont('Candara', 'normal');
          pdf.setTextColor(colors.text);
          const envText = project.environment.join(', ');
          const envLines = pdf.splitTextToSize(envText, this.CONTENT_WIDTH - this.LABEL_WIDTH - 30);
          envLines.forEach((line: string, lineIndex: number) => {
            yPos = this.checkPageBreak(pdf, yPos + (lineIndex * this.getLineHeight(11, true)), this.getLineHeight(11, true));
            pdf.text(line, envStartX, yPos + (lineIndex * this.getLineHeight(1)));
          });
          yPos += 10;
        }

        // Role
        if (project.role) {
          yPos += detailSpacing;
          yPos = this.checkPageBreak(pdf, yPos, 50);
          pdf.setFont('Candara', 'bold');
          pdf.setTextColor(colors.primary);
          const roleLabel = this.translateService.instant('Role') + ':';
          pdf.text(roleLabel, this.MARGIN, yPos);

          const roleStartX = this.MARGIN + this.LABEL_WIDTH;

          pdf.setFont('Candara', 'normal');
          pdf.setTextColor(colors.text);
          const roleLines = pdf.splitTextToSize(project.role, this.CONTENT_WIDTH - this.LABEL_WIDTH - 30);
          roleLines.forEach((line: string, lineIndex: number) => {
            yPos = this.checkPageBreak(pdf, yPos + (lineIndex * this.getLineHeight(11, true)), this.getLineHeight(11, true));
            pdf.text(line, roleStartX, yPos + (lineIndex * this.getLineHeight(1)));
          });
          yPos += 10;

        }

        // Add spacing between projects
        yPos += 0;

        // Add a subtle separator line between projects (except for the last one)
        if (index < includedProjects.length - 1) {
          yPos += 5;
          pdf.setDrawColor(colors.accent);
          pdf.setLineWidth(1);
          pdf.line(this.MARGIN, yPos, this.A4_WIDTH - this.MARGIN, yPos);
          yPos += 20;
        }
      });
    }

    // Add centered text about additional projects
    yPos += 20;
    pdf.setFont('Candara', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(colors.subtext);
    const additionalProjectsText = 'There are additional projects not shown here.';
    const textWidth = pdf.getTextWidth(additionalProjectsText);
    pdf.text(additionalProjectsText, (this.A4_WIDTH - textWidth) / 2, yPos);
    yPos += 25;

    // Add footer with page numbers
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFont('Candara', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(colors.subtext);
      pdf.text(
        `Page ${ i } of ${ totalPages }`,
        this.A4_WIDTH / 2,
        this.A4_HEIGHT - 20,
        { align: 'center' }
      );
    }

    // Save the PDF
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `CV_${ cv.personalInfo.name.replace(/\s+/g, '_') }_${ timestamp }.pdf`;
    pdf.save(filename);
  }

  private formatCategory(category: string): string {
    return category
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
