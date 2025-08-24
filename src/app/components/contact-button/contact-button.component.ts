import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PersonalInfo } from '../../models/cv.models';
import { CVService } from '../../services/cv.service';

@Component({
  selector: 'app-contact-button',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  templateUrl: './contact-button.component.html',
  styleUrls: ['./contact-button.component.scss']
})
export class ContactButtonComponent implements OnInit, OnDestroy {
  public cvService = inject(CVService);
  info: PersonalInfo | undefined;
  isMobile = false;
  isShaking = false;
  private shakeInterval: any;
  private shakeTimeout: any;

  ngOnInit() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.setupShakeAnimation();
  }

  ngOnDestroy() {
    this.clearTimers();
  }

  private clearTimers() {
    if (this.shakeInterval) {
      clearInterval(this.shakeInterval);
    }
    if (this.shakeTimeout) {
      clearTimeout(this.shakeTimeout);
    }
  }

  private setupShakeAnimation() {
    // Shake every 10 seconds
    this.shakeInterval = setInterval(() => {
      this.startShake();
    }, 10000);
  }

  private startShake() {
    if (!this.isShaking) {
      this.isShaking = true;
      this.shakeTimeout = setTimeout(() => {
        this.isShaking = false;
      }, 1000);
    }
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    if (!this.isShaking) {
      this.startShake();
    }
  }

  getIconType(): string {
    return 'send';
  }

  getTooltipText(): string {
    return 'Chat with me';
  }

  contact() {
    const linkedinUrl = this.cvService.cv()?.personalInfo?.contact?.linkedin;
    if (linkedinUrl) {
      window.open(linkedinUrl, '_blank');
    }
  }
}
