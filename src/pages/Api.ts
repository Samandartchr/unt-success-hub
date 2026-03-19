// ─── Base config ───────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Shared types ───────────────────────────────────────────────────────────────

export interface SubjectMeta {
  id: string;
  label: string;
}

// ─── Question DTOs (mirrors what the server sends) ─────────────────────────────

export interface ServerSingleQuestion {
  id: number;
  subject: string;
  text: string;
  type: "single" | "multiple";
  options: string[];
  context?: { text?: string; image?: string };
}

export interface ServerContextGroup {
  id: number;
  subject: string;
  type: "context-group";
  context: { text?: string; image?: string };
  questions: { id: number; text: string; options: string[] }[];
}

export interface ServerMatchQuestion {
  id: number;
  subject: string;
  text: string;
  type: "match";
  context?: { text?: string; image?: string };
  leftItems: string[];
  rightOptions: string[];
}

export type ServerQuestion =
  | ServerSingleQuestion
  | ServerContextGroup
  | ServerMatchQuestion;

// ─── Test session ───────────────────────────────────────────────────────────────

export interface TestSession {
  sessionId: string;
  /** Ordered list of subjects (mandatory first, then profile subjects). */
  subjectOrder: string[];
  /** All questions for this session, already sorted by subject. */
  questions: ServerQuestion[];
  /** Duration in seconds (e.g. 9000 = 150 min). */
  durationSeconds: number;
}

// ─── Submission ─────────────────────────────────────────────────────────────────

export interface SubmitPayload {
  sessionId: string;
  /** Map of questionId → selected option strings (single/multiple questions). */
  answers: Record<number, string[]>;
  /** Map of questionId → { leftItem → rightOption } (match questions). */
  matchAnswers: Record<number, Record<string, string>>;
  /** Elapsed time in seconds. */
  elapsedSeconds: number;
}

export interface TestResult {
  resultId: string;
  totalScore: number;
  maxScore: number;
  bySubject: Record<string, { score: number; max: number }>;
  /** ISO 8601 timestamp */
  submittedAt: string;
}

// ─── API calls ─────────────────────────────────────────────────────────────────

/**
 * Returns the list of electable profile subjects from the backend.
 *
 * GET /api/subjects
 * Response: SubjectMeta[]
 */
export async function fetchSubjects(): Promise<SubjectMeta[]> {
  return request<SubjectMeta[]>("/subjects");
}

/**
 * Creates a new test session for the given profile subjects.
 * The server includes mandatory subjects (Kazakh History, Math Literacy,
 * Functional Literacy) automatically.
 *
 * POST /api/sessions
 * Body:    { profileSubjects: string[] }
 * Response: TestSession
 */
export async function createTestSession(
  profileSubjects: [string, string]
): Promise<TestSession> {
  return request<TestSession>("/sessions", {
    method: "POST",
    body: JSON.stringify({ profileSubjects }),
  });
}

/**
 * Submits completed answers and returns scored results.
 *
 * POST /api/sessions/:sessionId/submit
 * Body:    SubmitPayload (minus sessionId — it's in the URL)
 * Response: TestResult
 */
export async function submitTest(payload: SubmitPayload): Promise<TestResult> {
  const { sessionId, ...body } = payload;
  return request<TestResult>(`/sessions/${sessionId}/submit`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}