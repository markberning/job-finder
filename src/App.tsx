import { FormProvider, useFormContext } from './context/FormContext';
import { SavedJobsProvider, useSavedJobs } from './context/SavedJobsContext';
import { ProgressBar } from './components/ui/ProgressBar';
import { Intro } from './components/steps/Intro';
import { Questions } from './components/steps/Questions';
import { Results } from './components/steps/Results';
import { SavedJobs } from './components/steps/SavedJobs';

function NavBar() {
  const { state, dispatch } = useFormContext();
  const { savedJobs } = useSavedJobs();
  const { currentScreen } = state;

  const hasLastReport = !!state.lastReport;
  const hasSaved = savedJobs.length > 0;

  return (
    <nav className="flex justify-center gap-1 max-w-xl mx-auto px-4">
      <button
        onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'intro' })}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          currentScreen === 'intro'
            ? 'bg-primary text-white'
            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
        }`}
      >
        Home
      </button>
      <button
        onClick={() => hasLastReport && dispatch({ type: 'LOAD_LAST_REPORT' })}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          currentScreen === 'results'
            ? 'bg-primary text-white'
            : hasLastReport
              ? 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              : 'bg-stone-50 text-stone-300 cursor-default'
        }`}
      >
        Last results
      </button>
      <button
        onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'saved' })}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          currentScreen === 'saved'
            ? 'bg-primary text-white'
            : hasSaved
              ? 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              : 'bg-stone-50 text-stone-300 hover:bg-stone-100'
        }`}
      >
        Saved{hasSaved ? ` (${savedJobs.length})` : ''}
      </button>
    </nav>
  );
}

function AppContent() {
  const { state } = useFormContext();
  const { currentScreen } = state;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="pt-4 pb-2 px-4 space-y-3">
        <NavBar />
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
