import { Project } from '../../models/cv.models';

export interface ProjectsPageProps {
  maxWidth: number;
  className: string;
}

export interface ProjectsPageState {
  projects: Project[] | undefined;
} 