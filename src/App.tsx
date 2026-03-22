import { FormProvider, useFormContext } from './context/FormContext';
import { SavedJobsProvider, useSavedJobs } from './context/SavedJobsContext';
import { ProgressBar } from './components/ui/ProgressBar';
import { Intro } from './components/steps/Intro';
import { Questions } from './components/steps/Questions';
import { Results } from './components/steps/Results';
import { SavedJobs } from './components/steps/SavedJobs';

function AppContent() {
  const { state, dispatch } = useFormContext();
  const { savedJobs } = useSavedJobs();
  const { currentScreen } = state;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header with saved jobs button */}
      <header className="pt-4 pb-2 px-4">
        <div className="flex justify-end max-w-xl mx-auto mb-2">
          {currentScreen !== 'saved' && savedJobs.length > 0 && (
            <button
              onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'saved' })}
              className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors"
            >
              Saved jobs ({savedJobs.length})
            </button>
          )}
        </div>
        {currentScreen !== 'saved' && (
          <ProgressBar currentScreen={currentScreen} />
        )}
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-4 pb-12">
        {currentScreen === 'intro' && <Intro />}
        {currentScreen === 'questions' && <Questions />}
        {currentScreen === 'results' && <Results />}
        {currentScreen === 'saved' && <SavedJobs />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <FormProvider>
      <SavedJobsProvider>
        <AppContent />
      </SavedJobsProvider>
    </FormProvider>
  );
}
