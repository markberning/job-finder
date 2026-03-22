import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { FormData, FormAction, AppScreen, AIQuestion, AIJobSuggestion, IntroData } from '../types';

const LAST_REPORT_KEY = 'job-finder-last-report';

interface LastReport {
  intro: IntroData;
  results: AIJobSuggestion[];
}

function loadLastReport(): LastReport | null {
  try {
    const stored = localStorage.getItem(LAST_REPORT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveLastReport(intro: IntroData, results: AIJobSuggestion[]) {
  try {
    localStorage.setItem(LAST_REPORT_KEY, JSON.stringify({ intro, results }));
  } catch {
    // ignore storage errors
  }
}

interface FormState {
  data: FormData;
  currentScreen: AppScreen;
  loading: boolean;
  lastReport: LastReport | null;
}

const initialState: FormState = {
  data: {
    intro: {
      name: '',
      educationLevel: '',
      fieldOfStudy: '',
      dreamJob: '',
      location: '',
    },
    aiQuestions: [],
    answers: {},
    results: [],
  },
  currentScreen: 'intro',
  loading: false,
  lastReport: loadLastReport(),
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'UPDATE_INTRO':
      return {
        ...state,
        data: {
          ...state.data,
          intro: { ...state.data.intro, ...action.payload },
        },
      };
    case 'SET_AI_QUESTIONS':
      return {
        ...state,
        data: { ...state.data, aiQuestions: action.payload as AIQuestion[] },
      };
    case 'ADD_MORE_QUESTIONS':
      return {
        ...state,
        data: {
          ...state.data,
          aiQuestions: [...state.data.aiQuestions, ...(action.payload as AIQuestion[])],
        },
      };
    case 'SET_ANSWER':
      return {
        ...state,
        data: {
          ...state.data,
          answers: {
            ...state.data.answers,
            [action.payload.questionId]: action.payload.answer,
          },
        },
      };
    case 'SET_RESULTS': {
      const newResults = action.payload as AIJobSuggestion[];
      const newLastReport = newResults.length > 0
        ? { intro: state.data.intro, results: newResults }
        : state.lastReport;
      return {
        ...state,
        data: { ...state.data, results: newResults },
        lastReport: newLastReport,
      };
    }
    case 'SET_SCREEN':
      return { ...state, currentScreen: action.payload as AppScreen };
    case 'SET_LOADING':
      return { ...state, loading: action.payload as boolean };
    case 'CLEAR_ANSWERS':
      return {
        ...state,
        data: { ...state.data, answers: {}, aiQuestions: [], results: [] },
      };
    case 'LOAD_LAST_REPORT': {
      const report = state.lastReport;
      if (!report) return state;
      return {
        ...state,
        data: {
          ...state.data,
          intro: report.intro,
          results: report.results,
        },
        currentScreen: 'results',
      };
    }
    default:
      return state;
  }
}

const FormContext = createContext<{
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
} | null>(null);

export function FormProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(formReducer, initialState);

  // Save to localStorage whenever results change
  useEffect(() => {
    if (state.data.results.length > 0) {
      saveLastReport(state.data.intro, state.data.results);
      // Also update lastReport in state so it's available immediately
    }
  }, [state.data.results, state.data.intro]);

  return (
    <FormContext.Provider value={{ state, dispatch }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
}
