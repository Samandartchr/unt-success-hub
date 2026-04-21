import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Clock, ChevronLeft, ChevronRight, Send, BookOpen, GraduationCap,
  PlayCircle, Loader2,
} from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useNavigate } from "react-router-dom";
import {translateSubject, subjectMap} from "@/pages/TestResults"

// ─── Subject enum mapping ──────────────────────────────────────────────────────

const SUBJECT_NAMES: Record<number, string> = {
  0:  "Пән жоқ",
  1:  "Математикалық сауаттылық",
  2:  "Оқу сауатылығы",
  3:  "Қазақстан тарихы",
  4:  "Физика",
  5:  "Математика",
  6:  "Информатика",
  7:  "Химия",
  8:  "Биология",
  9:  "География",
  10: "Дүниежүзі тарихы",
  11: "Құқық негіздері",
  12: "Ағылшын тілі",
  13: "Орыс тілі",
  14: "Орыс әдебиеті",
  15: "Қазақ тілі",
  16: "Қазақ әдебиеті",
};

const SECONDARY_SUBJECT_NUMBERS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

// ─── Backend API types ────────────────────────────────────────────────────────

interface ApiOption {
  isCorrect: boolean;
  imageLink: string | null;
  text: string;
}

interface ApiSingleQuestion {
  type: "SingleChoice";
  id: string;
  subject: number;
  text: string;
  imageLink: string | null;
  options: ApiOption[];
}

interface ApiMultipleQuestion {
  type: "MultipleChoice";
  id: string;
  subject: number;
  text: string;
  imageLink: string | null;
  options: ApiOption[];
}

interface ApiContextSubQuestion {
  type: "SingleChoice";
  id: string;
  subject: number;
  text: string;
  imageLink: string | null;
  options: ApiOption[];
}

interface ApiContextQuestion {
  type: "Context";
  id: string;
  subject: number;
  contextText: string;
  contextImageLink: string | null;
  questions: ApiContextSubQuestion[];
}

interface ApiMatchSide {
  text: string;
  imageLink: string | null;
}

interface ApiMatchQuestion {
  type: "Match";
  id: string;
  subject: number;
  text: string;
  imageLink: string | null;
  leftSide: ApiMatchSide[];
  rightSide: ApiMatchSide[];
  correctMatches: boolean[];
}

interface ApiSubjectSection {
  subject: number;
  singleChoiceQuestions: ApiSingleQuestion[];
  multipleChoiceQuestions: ApiMultipleQuestion[];
  contextQuestion: ApiContextQuestion | null;
  matchQuestions: ApiMatchQuestion[];
}

interface ApiTestResponse {
  kazakhHistory: {
    singleChoiceQuestions: ApiSingleQuestion[];
    contextQuestions: ApiContextQuestion[];
  };
  mathematicalLiteracy: {
    singleChoiceQuestions: ApiSingleQuestion[];
  };
  functionalLiteracy: {
    contextQuestions: ApiContextQuestion[];
  };
  secondarySubject1: ApiSubjectSection;
  secondarySubject2: ApiSubjectSection;
}

// ─── Result type ──────────────────────────────────────────────────────────────

interface TestResultClient {
  Id: string;
  TakenAt: string;
  SecondarySubject1: string;
  SecondarySubject2: string;
  KazakhHistoryScore: number;
  FunctionalLiteracyScore: number;
  MathematicalLiteracyScore: number;
  SecondarySubject1Score: number;
  SecondarySubject2Score: number;
  TotalScore: number;
}

// ─── Flat navigation item ─────────────────────────────────────────────────────

interface FlatItem {
  id: string;
  text: string;
  type: "single" | "multiple" | "match";
  imageLink: string | null;
  options?: ApiOption[];
  leftSide?: ApiMatchSide[];
  rightSide?: ApiMatchSide[];
  context?: {
    text: string;
    imageLink: string | null;
    groupId: string;
    questionIndex: number;
    totalQuestions: number;
  };
  subjectNumber: number;
  subjectName: string;
}

// ─── Answer state types (using indices for reliable identification) ───────────

