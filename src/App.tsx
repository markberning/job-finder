import { FormProvider, useFormContext } from './context/FormContext';
import { ProgressBar } from './components/ui/ProgressBar';
import { Intro } from './components/steps/Intro';
import { Questions } from './components/steps/Questions';
import { Results } from './components/steps/Results';

function AppContent() {
  const { state } = useFormContext();
  const { currentScreen } = state;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="pt-6 pb-2 px-4">
        <ProgressBar currentScreen={currentScreen} />
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-4 pb-12">
        {currentScreen === 'intro' && <Intro />}
        {currentScreen === 'questions' && <Questions />}
        {currentScreen === 'results' && <Results />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <FormProvider>
      <AppContent />
    </FormProvider>
  );
}
