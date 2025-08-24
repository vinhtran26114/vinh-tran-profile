import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { FormsModule } from '@angular/forms';
import { CVService } from '../../services/cv.service';
import { ProjectsPageProps } from './projects.types';
import { PROJECTS_PAGE_CONFIG } from './projects.constants';
import { Project } from '../../models/cv.models';
import { NzIconService } from 'ng-zorro-antd/icon';
import { SectionHeaderComponent } from '../../components/section-header/section-header.component';
import { ProjectDetailComponent } from '../../components/project-detail/project-detail.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ProjectCountComponent } from '../../components/project-count/project-count.component';

// Tag color mapping
const TAG_COLORS = {
  // Frontend
  'React': 'blue',
  'Angular': 'red',
  'Vue': 'green',
  'TypeScript': 'geekblue',
  'JavaScript': 'orange',
  'HTML': 'orange',
  'CSS': 'blue',
  'SCSS': 'pink',
  'Redux': 'purple',
  'Next.js': 'black',
  'Gatsby': 'purple',

  // Backend
  'Node.js': 'green',
  'ASP NET': 'green',
  'Python': 'blue',
  'Java': 'red',
  'Spring': 'green',
  'Express': 'black',
  'MongoDB': 'green',
  'PostgreSQL': 'blue',
  'MySQL': 'orange',
  'GraphQL': 'pink',
  'REST': 'cyan',

  // DevOps & Tools
  'Docker': 'blue',
  'Kubernetes': 'blue',
  'AWS': 'orange',
  'Azure': 'blue',
  'GCP': 'red',
  'Git': 'red',
  'Jenkins': 'red',
  'CircleCI': 'black',
  'Terraform': 'purple',

  // Mobile
  'React Native': 'blue',
  'Flutter': 'blue',
  'iOS': 'black',
  'Android': 'green',
  'Swift': 'orange',
  'Kotlin': 'purple',

  // Testing
  'Jest': 'red',
  'Cypress': 'black',
  'Selenium': 'green',
  'JUnit': 'red',
  'TestNG': 'green',

  // Default colors for scopes
  'Frontend': 'blue',
  'Backend': 'green',
  'Full Stack': 'purple',
  'DevOps': 'orange',
  'Mobile': 'cyan',
  'Design': 'pink',

  // Default colors for status
  'active': 'green',
  'completed': 'blue',
  'maintenance': 'orange'
} as const;

type TagColorType = typeof TAG_COLORS[keyof typeof TAG_COLORS];

// Technology icon mapping
const TECH_ICONS: Record<string, string> = {
  // Frontend
  'React': 'code-sandbox',
  'Angular': 'code-sandbox',
  'Vue': 'code-sandbox',
  'TypeScript': 'code',
  'JavaScript': 'code',
  'HTML': 'html5',
  'CSS': 'bg-colors',
  'SCSS': 'bg-colors',
  'Redux': 'cloud-sync',
  'Next.js': 'node-index',
  'Gatsby': 'node-index',

  // Backend
  'Node.js': 'code-sandbox',
  'ASP NET': 'windows',
  'Python': 'code',
  'Java': 'code',
  'Spring': 'cloud',
  'Express': 'api',
  'MongoDB': 'database',
  'PostgreSQL': 'database',
  'MySQL': 'database',
  'GraphQL': 'api',
  'REST': 'api',

  // DevOps & Tools
  'Docker': 'container',
  'Kubernetes': 'cluster',
  'AWS': 'cloud',
  'Azure': 'cloud',
  'GCP': 'cloud',
  'Git': 'branches',
  'Jenkins': 'build',
  'CircleCI': 'sync',
  'Terraform': 'cloud-server',

  // Mobile
  'React Native': 'mobile',
  'Flutter': 'mobile',
  'iOS': 'apple',
  'Android': 'android',
  'Swift': 'apple',
  'Kotlin': 'android',

  // Testing
  'Jest': 'experiment',
  'Cypress': 'experiment',
  'Selenium': 'bug',
  'JUnit': 'experiment',
  'TestNG': 'experiment',
};

