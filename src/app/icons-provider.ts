import { Provider } from '@angular/core';
import { NZ_ICONS, NzIconModule } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import * as AllIcons from '@ant-design/icons-angular/icons';

const icons: IconDefinition[] = Object.keys(AllIcons).map(key => (AllIcons as any)[key]);

export function provideNzIcons(): Provider[] {
    return [
        { provide: NZ_ICONS, useValue: icons }
    ];
} 