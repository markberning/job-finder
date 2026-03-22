import { useState } from 'react';
import { useSavedJobs } from '../../context/SavedJobsContext';
import { useFormContext } from '../../context/FormContext';
import { buildSearchLinks, createShareCode, loadShareCode } from '../../services/api';

function getAppUrl() {
  return window.location.origin;
}

export function SavedJobs() {
  const { savedJobs, removeJob, saveJob } = useSavedJobs();
  const { state, dispatch } = useFormContext();
  const [shareCode, setShareCode] = useState('');
  const [sharing, setSharing] = useState(false);
  const [loadCode, setLoadCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadSuccess, setLoadSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    setSharing(true);
    setError('');
    try {
      const code = await createShareCode(savedJobs, state.lastReport);
      setShareCode(code);
    } catch {
      setError('Failed to create share code. Try again.');
    } finally {
      setSharing(false);
    }
  }

  async function handleLoadCode() {
    if (!loadCode.trim()) return;
    setLoading(true);
    setError('');
    setLoadSuccess('');
    try {
      const { jobs, lastReport } = await loadShareCode(loadCode.trim());
      let added = 0;
      for (const job of jobs) {
        saveJob(
          { title: job.title, whyFit: job.whyFit, isUnexpected: job.isUnexpected },
          job.location
        );
        added++;
      }
      // Restore last report if included
      if (lastReport) {
        dispatch({ type: 'UPDATE_INTRO', payload: lastReport.intro });
        dispatch({ type: 'SET_RESULTS', payload: lastReport.results });
      }
      setLoadSuccess(
        `Added ${added} job${added === 1 ? '' : 's'}${lastReport ? ' and last results' : ''} to this device!`
      );
      setLoadCode('');
    } catch {
      setError('Code not found or expired. Check and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">
          Your saved jobs
        </h1>
        <p className="text-stone-500">
          {savedJobs.length === 0
            ? "You haven't saved any jobs yet."
            : `${savedJobs.length} job${savedJobs.length === 1 ? '' : 's'} saved`}
        </p>
      </div>

      {/* Load a share code */}
      {/* Share code section — compact */}
      {shareCode ? (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <p className="text-sm text-indigo-600">Your share code:</p>
            <p className="text-xl font-mono font-bold text-indigo-800 tracking-widest">
              {shareCode}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                const text = `Check out my saved jobs on Job Finder!\n\n1. Go to: ${getAppUrl()}\n2. Click "Have a share code?"\n3. Enter code: ${shareCode}`;
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
              }}
              className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy link & code'}
            </button>
            <span className="text-xs text-indigo-400">Expires in 7 days</span>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 space-y-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <p className="text-xs text-indigo-600 mb-1">
                Enter a share code to load saved jobs from another device
              </p>
              <input
                type="text"
                value={loadCode}
                onChange={(e) => setLoadCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                maxLength={6}
                className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-colors uppercase tracking-widest text-center font-mono"
              />
            </div>
            <button
              onClick={handleLoadCode}
              disabled={loading || !loadCode.trim()}
              className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
            >
              {loading ? '...' : 'Load'}
            </button>
          </div>
          {loadSuccess && (
            <p className="text-sm text-green-600 font-medium">{loadSuccess}</p>
          )}
          {savedJobs.length > 0 && (
            <div className="flex items-center justify-between border-t border-indigo-200 pt-3">
              <p className="text-xs text-indigo-600">
                View these saves on another device?
              </p>
              <button
                onClick={handleShare}
                disabled={sharing}
                className="px-4 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40 shrink-0"
              >
                {sharing ? 'Creating...' : 'Get share code'}
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Saved job cards */}
      {savedJobs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-stone-400 mb-4">
            Find jobs you like and tap "Save" to keep them here.
          </p>
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'intro' })}
            className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            Find jobs
          </button>
        </div>
      )}

      {savedJobs.length > 0 && (
        <div className="space-y-3">
          {savedJobs.map((job) => {
            const links = buildSearchLinks(job.title, job.location);
            return (
              <div
                key={job.title}
                className="rounded-xl border border-stone-200 bg-white p-5 space-y-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <h3 className="font-semibold text-stone-800 text-lg">{job.title}</h3>
                  <button
                    onClick={() => removeJob(job.title)}
                    className="shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-sm text-stone-500">{job.whyFit}</p>
                {job.location && (
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
          })}
        </div>
      )}

      <div className="text-center pt-4 space-y-3">
        {state.data.results.length > 0 && (
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'results' })}
            className="w-full px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            Back to your results
          </button>
        )}
        <button
          onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'intro' })}
          className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          {state.data.results.length > 0 ? 'Start a new search' : 'Find jobs'}
        </button>
      </div>
    </div>
  );
}