type SingleMap = Record<string, number>;                    // questionId -> selected option index
type MultiMap  = Record<string, number[]>;                  // questionId -> array of selected option indices
type MatchMap  = Record<string, Record<number, number>>;    // questionId -> { leftIndex: rightIndex }

// ─── Session storage key and shape ────────────────────────────────────────────

const SESSION_KEY = "unt_test_data";

interface StoredSession {
  testData: ApiTestResponse;
  singleAnswers: SingleMap;
  multiAnswers: MultiMap;
  matchAnswers: MatchMap;
  currentQ: number;
  timeLeft: number;
}

// ─── KaTeX renderer ───────────────────────────────────────────────────────────

function renderMath(raw: string): string {
  if (!raw) return "";
  let out = raw.replace(/\$\$([^$]+?)\$\$/gs, (_, math) => {
    try { return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false }); }
    catch { return math; }
  });
  out = out.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try { return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }); }
    catch { return math; }
  });
  return out;
}

function MathText({ text, className }: { text: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: renderMath(text) }} />;
}

// ─── Flatten API response ─────────────────────────────────────────────────────

function appendSingleQuestions(items: FlatItem[], questions: ApiSingleQuestion[]) {
  for (const q of questions) {
    items.push({
      id: q.id, text: q.text, type: "single", imageLink: q.imageLink, options: q.options,
      subjectNumber: q.subject, subjectName: SUBJECT_NAMES[q.subject] ?? `Subject ${q.subject}`,
    });
  }
}

function appendContextGroup(items: FlatItem[], cg: ApiContextQuestion) {
  cg.questions.forEach((sub, i) => {
    items.push({
      id: sub.id, text: sub.text, type: "single", imageLink: sub.imageLink, options: sub.options,
      context: { text: cg.contextText, imageLink: cg.contextImageLink, groupId: cg.id, questionIndex: i, totalQuestions: cg.questions.length },
      subjectNumber: sub.subject, subjectName: SUBJECT_NAMES[sub.subject] ?? `Subject ${sub.subject}`,
    });
  });
}

function appendSection(items: FlatItem[], section: ApiSubjectSection) {
  const subjectName = SUBJECT_NAMES[section.subject] ?? `Subject: ${section.subject}`;
  for (const q of section.singleChoiceQuestions)
    items.push({ id: q.id, text: q.text, type: "single", imageLink: q.imageLink, options: q.options, subjectNumber: section.subject, subjectName });
  for (const q of section.multipleChoiceQuestions)
    items.push({ id: q.id, text: q.text, type: "multiple", imageLink: q.imageLink, options: q.options, subjectNumber: section.subject, subjectName });
  if (section.contextQuestion) {
    const cg = section.contextQuestion;
    cg.questions.forEach((sub, i) => {
      items.push({
        id: sub.id, text: sub.text, type: "single", imageLink: sub.imageLink, options: sub.options,
        context: { text: cg.contextText, imageLink: cg.contextImageLink, groupId: cg.id, questionIndex: i, totalQuestions: cg.questions.length },
        subjectNumber: section.subject, subjectName,
      });
    });
  }
  for (const q of section.matchQuestions)
    items.push({ id: q.id, text: q.text, type: "match", imageLink: q.imageLink, leftSide: q.leftSide, rightSide: q.rightSide, subjectNumber: section.subject, subjectName });
}

function flattenResponse(data: ApiTestResponse): FlatItem[] {
  const items: FlatItem[] = [];
  appendSingleQuestions(items, data.kazakhHistory.singleChoiceQuestions);
  for (const cg of data.kazakhHistory.contextQuestions) appendContextGroup(items, cg);
  appendSingleQuestions(items, data.mathematicalLiteracy.singleChoiceQuestions);
  for (const cg of data.functionalLiteracy.contextQuestions) appendContextGroup(items, cg);
  appendSection(items, data.secondarySubject1);
  appendSection(items, data.secondarySubject2);
  return items;
}

// ─── Submit payload builder (using indices for accuracy) ──────────────────────

function applyOptionsAnswers(options: ApiOption[], chosenIndices: number[]): ApiOption[] {
  return options.map((opt, idx) => ({ ...opt, isCorrect: chosenIndices.includes(idx) }));
}

