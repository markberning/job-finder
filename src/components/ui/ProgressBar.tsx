import type { AppScreen } from '../../types';

const screens: { key: AppScreen; label: string }[] = [
  { key: 'intro', label: 'About You' },
  { key: 'questions', label: 'Questions' },
  { key: 'results', label: 'Results' },
];

interface ProgressBarProps {
  currentScreen: AppScreen;
}

export function ProgressBar({ currentScreen }: ProgressBarProps) {
  const currentIndex = screens.findIndex((s) => s.key === currentScreen);

  return (
    <div className="w-full max-w-md mx-auto px-4 mb-8">
      <div className="flex items-center justify-between">
        {screens.map((screen, i) => (
          <div key={screen.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i <= currentIndex
                    ? 'bg-primary text-white'
                    : 'bg-stone-200 text-stone-400'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs mt-1 hidden sm:block ${
                  i <= currentIndex ? 'text-primary font-medium' : 'text-stone-400'
                }`}
              >
                {screen.label}
              </span>
            </div>
            {i < screens.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-colors ${
                  i < currentIndex ? 'bg-primary' : 'bg-stone-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
