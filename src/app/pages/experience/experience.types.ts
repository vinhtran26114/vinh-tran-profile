import { WorkExperience, Education } from '../../models/cv.models';

export interface ExperiencePageState {
  workExperience: WorkExperience[] | undefined;
  education: Education[] | undefined;
}

export interface ExperiencePageProps {
  maxWidth: number;
  className: string;
}

export interface ExperienceSection {
  id: string;
  title: string;
  icon: string;
} 