import type { IntroData, AIQuestion, AIJobSuggestion, QuizAnswers } from '../types';
import { EDUCATION_LABELS } from '../types';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';
const API_URL = `${API_BASE}/chat`;

function buildProfileSummary(intro: IntroData): string {
  const edu = intro.educationLevel ? EDUCATION_LABELS[intro.educationLevel] : 'Not specified';
  return [
    `Name: ${intro.name}`,
    `Education: ${edu}`,
    intro.fieldOfStudy ? `Field of study: ${intro.fieldOfStudy}` : null,
    `Dream job / career interest: ${intro.dreamJob}`,
    intro.location ? `Looking for work in: ${intro.location}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildAnswersSummary(questions: AIQuestion[], answers: QuizAnswers): string {
  return questions
    .map((q) => {
      const ans = answers[q.id];
      if (ans === undefined) return null;
      const display = Array.isArray(ans) ? ans.join(', ') : String(ans);
      return `Q: ${q.question}\nA: ${display}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

async function callAPI(system: string, userMessage: string): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const data = await res.json();
  return data.content;
}

function parseJSON<T>(text: string): T {
  // Extract JSON from markdown code blocks if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}

const QUESTIONS_SYSTEM_PROMPT = `You are helping an entry-level job seeker discover specific roles they're qualified for.

Given their background and career interests, generate 3-5 follow-up questions that would help you recommend the BEST specific job titles for them.

Rules:
- Only ask questions that will meaningfully change or refine your recommendations
- Don't ask things you can already infer from their profile
- Mix up question types to keep it engaging
- Questions should feel conversational and friendly, not like a job application
- Focus on narrowing down WHICH specific roles within their career area are the best fit

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
[
  {
    "id": "unique-id",
    "type": "checkboxes" | "true-false" | "scale" | "short-answer",
    "question": "The question text",
    "options": ["Option 1", "Option 2"],
    "scaleLabels": { "low": "Left label", "high": "Right label" }
  }
]

Notes:
- "options" is required for "checkboxes" type (provide 3-5 options). Users can select one OR multiple.
- "scaleLabels" is required for "scale" type
- "options" and "scaleLabels" should be omitted for other types
- Use "true-false" sparingly
- Each question needs a unique "id" (use descriptive kebab-case like "patient-interaction-pref")
- NEVER use "multiple-choice". Always use "checkboxes" when presenting options — users should always be able to select more than one.`;

const MORE_QUESTIONS_SYSTEM_PROMPT = `You are helping an entry-level job seeker discover specific roles they're qualified for.

They've already answered some questions. Based on their profile AND their previous answers, decide:
1. Would additional questions meaningfully improve your job recommendations?
2. If yes, generate 2-3 more targeted follow-up questions.
3. If you already have enough to make great recommendations, return an empty array.

Return ONLY valid JSON in the same format as before:
[
  {
    "id": "unique-id",
    "type": "checkboxes" | "true-false" | "scale" | "short-answer",
    "question": "The question text",
    "options": ["Option 1", "Option 2"],
    "scaleLabels": { "low": "Left label", "high": "Right label" }
  }
]

NEVER use "multiple-choice". Always use "checkboxes" when presenting options — users should always be able to select more than one.
Return [] (empty array) if you have enough information already.
Don't repeat topics already covered. Make question IDs unique and different from previous ones.`;

const RESULTS_SYSTEM_PROMPT = `You are a career advisor helping an entry-level job seeker find specific roles they're qualified for.

Given their full profile and quiz answers, suggest 8-12 specific job titles. For each title:
- Explain in 1-2 sentences why their background makes them a fit
- Mark whether this is an "expected" title (something they'd likely search for) or an "unexpected" title (something they might not have thought of but are qualified for)

The unexpected titles are the most valuable part — think creatively about roles that match their skills and interests but they might not know exist.

Return ONLY valid JSON in this exact format:
[
  {
    "title": "Specific Job Title",
    "whyFit": "Brief explanation of why they'd be good at this",
    "isUnexpected": false
  }
]

Guidelines:
- Use actual job titles that appear on Indeed/LinkedIn (not made-up titles)
- Include a mix of expected and unexpected titles (aim for ~40% unexpected)
- Consider their location if provided
- Be encouraging — these are young people starting their careers
- Order by relevance (best fits first within each category)`;

const CAREER_PATHS_SYSTEM_PROMPT = `You are a career advisor. Given a job seeker's education/training, identify 6-8 distinct CAREER PATH CATEGORIES their degree or training qualifies them for.

These should be broad career directions, NOT specific job titles. Each path represents a whole category of jobs they could explore.

For example, for a Criminal Justice degree:
- "Compliance & Regulation" — corporate compliance, regulatory affairs
- "Victim Services & Advocacy" — victim advocacy, crisis counseling
- "Corporate Security" — loss prevention, security management
- "Legal Support" — paralegal, legal research
- "Investigations" — fraud investigation, private investigation
- "Corrections & Rehabilitation" — probation, reentry programs
- "Juvenile & Family Services" — youth counseling, family court

Return ONLY valid JSON in this exact format:
[
  {
    "id": "kebab-case-id",
    "name": "Career Path Name",
    "description": "One sentence explaining what kinds of roles fall under this path"
  }
]

Guidelines:
- 6-8 paths
- Focus on what their DEGREE/TRAINING qualifies them for
- Include their dream job area as one path, but also paths they likely haven't considered
- Make path names clear and concise (2-4 words)
- Descriptions should be brief and enticing`;

const PATH_JOBS_SYSTEM_PROMPT = `You are a career advisor. A job seeker has chosen a specific career path to explore. Suggest 6-10 specific entry-level job titles within that path.

Return ONLY valid JSON in this exact format:
[
  {
    "title": "Specific Job Title",
    "whyFit": "Brief explanation of why their background makes them a fit for this role",
    "isUnexpected": true
  }
]

Guidelines:
- Use actual job titles that appear on Indeed/LinkedIn
- Focus on entry-level / early-career positions
- Explain how their education/training connects to each role
- Be encouraging — these are young people exploring their options
- ALL should be marked isUnexpected: true`;

import type { CareerPath } from '../types';

export async function generateCareerPaths(intro: IntroData): Promise<CareerPath[]> {
  const profile = buildProfileSummary(intro);
  const training = intro.fieldOfStudy || intro.dreamJob;
  const response = await callAPI(
    CAREER_PATHS_SYSTEM_PROMPT,
    `Profile:\n${profile}\n\nTheir education/training: ${training}\n\nIdentify the career path categories their ${training} background qualifies them for.`
  );
  return parseJSON<CareerPath[]>(response);
}

export async function generatePathJobs(
  intro: IntroData,
  path: CareerPath,
  previousTitles: string[]
): Promise<AIJobSuggestion[]> {
  const profile = buildProfileSummary(intro);
  const training = intro.fieldOfStudy || intro.dreamJob;
  const response = await callAPI(
    PATH_JOBS_SYSTEM_PROMPT,
    `Profile:\n${profile}\n\nTheir education/training: ${training}\nChosen career path: ${path.name} — ${path.description}\n\nDo NOT suggest any of these titles (already shown): ${previousTitles.join(', ')}\n\nSuggest specific entry-level job titles within the "${path.name}" career path.`
  );
  return parseJSON<AIJobSuggestion[]>(response);
}

export async function generateQuestions(intro: IntroData): Promise<AIQuestion[]> {
  const profile = buildProfileSummary(intro);
  const response = await callAPI(
    QUESTIONS_SYSTEM_PROMPT,
    `Here's the job seeker's profile:\n\n${profile}\n\nGenerate tailored follow-up questions.`
  );
  return parseJSON<AIQuestion[]>(response);
}

export async function generateMoreQuestions(
  intro: IntroData,
  questions: AIQuestion[],
  answers: QuizAnswers
): Promise<AIQuestion[]> {
  const profile = buildProfileSummary(intro);
  const answersSummary = buildAnswersSummary(questions, answers);
  const response = await callAPI(
    MORE_QUESTIONS_SYSTEM_PROMPT,
    `Profile:\n${profile}\n\nPrevious questions and answers:\n${answersSummary}\n\nShould we ask more questions, or do you have enough for great recommendations?`
  );
  return parseJSON<AIQuestion[]>(response);
}

const ADJACENT_SYSTEM_PROMPT = `You are a career advisor helping an entry-level job seeker explore careers ADJACENT to their primary interest.

They already received suggestions for their main career area. Now suggest 8-12 job titles in RELATED but DIFFERENT fields that leverage the same skills, education, or interests.

For example:
- Someone interested in criminal justice might also fit roles in social work, compliance, insurance investigation, or corporate security
- Someone interested in pastry arts might also fit roles in food science, product development, catering management, or food photography
- Someone interested in skilled trades might also fit roles in facilities management, building inspection, or technical sales

Return ONLY valid JSON in this exact format:
[
  {
    "title": "Specific Job Title",
    "whyFit": "Brief explanation connecting their background to this adjacent field",
    "isUnexpected": true
  }
]

Guidelines:
- ALL titles should be marked isUnexpected: true (these are all adjacent/surprising)
- Use actual job titles that appear on Indeed/LinkedIn
- These should be genuinely DIFFERENT fields, not just different titles in the same field
- Be creative — this is where you add the most value
- Be encouraging and explain the connection clearly`;

export async function generateAdjacentResults(
  intro: IntroData,
  questions: AIQuestion[],
  answers: QuizAnswers,
  previousTitles: string[]
): Promise<AIJobSuggestion[]> {
  const profile = buildProfileSummary(intro);
  const answersSummary = buildAnswersSummary(questions, answers);
  const response = await callAPI(
    ADJACENT_SYSTEM_PROMPT,
    `Full profile:\n${profile}\n\nQuiz answers:\n${answersSummary}\n\nThey already received these suggestions (do NOT repeat any of these):\n${previousTitles.join(', ')}\n\nNow suggest jobs in ADJACENT careers they might not have considered.`
  );
  return parseJSON<AIJobSuggestion[]>(response);
}

export async function generateResults(
  intro: IntroData,
  questions: AIQuestion[],
  answers: QuizAnswers
): Promise<AIJobSuggestion[]> {
  const profile = buildProfileSummary(intro);
  const answersSummary = buildAnswersSummary(questions, answers);
  const response = await callAPI(
    RESULTS_SYSTEM_PROMPT,
    `Full profile:\n${profile}\n\nQuiz answers:\n${answersSummary}\n\nSuggest specific job titles they should look for.`
  );
  return parseJSON<AIJobSuggestion[]>(response);
}

export function buildSearchLinks(
  title: string,
  location: string
): { indeed: string; google: string; linkedin: string } {
  const q = encodeURIComponent(title);
  const loc = encodeURIComponent(location);
  return {
    indeed: `https://www.indeed.com/jobs?q=${q}&l=${loc}`,
    google: `https://www.google.com/search?q=${q}+jobs+near+${loc}&ibp=htl;jobs`,
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${loc}`,
  };
}

// Share codes
interface SavedJobForShare {
  title: string;
  whyFit: string;
  isUnexpected: boolean;
  location: string;
}

export async function createShareCode(jobs: SavedJobForShare[]): Promise<string> {
  const res = await fetch(`${API_BASE}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobs }),
  });

  if (!res.ok) throw new Error('Failed to create share code');
  const data = await res.json();
  return data.code;
}

export async function loadShareCode(code: string): Promise<SavedJobForShare[]> {
  const res = await fetch(`${API_BASE}/share/${code.toUpperCase()}`);

  if (!res.ok) {
    if (res.status === 404) throw new Error('Code not found or expired');
    throw new Error('Failed to load shared jobs');
  }

  const data = await res.json();
  return data.jobs;
}