function applyMatchAnswers(q: ApiMatchQuestion, chosen: Record<number, number> | undefined): ApiMatchQuestion {
  const rightLen = q.rightSide.length;
  const correctMatches = new Array(q.leftSide.length * rightLen).fill(false);
  if (chosen) {
    Object.entries(chosen).forEach(([leftIdxStr, rightIdx]) => {
      const leftIdx = parseInt(leftIdxStr, 10);
      if (!isNaN(leftIdx) && leftIdx >= 0 && leftIdx < q.leftSide.length && rightIdx >= 0 && rightIdx < rightLen) {
        correctMatches[leftIdx * rightLen + rightIdx] = true;
      }
    });
  }
  return { ...q, correctMatches };
}

function buildSubmitPayload(
  raw: ApiTestResponse,
  singleAnswers: SingleMap,
  multiAnswers: MultiMap,
  matchAnswers: MatchMap,
): ApiTestResponse {
  const patchSingle = (qs: ApiSingleQuestion[]) =>
    qs.map((q) => ({
      ...q,
      options: applyOptionsAnswers(q.options, singleAnswers[q.id] !== undefined ? [singleAnswers[q.id]] : [])
    }));

  const patchMultiple = (qs: ApiMultipleQuestion[]) =>
    qs.map((q) => ({
      ...q,
      options: applyOptionsAnswers(q.options, multiAnswers[q.id] ?? [])
    }));

  const patchContextSubs = (subs: ApiContextSubQuestion[]) =>
    subs.map((q) => ({
      ...q,
      options: applyOptionsAnswers(q.options, singleAnswers[q.id] !== undefined ? [singleAnswers[q.id]] : [])
    }));

  const patchContext = (cg: ApiContextQuestion): ApiContextQuestion =>
    ({ ...cg, questions: patchContextSubs(cg.questions) });

  const patchSection = (s: ApiSubjectSection): ApiSubjectSection => ({
    ...s,
    singleChoiceQuestions: patchSingle(s.singleChoiceQuestions),
    multipleChoiceQuestions: patchMultiple(s.multipleChoiceQuestions),
    contextQuestion: s.contextQuestion ? patchContext(s.contextQuestion) : null,
    matchQuestions: s.matchQuestions.map((q) => applyMatchAnswers(q, matchAnswers[q.id])),
  });

  return {
    kazakhHistory: {
      singleChoiceQuestions: patchSingle(raw.kazakhHistory.singleChoiceQuestions),
      contextQuestions: raw.kazakhHistory.contextQuestions.map(patchContext),
    },
    mathematicalLiteracy: {
      singleChoiceQuestions: patchSingle(raw.mathematicalLiteracy.singleChoiceQuestions),
    },
    functionalLiteracy: {
      contextQuestions: raw.functionalLiteracy.contextQuestions.map(patchContext),
    },
    secondarySubject1: patchSection(raw.secondarySubject1),
    secondarySubject2: patchSection(raw.secondarySubject2),
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MockTest() {
  const [phase, setPhase] = useState<"select" | "loading" | "test" | "submitting">("select");
  const [subject1, setSubject1] = useState("");
  const [subject2, setSubject2] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [rawTestData, setRawTestData] = useState<ApiTestResponse | null>(null);
  const [allItems, setAllItems] = useState<FlatItem[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180 * 60); // 3 hours

  const [singleAnswers, setSingleAnswers] = useState<SingleMap>({});
  const [multiAnswers, setMultiAnswers] = useState<MultiMap>({});
  const [matchAnswers, setMatchAnswers] = useState<MatchMap>({});

  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getAuth>["currentUser"]>(null);
  const navigate = useNavigate();

  // ─── Auth listener ───────────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => setCurrentUser(u));
    return unsub;
  }, []);

  // ─── Timer ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "test") return;
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // ─── Restore session from localStorage (including answers) ─────────────────

  // ─── Restore session from localStorage ───────────────────────────────────────
useEffect(() => {
  const cached = localStorage.getItem(SESSION_KEY);
  if (!cached) return;
  try {
    const stored: StoredSession = JSON.parse(cached);
    setRawTestData(stored.testData);
    setAllItems(flattenResponse(stored.testData));
    setSingleAnswers(stored.singleAnswers ?? {});
    setMultiAnswers(stored.multiAnswers ?? {});
    setMatchAnswers(stored.matchAnswers ?? {});
    setCurrentQ(stored.currentQ ?? 0);
    setTimeLeft(stored.timeLeft ?? 180 * 60);
    // ← removed setPhase("test") here, Resume button handles it
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }
}, []);

  // ─── Save session whenever state changes ─────────────────────────────────────

  useEffect(() => {
    if (phase !== "test" || !rawTestData) return;
    const session: StoredSession = {
      testData: rawTestData,
      singleAnswers,
      multiAnswers,
      matchAnswers,
      currentQ,
      timeLeft,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [phase, rawTestData, singleAnswers, multiAnswers, matchAnswers, currentQ, timeLeft]);

  // ─── Time formatting ─────────────────────────────────────────────────────────

  const formatTime = useCallback((s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
  }, []);

  // ─── Subject ordering and ranges ─────────────────────────────────────────────

  const subjectOrder = useMemo<number[]>(() => {
    const seen = new Set<number>(), order: number[] = [];
    for (const item of allItems)
      if (!seen.has(item.subjectNumber)) { seen.add(item.subjectNumber); order.push(item.subjectNumber); }
    return order;
  }, [allItems]);

  const subjectRanges = useMemo<Record<number, { start: number; end: number; name: string }>>(() => {
    const ranges: Record<number, { start: number; end: number; name: string }> = {};
    let i = 0;
    while (i < allItems.length) {
      const subj = allItems[i].subjectNumber, name = allItems[i].subjectName, start = i;
      while (i < allItems.length && allItems[i].subjectNumber === subj) i++;
      ranges[subj] = { start, end: i, name };
    }
    return ranges;
  }, [allItems]);

  // ─── Check if question is answered (using indices) ───────────────────────────

  const isAnswered = useCallback((idx: number): boolean => {
    const it = allItems[idx];
    if (!it) return false;
    if (it.type === "match") {
      const ans = matchAnswers[it.id];
      return !!(ans && Object.keys(ans).length > 0);
    }
    if (it.type === "multiple") {
      return !!(multiAnswers[it.id] && multiAnswers[it.id].length > 0);
    }
    return singleAnswers[it.id] !== undefined;
  }, [allItems, singleAnswers, multiAnswers, matchAnswers]);

  const answeredCount = useMemo(() => allItems.filter((_, i) => isAnswered(i)).length, [allItems, isAnswered]);

  // ─── Answer handlers (using indices) ─────────────────────────────────────────

  const handleSingle = (id: string, optionIndex: number) =>
    setSingleAnswers((p) => ({ ...p, [id]: optionIndex }));

  const handleMulti = (id: string, optionIndex: number) =>
    setMultiAnswers((p) => {
      const cur = p[id] ?? [];
      return { ...p, [id]: cur.includes(optionIndex) ? cur.filter((o) => o !== optionIndex) : [...cur, optionIndex] };
    });

  const handleMatch = (id: string, leftIndex: number, rightIndex: number) =>
    setMatchAnswers((p) => ({
      ...p,
      [id]: { ...(p[id] ?? {}), [leftIndex]: rightIndex },
    }));

  // ─── API calls ───────────────────────────────────────────────────────────────

  const startTest = async () => {
  setPhase("loading"); setError(null);
  try {
    const token = await currentUser?.getIdToken();
    const res = await fetch("https://api-service-xy2qzucrkq-uc.a.run.app/api/test/gettest", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ subject1, subject2 }),
    });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data: ApiTestResponse = await res.json();
    localStorage.removeItem(SESSION_KEY); // clear previous test only after new one loads successfully
    setRawTestData(data);
    setAllItems(flattenResponse(data));
    setCurrentQ(0);
    setTimeLeft(180 * 60);
    setSingleAnswers({});
    setMultiAnswers({});
    setMatchAnswers({});
    setPhase("test");
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load test.");
    setPhase("select");
  }
};

  const submitTest = async () => {
  if (!rawTestData) return;
  setPhase("submitting");

  // ─── Build payload fresh, directly from answer state ───────────────────────
  const payload = buildFreshPayload(rawTestData, singleAnswers, multiAnswers, matchAnswers);

  try {
    const token = await currentUser?.getIdToken();
    const res = await fetch("https://api-service-xy2qzucrkq-uc.a.run.app/api/passtest/passtest", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    localStorage.removeItem(SESSION_KEY);
    navigate("/test-results");
  } catch (err) {
    console.error("Submit failed:", err);
    setError(err instanceof Error ? err.message : "Failed to submit test.");
    setPhase("test"); // allow retry
  }
};

function buildFreshPayload(
  original: ApiTestResponse,
  singleAnswers: SingleMap,
  multiAnswers: MultiMap,
  matchAnswers: MatchMap
): ApiTestResponse {
  // Helper to clone and set isCorrect based on chosen indices
  const setOptions = (options: ApiOption[], chosenIndices: number[]): ApiOption[] =>
    options.map((opt, idx) => ({ ...opt, isCorrect: chosenIndices.includes(idx) }));

  const patchSingle = (qs: ApiSingleQuestion[]) =>
    qs.map((q) => ({
      ...q,
      options: setOptions(q.options, singleAnswers[q.id] !== undefined ? [singleAnswers[q.id]] : []),
    }));

  const patchMultiple = (qs: ApiMultipleQuestion[]) =>
    qs.map((q) => ({
      ...q,
      options: setOptions(q.options, multiAnswers[q.id] ?? []),
    }));

  const patchContextSubs = (subs: ApiContextSubQuestion[]) =>
    subs.map((q) => ({
      ...q,
      options: setOptions(q.options, singleAnswers[q.id] !== undefined ? [singleAnswers[q.id]] : []),
    }));

  const patchContext = (cg: ApiContextQuestion): ApiContextQuestion => ({
    ...cg,
    questions: patchContextSubs(cg.questions),
  });

  const patchMatch = (q: ApiMatchQuestion): ApiMatchQuestion => {
    const rightLen = q.rightSide.length;
    const correctMatches = new Array(q.leftSide.length * rightLen).fill(false);
    const chosen = matchAnswers[q.id];
    if (chosen) {
      Object.entries(chosen).forEach(([leftIdxStr, rightIdx]) => {
        const leftIdx = parseInt(leftIdxStr, 10);
        if (!isNaN(leftIdx) && leftIdx >= 0 && leftIdx < q.leftSide.length && rightIdx >= 0 && rightIdx < rightLen) {
          correctMatches[leftIdx * rightLen + rightIdx] = true;
        }
      });
    }
    return { ...q, correctMatches };
  };

  const patchSection = (s: ApiSubjectSection): ApiSubjectSection => ({
    ...s,
    singleChoiceQuestions: patchSingle(s.singleChoiceQuestions),
    multipleChoiceQuestions: patchMultiple(s.multipleChoiceQuestions),
    contextQuestion: s.contextQuestion ? patchContext(s.contextQuestion) : null,
    matchQuestions: s.matchQuestions.map(patchMatch),
  });

  return {
    kazakhHistory: {
      singleChoiceQuestions: patchSingle(original.kazakhHistory.singleChoiceQuestions),
      contextQuestions: original.kazakhHistory.contextQuestions.map(patchContext),
    },
    mathematicalLiteracy: {
      singleChoiceQuestions: patchSingle(original.mathematicalLiteracy.singleChoiceQuestions),
    },
    functionalLiteracy: {
      contextQuestions: original.functionalLiteracy.contextQuestions.map(patchContext),
    },
    secondarySubject1: patchSection(original.secondarySubject1),
    secondarySubject2: patchSection(original.secondarySubject2),
  };
}

  const cancelTest = () => {
    navigate("/studenthome");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SELECT / LOADING SCREEN
  // ─────────────────────────────────────────────────────────────────────────────

  if (phase === "select" || phase === "loading") {
    const available2 = SECONDARY_SUBJECT_NUMBERS.filter((n) => String(n) !== subject1);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <GraduationCap className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">ҰБТ сынақ тест</h1>
            <p className="text-muted-foreground mt-1">Бастау үшін бейіндік пәндерді таңдаңыз</p>
          </div>

          <Card className="shadow-lg border-border/60">
            <CardContent className="pt-6 space-y-5">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Міндетті пәндер</p>
                <div className="flex flex-wrap gap-2">
                  <Badge>Қазақстан тарихы</Badge>
                  <Badge>Математикалық сауаттылық</Badge>
                  <Badge>Оқу сауаттылығы</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Бейіндік пән 1</label>
                <Select value={subject1} onValueChange={setSubject1}>
                  <SelectTrigger><SelectValue placeholder="Пәнді таңдаңыз" /></SelectTrigger>
                  <SelectContent>
                    {SECONDARY_SUBJECT_NUMBERS.map((n) => (
                      <SelectItem key={n} value={String(n)}>{SUBJECT_NAMES[n]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Бейіндік пән 2</label>
                <Select value={subject2} onValueChange={setSubject2}>
                  <SelectTrigger><SelectValue placeholder="Пәнді таңдаңыз" /></SelectTrigger>
                  <SelectContent>
                    {available2.map((n) => (
                      <SelectItem key={n} value={String(n)}>{SUBJECT_NAMES[n]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {localStorage.getItem(SESSION_KEY) && (
  <Button className="w-full" variant="outline" onClick={() => setPhase("test")}>
    Жүктелген тестті жалғастыру
  </Button>
)}
              <Button className="w-full gap-2" disabled={!subject1 || !subject2 || phase === "loading"} onClick={startTest}>
                {phase === "loading"
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Тест жүктелуде…</>
                  : <><PlayCircle className="h-5 w-5" /> Тестті бастау</>
                }
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST SCREEN
  // ─────────────────────────────────────────────────────────────────────────────

  const total = allItems.length;
  const item = allItems[currentQ];
  if (!item) return null;
  const isSubmitting = phase === "submitting";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 md:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">{item.subjectName}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
            </div>
            <Badge variant="outline">{answeredCount}/{total} Жауап берілді</Badge>
            <Button size="sm" className="gap-1.5" disabled={isSubmitting} onClick={submitTest}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Аяқталуда</> : <><Send className="h-4 w-4" /> Аяқтау</>}
            </Button>
            <Button size="sm" variant="outline" onClick={cancelTest}>
              Болдырмау
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-2 flex gap-1 overflow-x-auto pb-1">
          {subjectOrder.map((subj) => {
            const range = subjectRanges[subj];
            if (!range) return null;
            const answered = Array.from({ length: range.end - range.start }, (_, i) => isAnswered(range.start + i)).filter(Boolean).length;
            return (
              <button key={subj} onClick={() => setCurrentQ(range.start)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  item.subjectNumber === subj
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}>
                {range.name} <span className="opacity-70">({answered}/{range.end - range.start})</span>
              </button>
            );
          })}
        </div>

        <div className="max-w-6xl mx-auto mt-2">
          <Progress value={(answeredCount / total) * 100} className="h-1.5" />
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-6 flex gap-6">
        <div className="flex-1 space-y-4" key={currentQ}>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{item.subjectName}</Badge>
            <Badge variant="outline">
              {item.type === "match" ? "Сәйкестендіру" : item.type === "multiple" ? "Бірнеше жауап" : "Бір жауап"}
            </Badge>
            {item.context && <Badge variant="outline">Контекст {item.context.questionIndex + 1}/{item.context.totalQuestions}</Badge>}
            <span className="text-sm text-muted-foreground ml-auto">{currentQ + 1} / {total}</span>
          </div>

          {item.context && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Контекст</p>
                {item.context.imageLink && <img src={item.context.imageLink} alt="Context" className="mb-3 rounded-lg max-h-56 object-contain" />}
                <MathText text={item.context.text} className="text-sm text-foreground leading-relaxed whitespace-pre-line" />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              {item.imageLink && <img src={item.imageLink} alt="Question" className="mb-4 rounded-lg max-h-56 object-contain" />}
              <MathText text={item.text} className="text-foreground leading-relaxed" />
            </CardContent>
          </Card>

          {item.type === "match" ? (
            <MatchAnswerArea
              item={item}
              matchAnswers={matchAnswers}
              onAnswer={handleMatch}
            />
          ) : item.type === "multiple" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Select <strong>all</strong> correct answers</p>
              {item.options?.map((opt, idx) => (
                <OptionButton
                  key={idx}
                  option={opt}
                  selected={(multiAnswers[item.id] ?? []).includes(idx)}
                  onClick={() => handleMulti(item.id, idx)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {item.options?.map((opt, idx) => (
                <OptionButton
                  key={idx}
                  option={opt}
                  selected={singleAnswers[item.id] === idx}
                  onClick={() => handleSingle(item.id, idx)}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ((c) => c - 1)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Алдыңғы
            </Button>
            <Button variant="outline" className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
              disabled={isSubmitting} onClick={submitTest}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Аяқталуда</> : <><Send className="h-4 w-4" /> Аяқтау</>}
            </Button>
            <Button disabled={currentQ === total - 1} onClick={() => setCurrentQ((c) => c + 1)} className="gap-1">
              Келесі <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="hidden lg:block w-56 shrink-0">
          <Card className="sticky top-36">
            <CardContent className="pt-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <p className="text-sm font-medium text-muted-foreground mb-3">Сұрақтар</p>
              {subjectOrder.map((subj) => {
                const range = subjectRanges[subj];
                if (!range) return null;
                return (
                  <div key={subj} className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5 truncate">{range.name}</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {Array.from({ length: range.end - range.start }, (_, i) => {
                        const idx = range.start + i;
                        return (
                          <button key={idx} onClick={() => setCurrentQ(idx)}
                            className={`h-7 w-7 rounded-md text-xs font-medium transition-colors ${
                              idx === currentQ ? "bg-primary text-primary-foreground"
                              : isAnswered(idx) ? "bg-secondary text-secondary-foreground"
                              : "bg-muted text-muted-foreground"
                            }`}>
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-secondary" /> Жауап берілді</div>
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-muted" /> Жауап берілмеді</div>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <Button className="w-full gap-1.5" size="sm" disabled={isSubmitting} onClick={submitTest}>
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {isSubmitting ? "Аяқталуда" : "Аяқтау"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Option button (unchanged UI) ─────────────────────────────────────────────

function OptionButton({ option, selected, onClick }: { option: ApiOption; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
        selected ? "border-primary bg-primary/5 text-foreground font-medium"
                 : "border-border hover:border-primary/40 text-foreground"
      }`}>
      {option.imageLink && <img src={option.imageLink} alt="" className="mb-2 max-h-20 object-contain rounded" />}
      <MathText text={option.text} />
    </button>
  );
}

// ─── Match answer component (using indices) ───────────────────────────────────

function MatchAnswerArea({ item, matchAnswers, onAnswer }: {
  item: FlatItem;
  matchAnswers: MatchMap;
  onAnswer: (id: string, leftIdx: number, rightIdx: number) => void;
}) {
  const current = matchAnswers[item.id] ?? {};
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Match each item on the left with the correct answer on the right:</p>
      {item.leftSide?.map((left, leftIdx) => (
        <div key={leftIdx} className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-start gap-2">
            {left.imageLink && <img src={left.imageLink} alt="" className="max-h-12 object-contain rounded" />}
            <MathText text={left.text} className="font-medium text-sm text-foreground" />
          </div>
          <div className="flex flex-wrap gap-2 pl-1">
            {item.rightSide?.map((right, rightIdx) => {
              const selected = current[leftIdx] === rightIdx;
              return (
                <button
                  key={rightIdx}
                  onClick={() => onAnswer(item.id, leftIdx, rightIdx)}
                  className={`px-3 py-1.5 rounded-md border text-sm transition-all ${
                    selected ? "border-primary bg-primary/10 text-foreground font-medium"
                             : "border-border hover:border-primary/40 text-foreground"
                  }`}
                >
                  {right.imageLink && <img src={right.imageLink} alt="" className="max-h-10 object-contain mb-1 rounded" />}
                  <MathText text={right.text} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}