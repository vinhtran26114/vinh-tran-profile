import { AfterViewInit, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
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
    NzInputModule,
    NzSwitchModule,
    NzToolTipModule,
    NzButtonModule,
    FormsModule,
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
  private lastWords: WordCloudItem[] = [];
  private wordBoxes: Array<{ text: string; x: number; y: number; w: number; h: number; size: number; color: string }>= [];
  private deviceRatio = 1;

  config = {
    className: 'skills-page',
    maxWidth: 1200
  };

  protected readonly Object = Object;

  // UX state
  searchTerm = '';
  sortAlphabetically = false;
  expanded = new Set<string>();
  justCopied = false;
  hoveredSkill: string | null = null;

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
      this.attachCanvasInteractions();
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

    const rotateAngles = [0, 0, 0, 15, -15];
    const layout = cloud()
      .size([containerWidth, containerHeight])
      .words(words)
      .padding(5)
      .rotate(() => rotateAngles[Math.floor(Math.random() * rotateAngles.length)])
      .font('Arial')
      .fontSize(d => d.size!)
      .on('end', (words) => {
        this.lastWords = words as WordCloudItem[];
        this.drawWordCloud();
      });

    layout.start();
    this.wordCloudInitialized = true;
  }

  private computeCanvasSizing() {
    const canvas = this.wordCloudCanvas.nativeElement;
    const containerWidth = this.container.nativeElement.offsetWidth;
    const containerHeight = containerWidth; // Keep it square
    this.deviceRatio = (window.devicePixelRatio || 1);
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    canvas.width = Math.floor(containerWidth * this.deviceRatio);
    canvas.height = Math.floor(containerHeight * this.deviceRatio);
  }

  private drawWordCloud() {
    const canvas = this.wordCloudCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.computeCanvasSizing();
    const containerWidth = this.container.nativeElement.offsetWidth;
    const containerHeight = containerWidth;
    ctx.setTransform(this.deviceRatio, 0, 0, this.deviceRatio, 0, 0);

    // Clear canvas
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // Set text properties
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.wordBoxes = [];

    const query = this.searchTerm.trim().toLowerCase();

    this.lastWords.forEach(word => {
      const x = (word.x || 0) + containerWidth / 2;
      const y = (word.y || 0) + containerHeight / 2;
      ctx.font = `${word.size}px Arial`;
      const metrics = ctx.measureText(word.text);
      const w = metrics.width;
      const h = word.size; // rough approximation

      const isMatch = query ? word.text.toLowerCase().includes(query) : true;
      const isHovered = this.hoveredSkill && this.hoveredSkill === word.text;

      ctx.globalAlpha = isMatch ? 1 : 0.25;
      ctx.fillStyle = word.color;
      ctx.fillText(word.text, x, y);

      if (isHovered) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeText(word.text, x, y);
      }

      this.wordBoxes.push({ text: word.text, x: x - w / 2, y: y - h / 2, w, h, size: word.size!, color: word.color });
    });

    // Update cursor
    const over = this.hoveredSkill != null;
    canvas.style.cursor = over ? 'pointer' : 'default';
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

  // Filtering and sorting helpers
  getCategories(): string[] {
    const categories = Object.keys(this.cv()?.skills?.technicalSkills || {});
    return this.sortAlphabetically ? [...categories].sort((a, b) => this.formatCategory(a).localeCompare(this.formatCategory(b))) : categories;
  }

  getFilteredSkills(category: string): string[] {
    const skills: string[] = (this.cv()?.skills?.technicalSkills?.[category] as string[]) || [];
    const filtered = this.searchTerm.trim()
      ? skills.filter(s => s.toLowerCase().includes(this.searchTerm.toLowerCase()))
      : skills;
    return this.sortAlphabetically ? [...filtered].sort((a, b) => a.localeCompare(b)) : filtered;
  }

  hasAnyMatch(category: string): boolean {
    return this.getFilteredSkills(category).length > 0;
  }

  toggleCategory(category: string) {
    if (this.expanded.has(category)) this.expanded.delete(category);
    else this.expanded.add(category);
  }

  isExpanded(category: string): boolean {
    // Expand by default when no search; collapse to show matches when searching
    if (this.searchTerm.trim()) return true;
    return this.expanded.has(category);
  }

  highlight(skill: string): string {
    const q = this.searchTerm.trim();
    if (!q) return skill;
    const idx = skill.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return skill;
    const before = skill.slice(0, idx);
    const match = skill.slice(idx, idx + q.length);
    const after = skill.slice(idx + q.length);
    return `${before}<mark>${match}</mark>${after}`;
  }

  copyVisibleSkills() {
    const lines: string[] = [];
    this.getCategories().forEach(cat => {
      const items = this.getFilteredSkills(cat);
      if (items.length) {
        lines.push(`${this.formatCategory(cat)}: ${items.join(', ')}`);
      }
    });
    const text = lines.join('\n');
    if (navigator && (navigator as any).clipboard && (navigator as any).clipboard.writeText) {
      (navigator as any).clipboard.writeText(text).then(() => this.flashCopied());
    }
  }

  private flashCopied() {
    this.justCopied = true;
    setTimeout(() => (this.justCopied = false), 1500);
  }

  private attachCanvasInteractions() {
    const canvas = this.wordCloudCanvas?.nativeElement;
    if (!canvas) return;
    const getWordAt = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left);
      const y = (clientY - rect.top);
      // account for CSS size vs canvas pixels already handled by transform; we used CSS coords in boxes
      for (let i = this.wordBoxes.length - 1; i >= 0; i--) {
        const b = this.wordBoxes[i];
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.text;
      }
      return null;
    };
    canvas.addEventListener('mousemove', (e) => {
      const word = getWordAt(e.clientX, e.clientY);
      const next = word || null;
      if (next !== this.hoveredSkill) {
        this.hoveredSkill = next;
        this.drawWordCloud();
      }
    });
    canvas.addEventListener('mouseleave', () => {
      if (this.hoveredSkill) {
        this.hoveredSkill = null;
        this.drawWordCloud();
      }
    });
    canvas.addEventListener('click', (e) => {
      const word = getWordAt(e.clientX, e.clientY);
      if (word) {
        this.searchTerm = word;
        this.drawWordCloud();
        // Scroll right-side section into view
        const cat = this.findCategoryBySkill(word);
        if (cat) {
          const el = document.getElementById(`skill-cat-${cat}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          this.expanded.add(cat);
        }
      }
    });
  }

  onSearchChange(value: string) {
    this.searchTerm = value;
    if (this.wordCloudInitialized) this.drawWordCloud();
  }

  private findCategoryBySkill(skill: string): string | null {
    const tech = this.cv()?.skills?.technicalSkills || {};
    for (const key of Object.keys(tech)) {
      const arr = tech[key] as string[];
      if (arr && arr.some(s => s.toLowerCase() === skill.toLowerCase())) return key;
    }
    return null;
  }
}
