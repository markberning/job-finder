export type EducationLevel =
  | ''
  | 'high-school'
  | 'some-college'
  | 'associates'
  | 'bachelors'
  | 'trade-vocational'
  | 'certificate'
  | 'military';

export const EDUCATION_LABELS: Record<Exclude<EducationLevel, ''>, string> = {
  'high-school': 'High School',
  'some-college': 'Some College',
  associates: "Associate's Degree",
  bachelors: "Bachelor's Degree",
  'trade-vocational': 'Trade / Vocational',
  certificate: 'Certificate Program',
  military: 'Military Training',
};

export type QuestionType = 'multiple-choice' | 'checkboxes' | 'true-false' | 'scale' | 'short-answer';

export interface AIQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  scaleLabels?: { low: string; high: string };
}

export interface AIJobSuggestion {
  title: string;
  whyFit: string;
  isUnexpected: boolean;
}

export interface CareerPath {
  id: string;
  name: string;
  description: string;
}

export interface IntroData {
  name: string;
  educationLevel: EducationLevel;
  fieldOfStudy: string;
  dreamJob: string;
  location: string;
}

export interface QuizAnswers {
  [questionId: string]: string | string[] | number;
}

export interface FormData {
  intro: IntroData;
  aiQuestions: AIQuestion[];
  answers: QuizAnswers;
  results: AIJobSuggestion[];
}

export type AppScreen = 'intro' | 'questions' | 'results' | 'saved';

export type FormAction =
  | { type: 'UPDATE_INTRO'; payload: Partial<IntroData> }
  | { type: 'SET_AI_QUESTIONS'; payload: AIQuestion[] }
  | { type: 'ADD_MORE_QUESTIONS'; payload: AIQuestion[] }
  | { type: 'SET_ANSWER'; payload: { questionId: string; answer: string | string[] | number } }
  | { type: 'SET_RESULTS'; payload: AIJobSuggestion[] }
  | { type: 'SET_SCREEN'; payload: AppScreen }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ANSWERS' }
  | { type: 'LOAD_LAST_REPORT' };
