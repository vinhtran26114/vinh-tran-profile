import { PersonalInfo } from '../../models/cv.models';

export interface AboutPageState {
  personalInfo: PersonalInfo | undefined;
}

export interface AboutPageProps {
  maxWidth: number;
  className: string;
} 