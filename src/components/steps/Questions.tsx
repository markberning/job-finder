import { useState } from 'react';
import { useFormContext } from '../../context/FormContext';
import { generateMoreQuestions } from '../../services/api';
import { StepNavigation } from '../ui/StepNavigation';

export function Questions() {
  const { state, dispatch } = useFormContext();
  const [currentQ, setCurrentQ] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [noMoreQuestions, setNoMoreQuestions] = useState(false);

  const questions = state.data.aiQuestions;
  const question = questions[currentQ];
  const answer = question ? state.data.answers[question.id] : undefined;

  const hasAnswer =
    answer !== undefined &&
    answer !== '' &&
    (Array.isArray(answer) ? answer.length > 0 : true);

  const allAnswered = questions.length > 0 && currentQ >= questions.length - 1 && hasAnswer;

  function setAnswer(value: string | string[] | number) {
    if (!question) return;
    dispatch({
      type: 'SET_ANSWER',
      payload: { questionId: question.id, answer: value },
    });
  }

  function handleNext() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    }
  }

  function handleBack() {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    } else {
      dispatch({ type: 'SET_SCREEN', payload: 'intro' });
    }
  }

  async function handleGetMoreQuestions() {
    setLoadingMore(true);
    try {
      const more = await generateMoreQuestions(
        state.data.intro,
        questions,
        state.data.answers
      );
      if (more.length === 0) {
        setNoMoreQuestions(true);
      } else {
        dispatch({ type: 'ADD_MORE_QUESTIONS', payload: more });
        setCurrentQ(questions.length); // jump to first new question
      }
    } catch (err) {
      console.error('Failed to get more questions:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleSeeResults() {
    dispatch({ type: 'SET_SCREEN', payload: 'results' });
  }

  if (!question) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">Loading questions...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-2">
        <p className="text-sm text-stone-400">
          Question {currentQ + 1} of {questions.length}
        </p>
        <div className="w-full bg-stone-200 rounded-full h-1.5 mt-2">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="py-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-800 mb-6">
          {question.question}
        </h2>

        {question.type === 'multiple-choice' && question.options && (
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => setAnswer(option)}
                className={`w-full text-left px-5 py-3.5 rounded-lg border-2 transition-all ${
                  answer === option
                    ? 'border-primary bg-indigo-50 text-primary font-medium'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {question.type === 'true-false' && (
          <div className="flex gap-4">
            {['True', 'False'].map((option) => (
              <button
                key={option}
                onClick={() => setAnswer(option)}
                className={`flex-1 px-5 py-4 rounded-lg border-2 text-lg font-medium transition-all ${
                  answer === option
                    ? 'border-primary bg-indigo-50 text-primary'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {question.type === 'checkboxes' && question.options && (
          <div className="space-y-3">
            {question.options.map((option) => {
              const selected = Array.isArray(answer) ? answer.includes(option) : false;
              return (
                <button
                  key={option}
                  onClick={() => {
                    const current = Array.isArray(answer) ? answer : [];
                    setAnswer(
                      selected
                        ? current.filter((o) => o !== option)
                        : [...current, option]
                    );
                  }}
                  className={`w-full text-left px-5 py-3.5 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    selected
                      ? 'border-primary bg-indigo-50 text-primary font-medium'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      selected ? 'border-primary bg-primary' : 'border-stone-300'
                    }`}
                  >
                    {selected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'scale' && question.scaleLabels && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-stone-400 px-1">
              <span>{question.scaleLabels.low}</span>
              <span>{question.scaleLabels.high}</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setAnswer(n)}
                  className={`flex-1 py-4 rounded-lg border-2 text-lg font-semibold transition-all ${
                    answer === n
                      ? 'border-primary bg-indigo-50 text-primary'
                      : 'border-stone-200 hover:border-stone-300 text-stone-500'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {question.type === 'short-answer' && (
          <textarea
            value={(answer as string) || ''}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-colors resize-y text-stone-700"
          />
        )}
      </div>

      {/* Show results / more questions options when all answered */}
      {allAnswered && (
        <div className="space-y-3 mb-6">
          <button
            onClick={handleSeeResults}
            className="w-full px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            See my job suggestions
          </button>
          {!noMoreQuestions && (
            <button
              onClick={handleGetMoreQuestions}
              disabled={loadingMore}
              className="w-full px-6 py-3 border-2 border-stone-200 text-stone-600 font-medium rounded-lg hover:border-stone-300 transition-colors disabled:opacity-40"
            >
              {loadingMore
                ? 'Getting more questions...'
                : 'Answer more for better suggestions'}
            </button>
          )}
          {noMoreQuestions && (
            <p className="text-sm text-stone-400 text-center">
              We have enough to give you great suggestions!
            </p>
          )}
        </div>
      )}

      {/* Skip to results (available after answering at least 1 question) */}
      {!allAnswered && currentQ > 0 && (
        <div className="mb-4">
          <button
            onClick={handleSeeResults}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Skip ahead to results
          </button>
        </div>
      )}

      {!allAnswered && (
        <StepNavigation
          onBack={handleBack}
          onNext={handleNext}
          nextLabel="Next"
          nextDisabled={!hasAnswer}
        />
      )}

      {allAnswered && (
        <StepNavigation onBack={handleBack} />
      )}
    </div>
  );
}
