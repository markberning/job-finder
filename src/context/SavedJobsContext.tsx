import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AIJobSuggestion } from '../types';

interface SavedJob extends AIJobSuggestion {
  savedAt: number;
  location: string;
}

interface SavedJobsContextType {
  savedJobs: SavedJob[];
  saveJob: (job: AIJobSuggestion, location: string) => void;
  removeJob: (title: string) => void;
  isJobSaved: (title: string) => boolean;
}

const STORAGE_KEY = 'job-finder-saved';

function loadSavedJobs(): SavedJob[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

const SavedJobsContext = createContext<SavedJobsContextType | null>(null);

export function SavedJobsProvider({ children }: { children: ReactNode }) {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>(loadSavedJobs);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedJobs));
  }, [savedJobs]);

  function saveJob(job: AIJobSuggestion, location: string) {
    setSavedJobs((prev) => {
      if (prev.some((j) => j.title === job.title)) return prev;
      return [...prev, { ...job, location, savedAt: Date.now() }];
    });
  }

  function removeJob(title: string) {
    setSavedJobs((prev) => prev.filter((j) => j.title !== title));
  }

  function isJobSaved(title: string) {
    return savedJobs.some((j) => j.title === title);
  }

  return (
    <SavedJobsContext.Provider value={{ savedJobs, saveJob, removeJob, isJobSaved }}>
      {children}
    </SavedJobsContext.Provider>
  );
}

export function useSavedJobs() {
  const context = useContext(SavedJobsContext);
  if (!context) {
    throw new Error('useSavedJobs must be used within a SavedJobsProvider');
  }
  return context;
}
