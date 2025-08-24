import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { PersonalInfo } from '../../models/cv.models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [
    CommonModule, 
    NzIconModule, 
    NzTypographyModule, 
    NzTagModule,
    NzModalModule,
    NzToolTipModule,
    NzButtonModule,
    TranslateModule
  ],
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.scss']
})
export class PersonalInfoComponent {
  @Input() info?: PersonalInfo;
  copiedEmail = false;
  copiedPhone = false;

  constructor(private modalService: NzModalService) {}

  showFullscreenAvatar(): void {
    this.modalService.create({
      nzContent: `<div class="fullscreen-avatar">
        <img src="assets/images/avatar.jpeg" alt="Profile Picture">
      </div>`,
      nzFooter: null,
      nzClosable: true,
      nzCentered: true,
      nzWidth: '100%',
      nzWrapClassName: 'avatar-modal',
      nzStyle: { 
        top: '0',
        padding: '0',
        maxWidth: '100vw',
        margin: '0'
      },
      nzBodyStyle: {
        padding: '0',
        background: 'transparent'
      },
      nzMaskClosable: true,
      nzKeyboard: true
    });
  }

  copyToClipboard(text: string, kind: 'email' | 'phone') {
    if (!text) return;
    if (navigator && (navigator as any).clipboard && (navigator as any).clipboard.writeText) {
      (navigator as any).clipboard.writeText(text).then(() => {
        if (kind === 'email') {
          this.copiedEmail = true;
          setTimeout(() => (this.copiedEmail = false), 1500);
        } else {
          this.copiedPhone = true;
          setTimeout(() => (this.copiedPhone = false), 1500);
        }
      });
    }
  }
} 
