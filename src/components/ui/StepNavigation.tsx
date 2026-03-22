interface StepNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}

export function StepNavigation({
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  showBack = true,
}: StepNavigationProps) {
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-stone-200">
      {showBack && onBack ? (
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-stone-500 hover:text-stone-700 font-medium transition-colors"
        >
          Back
        </button>
      ) : (
        <div />
      )}
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
