import { useFormContext } from '../../context/FormContext';
import { EDUCATION_LABELS } from '../../types';
import type { EducationLevel } from '../../types';
import { StepNavigation } from '../ui/StepNavigation';
import { generateQuestions } from '../../services/api';

export function Intro() {
  const { state, dispatch } = useFormContext();
  const { name, educationLevel, fieldOfStudy, dreamJob, location } = state.data.intro;

  const isValid =
    name.trim().length > 0 &&
    educationLevel !== '' &&
    dreamJob.trim().length > 0 &&
    location.trim().length > 0;

  async function handleNext() {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ANSWERS' });
    try {
      const questions = await generateQuestions(state.data.intro);
      dispatch({ type: 'SET_AI_QUESTIONS', payload: questions });
      dispatch({ type: 'SET_SCREEN', payload: 'questions' });
    } catch (err) {
      console.error('Failed to generate questions:', err);
      alert('Something went wrong generating your questions. Please try again.');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-2">
          Let's find your next job
        </h1>
        <p className="text-stone-500 text-lg">
          Tell us a little about yourself and what you're looking for.
        </p>
      </div>

      <button
        onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'saved' })}
        className="w-full px-4 py-2.5 rounded-lg border border-dashed border-indigo-300 text-indigo-600 font-medium text-sm hover:bg-indigo-50 transition-colors text-center"
      >
        Have a share code? Tap here to enter it
      </button>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1">
          What's your name? <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => dispatch({ type: 'UPDATE_INTRO', payload: { name: e.target.value } })}
          placeholder="First name is fine"
          className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-colors"
        />
      </div>

      <div>
        <label htmlFor="education" className="block text-sm font-medium text-stone-700 mb-1">
          Education / training <span className="text-red-400">*</span>
        </label>
        <select
          id="education"
          value={educationLevel}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_INTRO',
              payload: { educationLevel: e.target.value as EducationLevel },
            })
          }
          className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-colors bg-white"
        >
          <option value="">Select one...</option>
          {Object.entries(EDUCATION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="field" className="block text-sm font-medium text-stone-700 mb-1">
          What did you study or train in?{' '}
          <span className="text-stone-400 font-normal">(optional)</span>
        </label>
        <input
          id="field"
          type="text"
          value={fieldOfStudy}
          onChange={(e) =>
            dispatch({ type: 'UPDATE_INTRO', payload: { fieldOfStudy: e.target.value } })
          }
          placeholder="e.g. Criminal Justice, Culinary Arts, Welding..."
          className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-colors"
        />
      </div>

      <div>
        <label htmlFor="dream" className="block text-sm font-medium text-stone-700 mb-1">
          What's your dream job or career area? <span className="text-red-400">*</span>
        </label>
        <p className="text-sm text-stone-400 mb-2">
          It's okay if you're not sure — just tell us what interests you. "I want to help crime
          victims" or "I love baking" works great.
        </p>
        <textarea
          id="dream"
          value={dreamJob}
          onChange={(e) =>
            dispatch({ type: 'UPDATE_INTRO', payload: { dreamJob: e.target.value } })
          }
          placeholder="Tell us what kind of work excites you..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-colors resize-y"
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-stone-700 mb-1">
          Where are you looking for work? <span className="text-red-400">*</span>
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) =>
            dispatch({ type: 'UPDATE_INTRO', payload: { location: e.target.value } })
          }
          placeholder="City or zip code"
          className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-colors"
        />
      </div>

      <StepNavigation
        showBack={false}
        onNext={handleNext}
        nextLabel={state.loading ? 'Thinking...' : "Let's go"}
        nextDisabled={!isValid || state.loading}
      />
    </div>
  );
}