type ViewType = 'grid' | 'list';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [
    CommonModule,
    NzIconModule,
    NzTagModule,
    FormsModule,
    SectionHeaderComponent,
    ProjectDetailComponent,
    TranslateModule,
    ProjectCountComponent
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsPageComponent {
  private readonly cvService = inject(CVService);
  private readonly iconService = inject(NzIconService);
  private readonly sanitizer = inject(DomSanitizer);

  constructor() {
    // No need to register icons as we're using built-in Ant Design icons
  }

  // Constants
  readonly config: ProjectsPageProps = PROJECTS_PAGE_CONFIG;

  // State
  readonly cv = this.cvService.cv;
  readonly projects = computed(() => this.cv()?.projects?.projects || []);

  // Filter state
  selectedTechnologies = signal<string[]>([]);
  selectedScopes = signal<string[]>([]);
  selectedStatuses = signal<string[]>([]);

  // View type and filter visibility state
  viewType = signal<ViewType>('grid');
  isFilterVisible = signal<boolean>(false);
  expandedProjects = signal<Set<string>>(new Set());

  // Search state
  searchText = signal<string>('');

  // Computed values for filter options
  readonly allTechnologies = computed(() => {
    const techs = new Set<string>();
    this.cv()?.projects?.projects.forEach(project => {
      project.technologies.forEach(tech => techs.add(tech));
    });
    return Array.from(techs).sort();
  });

  readonly allScopes = computed(() => {
    const scopes = new Set<string>();
    this.cv()?.projects?.projects.forEach(project => {
      if (project.scope) scopes.add(project.scope);
    });
    return Array.from(scopes).sort();
  });

  // Helper method to capitalize status
  capitalizeStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  readonly allStatuses = computed(() => {
    const statuses = new Set<string>();
    this.cv()?.projects?.projects.forEach(project => {
      if (project.status) statuses.add(project.status.toLowerCase());
    });
    return Array.from(statuses).sort().map(status => this.capitalizeStatus(status));
  });

  // Filtered projects
  readonly filteredProjects = computed(() => {
    const projects = this.cv()?.projects?.projects || [];
    const searchTerm = this.searchText().toLowerCase().trim();

    return projects.filter(project => {
      const matchesTech = this.selectedTechnologies().length === 0 ||
        project.technologies.some(tech => this.selectedTechnologies().includes(tech));

      const matchesScope = this.selectedScopes().length === 0 ||
        (project.scope && this.selectedScopes().includes(project.scope));

      const matchesStatus = this.selectedStatuses().length === 0 ||
        (project.status && this.selectedStatuses().includes(project.status.toLowerCase()));

      const matchesSearch = !searchTerm ||
        project.name.toLowerCase().includes(searchTerm) ||
        project.description.toLowerCase().includes(searchTerm) ||
        project.technologies.some(tech => tech.toLowerCase().includes(searchTerm)) ||
        (project.scope && project.scope.toLowerCase().includes(searchTerm)) ||
        (project.status && project.status.toLowerCase().includes(searchTerm)) ||
        (project.responsibilities && project.responsibilities.some(resp => resp.toLowerCase().includes(searchTerm)));

      return matchesTech && matchesScope && matchesStatus && matchesSearch;
    });
  });

  // Filter handlers
  toggleTechnologyFilter(tech: string): void {
    const current = this.selectedTechnologies();
    if (current.includes(tech)) {
      this.selectedTechnologies.set(current.filter(t => t !== tech));
    } else {
      this.selectedTechnologies.set([...current, tech]);
    }
  }

  toggleScopeFilter(scope: string): void {
    const current = this.selectedScopes();
    if (current.includes(scope)) {
      this.selectedScopes.set(current.filter(s => s !== scope));
    } else {
      this.selectedScopes.set([...current, scope]);
    }
  }

  toggleStatusFilter(status: string): void {
    const current = this.selectedStatuses();
    const statusLower = status.toLowerCase();
    if (current.includes(statusLower)) {
      this.selectedStatuses.set(current.filter(s => s !== statusLower));
    } else {
      this.selectedStatuses.set([...current, statusLower]);
    }
  }

  clearFilters(): void {
    this.selectedTechnologies.set([]);
    this.selectedScopes.set([]);
    this.selectedStatuses.set([]);
  }

  clearAllFilters(): void {
    this.clearFilters();
    this.searchText.set('');
  }

  // Helper methods to check if a filter is selected
  isTechnologySelected(tech: string): boolean {
    return this.selectedTechnologies().includes(tech);
  }

  isScopeSelected(scope: string): boolean {
    return this.selectedScopes().includes(scope);
  }

  isStatusSelected(status: string): boolean {
    return this.selectedStatuses().includes(status.toLowerCase());
  }

  // Helper method to get tag color based on selection state
  getTagColor(tag: string, type: 'technology' | 'scope' | 'status' = 'technology'): string {
    const isSelected = type === 'technology' ? this.isTechnologySelected(tag) :
                      type === 'scope' ? this.isScopeSelected(tag) :
                      this.isStatusSelected(tag);

    if (isSelected) {
      const baseColor = TAG_COLORS[tag.trim() as keyof typeof TAG_COLORS];
      // If we have a predefined color, use it; otherwise use 'processing' for selected state
      return baseColor || 'processing';
    }

    // Return 'default' for unselected state
    return 'default';
  }

  // Helper method to get technology icon
  getTechnologyIcon(tech: string): string {
    return TECH_ICONS[tech.trim()] || 'code';
  }

  // View type methods
  setViewType(type: ViewType): void {
    this.viewType.set(type);
    // Reset expanded state when switching views
    this.expandedProjects.set(new Set());
  }

  // Filter visibility methods
  toggleFilters(): void {
    this.isFilterVisible.update(visible => !visible);
  }

  getTotalFiltersCount(): number {
    return this.selectedTechnologies().length +
           this.selectedScopes().length +
           this.selectedStatuses().length;
  }

  // Project expansion methods
  toggleProjectExpansion(project: Project): void {
    const currentExpanded = this.expandedProjects();
    const newExpanded = new Set(currentExpanded);

    if (currentExpanded.has(project.name)) {
      newExpanded.delete(project.name);
    } else {
      newExpanded.add(project.name);
    }

    this.expandedProjects.set(newExpanded);
  }

  isProjectExpanded(project: Project): boolean {
    return this.expandedProjects().has(project.name);
  }
}
