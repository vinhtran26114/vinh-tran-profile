import { Component, OnInit, Input } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-watermark',
  standalone: true,
  imports: [ CommonModule, NzIconModule ],
  templateUrl: './watermark.component.html',
  styleUrls: [ './watermark.component.scss' ]
})
export class WatermarkComponent implements OnInit {
  @Input() customIcon?: string;
  currentIcon = 'user';

  private readonly routeIconMap: { [key: string]: string } = {
    '': 'user',
    'experience': 'history',
    'skills': 'tool',
    'projects': 'project'
  };

  constructor(private router: Router) {}

  ngOnInit() {
    if (this.customIcon) {
      this.currentIcon = this.customIcon;
    } else {
      // Update icon when route changes
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        this.updateIcon();
      });

      // Set initial icon
      this.updateIcon();
    }
  }

  private updateIcon() {
    const currentRoute = this.router.url.split('/').pop() || '';
    this.currentIcon = this.routeIconMap[currentRoute] || 'user';
  }
}
