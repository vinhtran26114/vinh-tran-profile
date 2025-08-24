import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-project-count',
  standalone: true,
  imports: [CommonModule, NzIconModule, TranslateModule],
  templateUrl: './project-count.component.html',
  styleUrls: ['./project-count.component.scss']
})
export class ProjectCountComponent {
  @Input() filteredCount: number = 0;
  @Input() totalCount: number = 0;
} 