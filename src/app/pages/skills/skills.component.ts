import { AfterViewInit, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { CVService } from '../../services/cv.service';
import { SectionHeaderComponent } from '../../components/section-header/section-header.component';
import cloud from 'd3-cloud';

interface WordCloudItem {
  text: string;
  size: number;
  color: string;
  x?: number;
  y?: number;
  rotate?: number;
}

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [
    CommonModule,
    NzIconModule,
    NzTagModule,
    NzDividerModule,
    SectionHeaderComponent
  ],
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss']
})
export class SkillsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('wordCloud') wordCloudCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('wordCloudContainer') container!: ElementRef<HTMLDivElement>;

  private readonly cvService = inject(CVService);
  cv = this.cvService.cv;
  private resizeObserver: ResizeObserver | null = null;
  private wordCloudInitialized = false;

  config = {
    className: 'skills-page',
    maxWidth: 1200
  };

  protected readonly Object = Object;

  // Calculate years of experience based on start date
  private calculateYearsOfExperience(startYear: number): string {
    const currentYear = new Date().getFullYear();
    const years = currentYear - startYear;
    return `${years}+ years`;
  }

  ngAfterViewInit() {
    // Wait for the next tick to ensure ViewChild references are available
    setTimeout(() => {
      this.setupResizeObserver();
      this.initWordCloud();
    }, 0);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private setupResizeObserver() {
    if (!this.container?.nativeElement) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      // Only reinitialize if we've already initialized once
      if (this.wordCloudInitialized) {
        this.initWordCloud();
      }
    });
    this.resizeObserver.observe(this.container.nativeElement);
  }

  private initWordCloud() {
    if (!this.container?.nativeElement || !this.wordCloudCanvas?.nativeElement) return;

    const containerWidth = this.container.nativeElement.offsetWidth;
    const containerHeight = containerWidth; // Make it square

    if (containerWidth === 0) return;

    const words = this.getAllSkills().map(skill => ({
      text: skill,
      size: this.getSkillSize(skill),
      color: this.getTagColor(skill)
    }));

    const layout = cloud()
      .size([containerWidth, containerHeight])
      .words(words)
      .padding(5)
      .rotate(() => 0)
      .font('Arial')
      .fontSize(d => d.size!)
      .on('end', (words) => this.drawWordCloud(words as WordCloudItem[]));

    layout.start();
    this.wordCloudInitialized = true;
  }

  private drawWordCloud(words: WordCloudItem[]) {
    const canvas = this.wordCloudCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = this.container.nativeElement.offsetWidth;
    const containerHeight = containerWidth; // Keep it square

    // Set canvas size
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Clear canvas
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // Set text properties
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw words
    words.forEach(word => {
      ctx.font = `${word.size}px Arial`;
      ctx.fillStyle = word.color;
      const x = (word.x || 0) + containerWidth / 2;
      const y = (word.y || 0) + containerHeight / 2;
      ctx.fillText(word.text, x, y);
    });
  }

  private getAllSkills(): string[] {
    const skills: string[] = [];
    const technicalSkills = this.cv()?.skills?.technicalSkills || {};

    Object.values(technicalSkills).forEach(categorySkills => {
      skills.push(...(categorySkills as string[]));
    });

    return skills;
  }

  private getSkillSize(skill: string): number {
    const experienceYears = parseInt(this.getSkillExperience(skill));
    if (isNaN(experienceYears)) return 16;
    return Math.max(16, Math.min(36, 16 + experienceYears * 4));
  }

  getTechnologyIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      frontEnd: 'layout',
      backEnd: 'api',
      database: 'database',
      devOps: 'cloud-server',
      tools: 'tool',
      languages: 'code',
      frameworks: 'cluster',
      testing: 'bug',
      mobile: 'mobile',
      cloud: 'cloud',
      other: 'appstore'
    };
    return iconMap[category] || 'code';
  }

  getTagColor(skill: string): string {
    const colorMap: { [key: string]: string } = {
      Angular: '#DD0031',
      'AngularJS': '#E23237',
      ReactJS: '#61DAFB',
      TypeScript: '#3178C6',
      JavaScript: '#F7DF1E',
      'HTML5': '#E34F26',
      'CSS': '#1572B6',
      'RxJS': '#B7178C',
      'NgRx': '#BA2BD2',
      'Chart.js': '#FF6384',
      'KendoUI': '#FF6358',
      'D3.js': '#F9A03C',
      'jQuery': '#0769AD',
      Git: '#F05032'
    };
    return colorMap[skill] || '#1890ff';
  }

  formatCategory(category: string): string {
    return category
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getSkillExperience(skill: string): string {
    const experienceMap: { [key: string]: string } = {
      'HTML5': this.calculateYearsOfExperience(2015),
      'CSS': this.calculateYearsOfExperience(2015),
      'JavaScript': this.calculateYearsOfExperience(2015),
      'Angular': this.calculateYearsOfExperience(2017),
      'AngularJS': '2 years',
      'ReactJS': '4+ years',
      'KendoUI': '1 year',
      'RxJS': '6+ years',
      'NgRx': '4+ years',
      'TypeScript': this.calculateYearsOfExperience(2017)
    };
    return experienceMap[skill] || '';
  }
}
