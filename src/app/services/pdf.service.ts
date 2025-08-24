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
  private readonly AVATAR_SIZE = 130;
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
    yPos += this.SECTION_SPACING;

    // Add section header background
    pdf.setFillColor(colors.headerBg);
    pdf.rect(0, yPos - 12, this.A4_WIDTH, this.SECTION_HEADER_HEIGHT, 'F');

    // Add subtle border at the bottom of header
    pdf.setDrawColor(colors.accent);
    pdf.setLineWidth(1);

    // Add section title - translate if needed
    pdf.setFont('Candara', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(colors.primary);
    const translatedTitle = this.translateService.instant(title);
    pdf.text(translatedTitle, this.MARGIN, yPos + 10);

    return yPos + this.HEADER_SPACING;
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

    // Define colors - using dark brown theme
    const colors = {
      primary: '#4b5563',    // Dark brown
      text: '#1e293b',       // Dark text for readability
      link: '#6a3300',       // Light blue for links
      subtext: '#64748b',    // Medium gray for secondary text
      background: '#ffffff', // White background
      accent: '#fff5e9',    // Very light blue for accents/lines
      headerBg: '#fff5e9',   // Lighter blue background for section headers
      companyName: '#0f172a', // Near black for company names
      titleGrey: '#4b5563'   // Grey color for title/position
    };

    let yPos = this.MARGIN + 10;

    // Add header background with light blue color
    pdf.setFillColor(colors.headerBg);
    pdf.rect(0, 0, this.A4_WIDTH, this.MARGIN * 4.6, 'F');

    // Add subtle border at the bottom of header
    pdf.setDrawColor(colors.accent);
    pdf.setLineWidth(1);

    // Add name section
    // Add prefix
    pdf.setFont('Candara', 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor(colors.titleGrey);
    pdf.text('Mr.', this.MARGIN, yPos);
    const prefixWidth = pdf.getTextWidth('Mr. ');

    // Add name in caps with smaller font size
    pdf.setFont('Candara', 'bold');
    pdf.setFontSize(24); // Reduced from 32 to 24
    pdf.setTextColor(colors.primary);
    const name = (cv.personalInfo.name || '').toUpperCase();
    pdf.text(name, this.MARGIN + prefixWidth, yPos);

    // Add title with reduced spacing
    yPos += this.getLineHeight(24) * 0.7; // Adjusted line height to match new font size
    pdf.setFont('Candara', 'medium');
    pdf.setFontSize(16); // Smaller font for position
    pdf.setTextColor(colors.titleGrey);
    pdf.text(cv.personalInfo.title || '', this.MARGIN, yPos);

    // Add extra space after position
    yPos += 10;

    // Add avatar with border
    try {
      const avatarX = this.A4_WIDTH - this.MARGIN - this.AVATAR_SIZE;
      const avatarY = this.MARGIN;

      // Add white background for avatar
      pdf.setFillColor(255, 255, 255);
      pdf.rect(avatarX - 2, avatarY - 2, this.AVATAR_SIZE + 4, this.AVATAR_SIZE + 4, 'F');

      // Add border
      pdf.setDrawColor('#e6f4ff');
      pdf.setLineWidth(1);
      pdf.rect(avatarX - 2, avatarY - 2, this.AVATAR_SIZE + 4, this.AVATAR_SIZE + 4, 'S');

      const img = new Image();
      img.src = 'assets/images/avatar.jpeg';
      pdf.addImage(img, 'JPEG', avatarX, avatarY, this.AVATAR_SIZE, this.AVATAR_SIZE, undefined, 'NONE');
    } catch (error) {
      console.error('Error adding avatar:', error);
    }

    // Add contact info in single row layout with increased spacing
    yPos += this.getLineHeight(16) * 0.8; // Reduced space after position
    const contactStartY = yPos;
    let contactY = contactStartY;

    const lineSpacing = this.getLineHeight(11) * 1.5; // Increased line spacing

    // DOB
    pdf.setFont('Candara', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(colors.primary);
    pdf.text('Date of Birth:', this.MARGIN, contactY);
    pdf.setFont('Candara', 'normal');
    pdf.setTextColor(colors.text);
    pdf.text(cv.personalInfo.dateOfBirth || '', this.MARGIN + 80, contactY);

    // Phone
    contactY += lineSpacing;
    pdf.setFont('Candara', 'bold');
    pdf.setTextColor(colors.primary);
    pdf.text('Phone:', this.MARGIN, contactY);
    pdf.setFont('Candara', 'normal');
    pdf.setTextColor(colors.text);
    pdf.text(cv.personalInfo.contact.phone || '', this.MARGIN + 80, contactY);

    // Email
    contactY += lineSpacing;
    pdf.setFont('Candara', 'bold');
    pdf.setTextColor(colors.primary);
    pdf.text('Email:', this.MARGIN, contactY);
    pdf.setFont('Candara', 'normal');
    pdf.setTextColor(colors.link);
    const email = cv.personalInfo.contact.email || '';
    pdf.textWithLink(email, this.MARGIN + 80, contactY, {
      url: `mailto:${ email }`
    });

    // LinkedIn
    contactY += lineSpacing;
    pdf.setFont('Candara', 'bold');
    pdf.setTextColor(colors.primary);
    pdf.text('LinkedIn:', this.MARGIN, contactY);
    pdf.setFont('Candara', 'normal');
    pdf.setTextColor(colors.link);
    const linkedInUrl = cv.personalInfo.contact.linkedin || '';
    pdf.textWithLink(linkedInUrl, this.MARGIN + 80, contactY, {
      url: linkedInUrl
    });

    // Address
    contactY += lineSpacing;
    pdf.setFont('Candara', 'bold');
    pdf.setTextColor(colors.primary);
    pdf.text('Address:', this.MARGIN, contactY);
    pdf.setFont('Candara', 'normal');
    pdf.setTextColor(colors.text);
    const location = cv.personalInfo.location;
    const formattedLocation = location ? `${ location.city } - ${ location.country }` : '';
    pdf.text(formattedLocation, this.MARGIN + 80, contactY);

    // Add extra space after basic information
    contactY += 10;

    // Add summary content directly without header
    yPos = Math.max(contactY + this.getLineHeight(11) * 1.2, this.MARGIN + this.AVATAR_SIZE + this.SECTION_SPACING);

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

    // Second paragraph - first part of detailed summary
    if (cv.personalInfo.summary) {
      const summaryText = cv.personalInfo.summary;
      // Split the summary into sentences
      const sentences = summaryText.match(/[^.!?]+[.!?]+/g) || [];
      // Take roughly half of the sentences for the second paragraph
      const halfLength = Math.ceil(sentences.length / 2);
      const secondParagraph = sentences.slice(0, halfLength).join(' ').trim();

      const summaryLines = pdf.splitTextToSize(secondParagraph, this.CONTENT_WIDTH);
      summaryLines.forEach((line: string, index: number) => {
        pdf.text(line, this.MARGIN, yPos + (index * this.getLineHeight(14)));
      });
      yPos += (summaryLines.length - 1) * this.getLineHeight(12);
    }

    yPos += this.SUB_SECTION_SPACING;

    // Add Education Section
    yPos = this.addSectionHeader(pdf, 'Education', yPos, colors);

    if (cv.education?.education) {
      cv.education.education.forEach((edu, index) => {
        // Duration left-aligned
        const duration = `${ edu.startDate } - ${ edu.endDate }`;
        pdf.setFont('Candara', 'normal');
        pdf.setFontSize(14);
        pdf.setTextColor(colors.subtext);
        pdf.text(duration, this.MARGIN, yPos);

        // School/University name in blue, indented after duration
        const durationWidth = pdf.getTextWidth(duration);
        pdf.setFont('Candara', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(colors.primary);
        pdf.text(edu.institution, this.MARGIN + durationWidth + 15, yPos);

        // Degree and Field
        yPos += this.getLineHeight(14);
        pdf.setFont('Candara', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(colors.titleGrey);
        pdf.text(`${ edu.degree } in ${ edu.field }`, this.MARGIN + 15, yPos);

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

      // Duration left-aligned
      const duration = `${ exp.startDate } - ${ exp.endDate || 'Present' }`;
      pdf.setFont('Candara', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(colors.subtext);
      pdf.text(duration, this.MARGIN, yPos);

      // Company name in blue, larger font, indented after duration
      const durationWidth = pdf.getTextWidth(duration);
      pdf.setFont('Candara', 'bold');
      pdf.setFontSize(17);
      pdf.setTextColor(colors.primary);
      pdf.text(exp.company, this.MARGIN + durationWidth + 15, yPos);

      // Position right below company name
      yPos += this.getLineHeight(17);
      pdf.setFont('Candara', 'normal');
      pdf.setFontSize(14);
      pdf.setTextColor(colors.text);
      pdf.text(exp.position, this.MARGIN + durationWidth + 15, yPos);

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
        pdf.text('•', this.MARGIN + 5, yPos);

        // Add responsibility text with proper wrapping
        const lines = pdf.splitTextToSize(resp, this.CONTENT_WIDTH - 25);
        lines.forEach((line: string, lineIndex: number) => {
          // Check if we need a new page for the next line
          yPos = this.checkPageBreak(pdf, yPos + (lineIndex * this.getLineHeight(12)), this.getLineHeight(1));
          pdf.text(line, this.MARGIN + 15, yPos + (lineIndex * this.getLineHeight(1.5)));
        });

        yPos += 20;
      });

      // Add more spacing between experiences
      yPos -= 10;

      // Add a subtle separator line between experiences (except for the last one)
      if (index < cv.experience.workExperience.length - 1) {
        yPos += 5;
        pdf.setDrawColor(colors.accent);
        pdf.setLineWidth(1);
        pdf.line(this.MARGIN, yPos, this.A4_WIDTH - this.MARGIN, yPos);
        yPos += 25;
      }
    });

    // Add Skills section with page break check
    yPos = this.checkPageBreak(pdf, yPos, 150);
    yPos = this.addSectionHeader(pdf, 'Technical Skills', yPos, colors);

    // Create three columns for skills
    const columnWidth = (this.CONTENT_WIDTH - 40) / 3;
    let column1Y = yPos;
    let column2Y = yPos;
    let column3Y = yPos;
    let currentColumn = 0;

    Object.entries(cv.skills.technicalSkills).forEach(([ category, skills ]) => {
      let currentY: any;
      let startX: any;

      switch ( currentColumn ) {
        case 0:
          currentY = column1Y;
          startX = this.MARGIN;
          break;
        case 1:
          currentY = column2Y;
          startX = this.MARGIN + columnWidth + 20;
          break;
        case 2:
          currentY = column3Y;
          startX = this.MARGIN + (columnWidth + 20) * 2;
          break;
        default:
          currentY = yPos;
          startX = this.MARGIN;
      }

      // Check if we need a new page for this skill category
      if (currentColumn === 0) {
        currentY = this.checkPageBreak(pdf, currentY, 100);
        column1Y = column2Y = column3Y = currentY;
      }

      // Add category with translation
      pdf.setFont('Candara', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(colors.primary);
      const formatedCategory = this.formatCategory(category);
      pdf.text(formatedCategory, startX, currentY);

      // Add skills
      currentY += this.getLineHeight(18);
      pdf.setFont('Candara', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(colors.text);

      const skillLines = Array.isArray(skills) ? skills : [skills];

      skillLines.forEach((skill: string, index: number) => {
        pdf.text(skill, startX, currentY + (index * this.getLineHeight(14)));
      });

      const heightUsed = (skillLines.length * this.getLineHeight(14)) + 30;

      switch ( currentColumn ) {
        case 0:
          column1Y += heightUsed;
          break;
        case 1:
          column2Y += heightUsed;
          break;
        case 2:
          column3Y += heightUsed;
          break;
      }

      currentColumn = (currentColumn + 1) % 3;
    });

    yPos = Math.max(column1Y, column2Y, column3Y);

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

        // Duration left-aligned
        const duration = project.duration || '';
        pdf.setFont('Candara', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(colors.subtext);
        pdf.text(duration, this.MARGIN, yPos);

        // Project name in blue, indented after duration
        const durationWidth = pdf.getTextWidth(duration);
        pdf.setFont('Candara', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(colors.primary);
        pdf.text(project.name, this.MARGIN + durationWidth + 15, yPos);

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
