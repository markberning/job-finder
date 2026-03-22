import { useEffect, useState } from 'react';
import { useFormContext } from '../../context/FormContext';
import { useSavedJobs } from '../../context/SavedJobsContext';
import type { CareerPath, AIJobSuggestion } from '../../types';
import {
  generateResults,
  generateAdjacentResults,
  generateCareerPaths,
  generatePathJobs,
  buildSearchLinks,
} from '../../services/api';

export function Results() {
  const { state, dispatch } = useFormContext();
  const { intro, aiQuestions, answers, results } = state.data;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Adjacent careers
  const [adjacentJobs, setAdjacentJobs] = useState<AIJobSuggestion[]>([]);
  const [loadingAdjacent, setLoadingAdjacent] = useState(false);

  // Career paths exploration
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [loadingPaths, setLoadingPaths] = useState(false);
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);
  const [pathJobs, setPathJobs] = useState<Record<string, AIJobSuggestion[]>>({});
  const [loadingPathJobs, setLoadingPathJobs] = useState(false);

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

  function getAllPreviousTitles() {
    const allPathJobs = Object.values(pathJobs).flat();
    return [
      ...results.map((r) => r.title),
      ...adjacentJobs.map((r) => r.title),
      ...allPathJobs.map((r) => r.title),
    ];
  }

  async function handleExploreAdjacent() {
    setLoadingAdjacent(true);
    try {
      const adjacent = await generateAdjacentResults(
        intro, aiQuestions, answers, getAllPreviousTitles()
      );
      setAdjacentJobs((prev) => [...prev, ...adjacent]);
    } catch (err) {
      console.error('Failed to generate adjacent results:', err);
    } finally {
      setLoadingAdjacent(false);
    }
  }

  async function handleExploreCareerPaths() {
    setLoadingPaths(true);
    try {
      const paths = await generateCareerPaths(intro);
      setCareerPaths(paths);
    } catch (err) {
      console.error('Failed to generate career paths:', err);
    } finally {
      setLoadingPaths(false);
    }
  }

  async function handleSelectPath(path: CareerPath) {
    setSelectedPath(path);

    // Scroll to the results area after a brief delay to let React render
    setTimeout(() => {
      document.getElementById('path-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // If we already loaded jobs for this path, just show them
    if (pathJobs[path.id]) return;

    setLoadingPathJobs(true);
    try {
      const jobs = await generatePathJobs(intro, path, getAllPreviousTitles());
      setPathJobs((prev) => ({ ...prev, [path.id]: jobs }));
    } catch (err) {
      console.error('Failed to generate path jobs:', err);
    } finally {
      setLoadingPathJobs(false);
    }
  }

  const expectedJobs = results.filter((r) => !r.isUnexpected);
  const surpriseJobs = results.filter((r) => r.isUnexpected);
  const training = intro.fieldOfStudy || intro.dreamJob;

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
        <p className="text-stone-400 text-sm mt-2">
          Tap a job title you like, click the search links to find openings, and save the ones you want to come back to.
        </p>
      </div>

      {/* Explore further callout */}
      <div className="bg-stone-50 rounded-xl border border-stone-200 p-5 space-y-3">
        <p className="text-stone-600 font-medium text-sm">
          When you're done browsing these results, keep exploring:
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href="#adjacent-careers"
            className="flex-1 flex items-center justify-center text-center px-4 py-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 font-medium text-sm hover:bg-purple-100 transition-colors"
          >
            Explore beyond {intro.dreamJob}
          </a>
          {intro.fieldOfStudy && (
            <a
              href="#career-paths"
              className="flex-1 text-center px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-medium text-sm hover:bg-amber-100 transition-colors"
            >
              Where else can {training} take you?
            </a>
          )}
        </div>
      </div>

      {/* Main results */}
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
              <JobCard key={job.title} job={job} location={intro.location} variant="unexpected" />
            ))}
          </div>
        </div>
      )}

      {/* Adjacent careers */}
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
              <JobCard key={job.title} job={job} location={intro.location} variant="adjacent" />
            ))}
          </div>
        </div>
      )}

      {/* Explore adjacent careers button */}
      <div id="adjacent-careers" className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 text-center space-y-3 scroll-mt-6">
        <p className="text-purple-800 font-semibold text-lg">
          {adjacentJobs.length === 0
            ? `Want to explore beyond ${intro.dreamJob}?`
            : 'Keep exploring?'}
        </p>
        <p className="text-sm text-purple-600">
          {adjacentJobs.length === 0
            ? 'We can find jobs in related fields that use the same skills — careers you might not have considered.'
            : "We'll find even more related careers you haven't seen yet."}
        </p>
        {loadingAdjacent ? (
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="w-5 h-5 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-purple-700 font-medium">
              Thinking about careers related to your skills...
            </p>
          </div>
        ) : (
          <button
            onClick={handleExploreAdjacent}
            className="px-6 py-2.5 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors"
          >
            {adjacentJobs.length === 0
              ? 'Explore adjacent careers'
              : 'Find more adjacent careers'}
          </button>
        )}
      </div>

      {/* Career paths exploration */}
      {intro.fieldOfStudy && (
        <div id="career-paths" className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 space-y-4 scroll-mt-6">
          <div className="text-center space-y-2">
            <p className="text-amber-800 font-semibold text-lg">
              Where else can {training} take you?
            </p>
            <p className="text-sm text-amber-700">
              Your {training} background opens doors to more career paths than you might think. Pick one to explore.
            </p>
          </div>

          {/* Show career path buttons if loaded */}
          {careerPaths.length > 0 && (
            <div className="space-y-2">
              {careerPaths.map((path) => (
                <button
                  key={path.id}
                  onClick={() => handleSelectPath(path)}
                  className={`w-full text-left px-5 py-3.5 rounded-lg border-2 transition-all ${
                    selectedPath?.id === path.id
                      ? 'border-amber-500 bg-amber-100 text-amber-900'
                      : 'border-amber-200 bg-white hover:border-amber-300 text-stone-700'
                  }`}
                >
                  <span className="font-medium">{path.name}</span>
                  <span className="block text-sm text-stone-500 mt-0.5">{path.description}</span>
                </button>
              ))}
            </div>
          )}

          {/* Generate paths button (only shown before paths are loaded) */}
          {careerPaths.length === 0 && (
            <div className="text-center">
              {loadingPaths ? (
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="w-5 h-5 border-3 border-amber-300 border-t-amber-700 rounded-full animate-spin" />
                  <p className="text-amber-800 font-medium">
                    Mapping out {training} career paths...
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleExploreCareerPaths}
                  className="px-6 py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Explore other {training} career paths
                </button>
              )}
            </div>
          )}

          {/* Show jobs for selected path */}
          {selectedPath && (
            <div id="path-results" className="pt-2 scroll-mt-6">
              {loadingPathJobs ? (
                <div className="text-center py-6">
                  <div className="inline-block w-6 h-6 border-3 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                  <p className="text-amber-700 text-sm mt-2">
                    Finding {selectedPath.name} roles...
                  </p>
                </div>
              ) : pathJobs[selectedPath.id] ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-amber-900">
                    {selectedPath.name} roles for you
                  </h3>
                  {pathJobs[selectedPath.id].map((job) => (
                    <JobCard key={job.title} job={job} location={intro.location} variant="degree" />
                  ))}
                  <p className="text-sm text-amber-700 text-center pt-2">
                    Pick another path above to explore more options
                  </p>
                </div>
              ) : null}
            </div>
          )}
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

