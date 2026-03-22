import { useEffect, useState } from 'react';
import { useFormContext } from '../../context/FormContext';
import { generateResults, generateAdjacentResults, buildSearchLinks } from '../../services/api';

export function Results() {
  const { state, dispatch } = useFormContext();
  const { intro, aiQuestions, answers, results } = state.data;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adjacentJobs, setAdjacentJobs] = useState<typeof results>([]);
  const [loadingAdjacent, setLoadingAdjacent] = useState(false);

  useEffect(() => {
    if (results.length > 0) return;

    async function fetchResults() {
      setLoading(true);
      setError('');
      try {
        const suggestions = await generateResults(intro, aiQuestions, answers);
        dispatch({ type: 'SET_RESULTS', payload: suggestions });
      } catch (err) {
        console.error('Failed to generate results:', err);
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const expectedJobs = results.filter((r) => !r.isUnexpected);
  const surpriseJobs = results.filter((r) => r.isUnexpected);

  async function handleExploreAdjacent() {
    setLoadingAdjacent(true);
    try {
      const previousTitles = results.map((r) => r.title);
      const adjacent = await generateAdjacentResults(intro, aiQuestions, answers, previousTitles);
      setAdjacentJobs(adjacent);
    } catch (err) {
      console.error('Failed to generate adjacent results:', err);
    } finally {
      setLoadingAdjacent(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="inline-block w-8 h-8 border-4 border-stone-200 border-t-primary rounded-full animate-spin" />
        <p className="text-stone-500 text-lg">
          Analyzing your profile and finding great matches...
        </p>
        <p className="text-stone-400 text-sm">This usually takes a few seconds</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">
          Great news, {intro.name}!
        </h1>
        <p className="text-stone-500 text-lg">
          Here are job titles that match your background.
        </p>
      </div>

      {expectedJobs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-stone-700 mb-3">
            Roles you'd expect
          </h2>
          <div className="space-y-3">
            {expectedJobs.map((job) => (
              <JobCard key={job.title} job={job} location={intro.location} />
            ))}
          </div>
        </div>
      )}

      {surpriseJobs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-stone-700 mb-1">
            Titles you might not have thought of
          </h2>
          <p className="text-sm text-stone-400 mb-3">
            These are roles you're qualified for that you might not know about.
          </p>
          <div className="space-y-3">
            {surpriseJobs.map((job) => (
              <JobCard key={job.title} job={job} location={intro.location} />
            ))}
          </div>
        </div>
      )}

      {/* Explore adjacent careers */}
      {adjacentJobs.length === 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 text-center space-y-3">
          <p className="text-indigo-800 font-semibold text-lg">
            Want to explore beyond {intro.dreamJob}?
          </p>
          <p className="text-sm text-indigo-600">
            We can find jobs in related fields that use the same skills — careers you might not have considered.
          </p>
          <button
            onClick={handleExploreAdjacent}
            disabled={loadingAdjacent}
            className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            {loadingAdjacent ? 'Finding related careers...' : 'Explore adjacent careers'}
          </button>
        </div>
      )}

      {adjacentJobs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-stone-700 mb-1">
            Adjacent careers to explore
          </h2>
          <p className="text-sm text-stone-400 mb-3">
            Different fields that leverage your same skills and background.
          </p>
          <div className="space-y-3">
            {adjacentJobs.map((job) => (
              <JobCard key={job.title} job={job} location={intro.location} />
            ))}
          </div>
        </div>
      )}

      {/* Start over */}
      <div className="text-center pt-4">
        <button
          onClick={() => {
            dispatch({ type: 'CLEAR_ANSWERS' });
            dispatch({ type: 'SET_SCREEN', payload: 'intro' });
          }}
          className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          Start over with a different career
        </button>
      </div>
    </div>
  );
}

function JobCard({
  job,
  location,
}: {
  job: { title: string; whyFit: string; isUnexpected: boolean };
  location: string;
}) {
  const links = buildSearchLinks(job.title, location);

  return (
    <div
      className={`rounded-xl border p-5 space-y-3 ${
        job.isUnexpected
          ? 'border-indigo-200 bg-indigo-50/50'
          : 'border-stone-200 bg-white'
      }`}
    >
      <h3 className="font-semibold text-stone-800 text-lg">{job.title}</h3>
      <p className="text-sm text-stone-500">{job.whyFit}</p>
      {location && (
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={links.indeed}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-medium"
          >
            Indeed
          </a>
          <a
            href={links.google}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors font-medium"
          >
            Google Jobs
          </a>
          <a
            href={links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors font-medium"
          >
            LinkedIn
          </a>
        </div>
      )}
    </div>
  );
}
