import { useState } from 'react';
import { useFormContext } from '../../context/FormContext';
import type { AIQuestion } from '../../types';

function CheckboxOption({
  option,
  selected,
  onClick,
}: {
  option: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
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
}

function QuestionBlock({ question }: { question: AIQuestion }) {
  const { state, dispatch } = useFormContext();
  const answer = state.data.answers[question.id];
  const [otherText, setOtherText] = useState('');

  function setAnswer(value: string | string[] | number) {
    dispatch({
      type: 'SET_ANSWER',
      payload: { questionId: question.id, answer: value },
    });
  }

  if (question.type === 'checkboxes' && question.options) {
    const current = Array.isArray(answer) ? answer : [];
    const noneSelected = current.includes('None of these');
    const hasOther = current.some((o) => o.startsWith('Other: '));

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-800">{question.question}</h3>
        <div className="space-y-2">
          {question.options.map((option) => {
            const selected = current.includes(option);
            return (
              <CheckboxOption
                key={option}
                option={option}
                selected={selected}
                onClick={() => {
                  const filtered = current.filter((o) => o !== option && o !== 'None of these');
                  setAnswer(selected ? current.filter((o) => o !== option) : [...filtered, option]);
                }}
              />
            );
          })}

          {/* Other */}
          <div>
            <CheckboxOption
              option="Other"
              selected={hasOther}
              onClick={() => {
                if (hasOther) {
                  setAnswer(current.filter((o) => !o.startsWith('Other: ')));
                  setOtherText('');
                } else {
                  const filtered = current.filter((o) => o !== 'None of these');
                  setAnswer([...filtered, 'Other: ']);
                }
              }}
            />
            {hasOther && (
              <input
                type="text"
                value={otherText}
                onChange={(e) => {
                  setOtherText(e.target.value);
                  const withoutOther = current.filter((o) => !o.startsWith('Other: '));
                  setAnswer([...withoutOther, `Other: ${e.target.value}`]);
                }}
                placeholder="Tell us..."
                className="w-full mt-2 px-4 py-2.5 rounded-lg border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-colors text-stone-700"
              />
            )}
          </div>

          {/* None of these */}
          <CheckboxOption
            option="None of these"
            selected={noneSelected}
            onClick={() => {
              setAnswer(noneSelected ? [] : ['None of these']);
              setOtherText('');
            }}
          />
        </div>
      </div>
    );
  }

  if (question.type === 'short-answer') {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-800">{question.question}</h3>
        <textarea
          value={(answer as string) || ''}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-colors resize-y text-stone-700"
        />
      </div>
    );
  }

  return null;
}

export function Questions() {
  const { state, dispatch } = useFormContext();
  const questions = state.data.aiQuestions;

  // Check if at least one question has been answered
  const hasAnyAnswer = questions.some((q) => {
    const ans = state.data.answers[q.id];
    if (ans === undefined || ans === '') return false;
    if (Array.isArray(ans)) return ans.length > 0;
    return true;
  });

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">
          A few quick questions
        </h2>
        <p className="text-stone-500">
          Answer as many as you'd like — the more you answer, the better your results.
        </p>
      </div>

      {questions.map((question) => (
        <QuestionBlock key={question.id} question={question} />
      ))}

      <div className="space-y-3 pt-4">
        <button
          onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'results' })}
          disabled={!hasAnyAnswer}
          className="w-full px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          See my job suggestions
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'intro' })}
          className="w-full text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
