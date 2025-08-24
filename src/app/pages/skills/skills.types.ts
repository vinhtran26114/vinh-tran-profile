import { Skills } from '../../models/cv.models';

export interface SkillsPageProps {
  maxWidth: number;
  className: string;
}

export interface SkillsPageState {
  skills: Skills | undefined;
} 