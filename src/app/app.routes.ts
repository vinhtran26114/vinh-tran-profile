import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AboutComponent } from './pages/about/about.component';
import { ExperiencePageComponent } from './pages/experience/experience.component';
import { SkillsComponent } from './pages/skills/skills.component';
import { ProjectsPageComponent } from './pages/projects/projects.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: AboutComponent },
      { path: 'experience', component: ExperiencePageComponent },
      { path: 'skills', component: SkillsComponent },
      { path: 'projects', component: ProjectsPageComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
