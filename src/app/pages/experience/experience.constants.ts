import { ExperienceSection } from './experience.types';

export const EXPERIENCE_PAGE_CONFIG = {
  maxWidth: 1200,
  className: 'experience-page'
} as const;

export const EXPERIENCE_SECTIONS: ExperienceSection[] = [
  {
    id: 'education',
    title: 'SECTIONS.EDUCATION',
    icon: 'book'
  },
  {
    id: 'work',
    title: 'SECTIONS.WORK_EXPERIENCE.TITLE',
    icon: 'laptop'
  }
] as const;

export const TIMELINE_CONFIG = {
  mode: 'left',
  pending: false
} as const;
