import { getAuth } from "firebase/auth";
import { translateSubject } from "@/pages/TestResults";

const BASE = "https://api-service-xy2qzucrkq-uc.a.run.app";

async function getToken(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

async function authFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── DTOs (mirror backend models) ─────────────────────────────────────────────

export interface TestResultClient {
  id: string;
  takenAt: string; // ISO date string
  secondarySubject1: string; // Subject enum as string
  secondarySubject2: string;
  kazakhHistoryScore: number;
  functionalLiteracyScore: number;
  mathematicalLiteracyScore: number;
  secondarySubject1Score: number;
  secondarySubject2Score: number;
  totalScore: number;
}

export interface UserPublicInfo {
  username: string;
  email: string;
  role: string;
  name: string;
  surname: string;
  createdAt: string;
  phoneNumber?: string;
  profileImageLink?: string;
  isPremium: boolean;
}

export interface GroupPublic {
  groupId: string;
  groupName: string;
  teacherUsername: string;
  createdAt: string;
  groupDescription?: string;
  groupImageLink?: string;
}

// ─── Score helpers ─────────────────────────────────────────────────────────────

export const SUBJECT_MAX: Record<string, number> = {
  kazakhHistoryScore: 20,
  functionalLiteracyScore: 10,
  mathematicalLiteracyScore: 10,
  secondarySubject1Score: 50,
  secondarySubject2Score: 50,
};

export const TOTAL_MAX = 140;

export function subjectBreakdown(
  r: TestResultClient
): { name: string; score: number; max: number; pct: number }[] {
  return [
    { name: "Қазақстан тарихы", score: r.kazakhHistoryScore, max: 20, pct: Math.round((r.kazakhHistoryScore / 20) * 100) },
    { name: "Оқу сауаттылығы", score: r.functionalLiteracyScore, max: 10, pct: Math.round((r.functionalLiteracyScore / 10) * 100) },
    { name: "Математикалық сауаттылық", score: r.mathematicalLiteracyScore, max: 10, pct: Math.round((r.mathematicalLiteracyScore / 10) * 100) },
    { name: r.secondarySubject1, score: r.secondarySubject1Score, max: 50, pct: Math.round((r.secondarySubject1Score / 50) * 100) },
    { name: r.secondarySubject2, score: r.secondarySubject2Score, max: 50, pct: Math.round((r.secondarySubject2Score / 50) * 100) },
  ];
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD
}

export function subjectLabel(result: TestResultClient) {
  return `${translateSubject(result.secondarySubject1)} + ${translateSubject(result.secondarySubject2)}`;
}

// ─── API calls ─────────────────────────────────────────────────────────────────

/** Student: own test results */
export const getMyResults = (): Promise<TestResultClient[]> =>
  authFetch("/api/test/gettestresults");

/** Teacher: all results for a group (aggregate, no per-student username) */
export const getGroupResults = (groupId: string): Promise<TestResultClient[]> =>
  authFetch(`/api/group/getgroupresults/${groupId}`);

/** Teacher: get group metadata */
export const getGroupInfo = (groupId: string): Promise<GroupPublic> =>
  authFetch(`/api/group/getgroupinfo/${groupId}`);

/** Teacher: list students in group */
export const getGroupStudents = (groupId: string): Promise<UserPublicInfo[]> =>
  authFetch(`/api/group/getstudents/${groupId}`);

/** Teacher: get a specific student's results */
export const getStudentResults = (username: string): Promise<TestResultClient[]> =>
  authFetch(`/api/test/getstudentresults/${username}`);

/** Teacher: remove student from group */
export const removeStudent = (groupId: string, studentUsername: string): Promise<void> =>
  authFetch("/api/removestudent/removestudent", { // ← match your controller
    method: "POST",
    body: JSON.stringify({ groupId, studentUsername }),
  });