type CardVariant = 'default' | 'unexpected' | 'adjacent' | 'degree';

const variantStyles: Record<CardVariant, string> = {
  default: 'border-stone-200 bg-white',
  unexpected: 'border-emerald-200 bg-emerald-50/50',
  adjacent: 'border-purple-200 bg-purple-50/50',
  degree: 'border-amber-200 bg-amber-50/50',
};

function JobCard({
  job,
  location,
  variant = 'default',
}: {
  job: { title: string; whyFit: string; isUnexpected: boolean };
  location: string;
  variant?: CardVariant;
}) {
  const links = buildSearchLinks(job.title, location);
  const { saveJob, removeJob, isJobSaved } = useSavedJobs();
  const saved = isJobSaved(job.title);
  const [justSaved, setJustSaved] = useState(false);

  function handleSave() {
    if (saved) {
      removeJob(job.title);
    } else {
      saveJob(job, location);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    }
  }

  return (
    <div className={`rounded-xl border p-5 space-y-3 transition-all ${variantStyles[variant]} ${justSaved ? 'ring-2 ring-primary/30' : ''}`}>
      <div className="flex justify-between items-start gap-3">
        <h3 className="font-semibold text-stone-800 text-lg">{job.title}</h3>
        <button
          onClick={handleSave}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            saved
              ? 'bg-primary text-white hover:bg-primary-dark'
              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          } ${justSaved ? 'scale-110' : ''}`}
        >
          {justSaved ? 'Saved!' : saved ? 'Saved' : 'Save'}
        </button>
      </div>
      <p className="text-sm text-stone-500">{job.whyFit}</p>
      {location && (
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={links.indeed}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-medium"
          >
            Indeed
          </a>
          <a
            href={links.google}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-2 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors font-medium"
          >
            Google Jobs
          </a>
          <a
            href={links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-2 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors font-medium"
          >
            LinkedIn
          </a>
        </div>
      )}
    </div>
  );
}
