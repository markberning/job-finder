import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { FormData, FormAction, AppScreen, AIQuestion, AIJobSuggestion } from '../types';

interface FormState {
  data: FormData;
  currentScreen: AppScreen;
  loading: boolean;
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
    case 'SET_RESULTS':
      return {
        ...state,
        data: { ...state.data, results: action.payload as AIJobSuggestion[] },
      };
    case 'SET_SCREEN':
      return { ...state, currentScreen: action.payload as AppScreen };
    case 'SET_LOADING':
      return { ...state, loading: action.payload as boolean };
    case 'CLEAR_ANSWERS':
      return {
        ...state,
        data: { ...state.data, answers: {}, aiQuestions: [], results: [] },
      };
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
