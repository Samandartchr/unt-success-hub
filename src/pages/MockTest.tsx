import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Clock, ChevronLeft, ChevronRight, Flag, Send, BookOpen, GraduationCap, PlayCircle,
} from "lucide-react";

// ─── Question type definitions ─────────────────────────────────────────────────

interface SingleQuestion {
  id: number;
  subject: string;
  text: string;
  type: "single";
  options: string[];
  context?: { text?: string; image?: string };
}

interface MultipleQuestion {
  id: number;
  subject: string;
  text: string;
  type: "multiple";
  options: string[];
  context?: { text?: string; image?: string };
}

interface ContextGroup {
  id: number;
  subject: string;
  type: "context-group";
  context: { text?: string; image?: string };
  questions: { id: number; text: string; options: string[] }[];
}

interface MatchQuestion {
  id: number;
  subject: string;
  text: string;
  type: "match";
  context?: { text?: string; image?: string };
  leftItems: string[];
  rightOptions: string[];
}

type Question = SingleQuestion | MultipleQuestion | ContextGroup | MatchQuestion;

// ─── Sample question banks per subject ──────────────────────────────────────────

const kazakhHistoryQuestions: Question[] = [
  {
    id: 101, subject: "Kazakh History", type: "single", text: "When was the Kazakh Khanate founded?",
    options: ["A) 1365", "B) 1465", "C) 1565", "D) 1665"],
  },
  {
    id: 102, subject: "Kazakh History", type: "single", text: "Who was the first khan of the Kazakh Khanate?",
    options: ["A) Ablai Khan", "B) Kerey Khan", "C) Tauke Khan", "D) Kasym Khan"],
  },
  {
    id: 110, subject: "Kazakh History", type: "context-group",
    context: { text: "The Kazakh steppe was home to numerous tribal confederations throughout history. The division of the Kazakh people into three jüz (hordes) — the Great, Middle, and Small — played a significant role in the political and social organization of Kazakh society." },
    questions: [
      { id: 111, text: "Which jüz traditionally occupied the southern regions of Kazakhstan?", options: ["A) Great Jüz", "B) Middle Jüz", "C) Small Jüz", "D) None"] },
      { id: 112, text: "What was the primary purpose of the jüz system?", options: ["A) Military", "B) Trade", "C) Territorial & political organization", "D) Religious"] },
      { id: 113, text: "Which jüz was most associated with Semirechye?", options: ["A) Great Jüz", "B) Middle Jüz", "C) Small Jüz", "D) All equally"] },
      { id: 114, text: "The jüz system emerged primarily during which centuries?", options: ["A) 10th-12th", "B) 13th-14th", "C) 15th-17th", "D) 18th-19th"] },
      { id: 115, text: "Which khan is credited with unifying the three jüz?", options: ["A) Kerey Khan", "B) Ablai Khan", "C) Tauke Khan", "D) Kasym Khan"] },
    ],
  },
];

const mathLiteracyQuestions: Question[] = [
  {
    id: 201, subject: "Math Literacy", type: "single", text: "A store offers a 20% discount on a product priced at 5,000 tenge. What is the final price?",
    options: ["A) 3,000 tenge", "B) 3,500 tenge", "C) 4,000 tenge", "D) 4,500 tenge", "E) 5,000 tenge"],
  },
  {
    id: 202, subject: "Math Literacy", type: "single", text: "If a car travels 180 km in 3 hours, what is the average speed?",
    options: ["A) 40 km/h", "B) 50 km/h", "C) 60 km/h", "D) 70 km/h", "E) 80 km/h"],
  },
];

const functionalLiteracyQuestions: Question[] = [
  {
    id: 301, subject: "Functional Literacy", type: "context-group",
    context: { text: "A survey of 500 high school students found that 60% preferred online learning, 25% preferred traditional classroom learning, and 15% had no preference. The survey also found that students who preferred online learning spent an average of 4.5 hours per day on digital devices." },
    questions: [
      { id: 311, text: "How many students preferred online learning?", options: ["A) 200", "B) 250", "C) 300", "D) 350", "E) 400"] },
      { id: 312, text: "How many students preferred traditional learning?", options: ["A) 75", "B) 100", "C) 125", "D) 150", "E) 175"] },
      { id: 313, text: "What percentage of students had a preference?", options: ["A) 75%", "B) 80%", "C) 85%", "D) 90%", "E) 95%"] },
      { id: 314, text: "If 40% of online learners are male, how many females prefer online?", options: ["A) 120", "B) 150", "C) 180", "D) 200", "E) 210"] },
      { id: 315, text: "What is the main finding of this survey?", options: ["A) Students dislike school", "B) Majority prefer online learning", "C) No one uses devices", "D) Teachers are absent", "E) School is closing"] },
    ],
  },
];

const secondarySubjectQuestions: Record<string, Question[]> = {
  Physics: [
    { id: 401, subject: "Physics", type: "single", text: "What is the SI unit of force?", options: ["A) Watt", "B) Joule", "C) Newton", "D) Pascal", "E) Ampere"] },
    { id: 402, subject: "Physics", type: "multiple", text: "Which of the following are scalar quantities? Select all that apply.", options: ["A) Mass", "B) Velocity", "C) Temperature", "D) Force", "E) Energy", "F) Acceleration"] },
    {
      id: 410, subject: "Physics", type: "context-group",
      context: { text: "A ball is thrown vertically upward with an initial velocity of 20 m/s. Assuming g = 10 m/s² and no air resistance." },
      questions: [
        { id: 411, text: "What is the maximum height reached?", options: ["A) 10 m", "B) 15 m", "C) 20 m", "D) 25 m", "E) 30 m"] },
        { id: 412, text: "How long does it take to reach maximum height?", options: ["A) 1 s", "B) 2 s", "C) 3 s", "D) 4 s", "E) 5 s"] },
        { id: 413, text: "What is the velocity at the highest point?", options: ["A) 20 m/s", "B) 10 m/s", "C) 5 m/s", "D) 0 m/s", "E) -10 m/s"] },
        { id: 414, text: "What is the total time of flight?", options: ["A) 2 s", "B) 3 s", "C) 4 s", "D) 5 s", "E) 6 s"] },
        { id: 415, text: "What is the displacement after the ball returns?", options: ["A) 20 m", "B) 10 m", "C) 0 m", "D) -20 m", "E) 40 m"] },
      ],
    },
    {
      id: 420, subject: "Physics", type: "match", text: "Match each physical quantity with its unit.",
      context: { text: "The International System of Units (SI) defines base and derived units for physical quantities." },
      leftItems: ["Force", "Energy"],
      rightOptions: ["Newton", "Joule", "Watt", "Pascal"],
    },
  ],
  Math: [
    { id: 501, subject: "Math", type: "single", text: "What is the derivative of x²?", options: ["A) x", "B) 2x", "C) x²", "D) 2", "E) 0"] },
    { id: 502, subject: "Math", type: "multiple", text: "Which are even numbers? Select all.", options: ["A) 2", "B) 3", "C) 4", "D) 5", "E) 6", "F) 7"] },
    {
      id: 510, subject: "Math", type: "match", text: "Match the function with its derivative.",
      leftItems: ["sin(x)", "e^x"],
      rightOptions: ["cos(x)", "e^x", "-sin(x)", "1/x"],
    },
  ],
  Chemistry: [
    { id: 601, subject: "Chemistry", type: "single", text: "What is the chemical symbol for Gold?", options: ["A) Ag", "B) Au", "C) Fe", "D) Cu", "E) Pb"] },
    { id: 602, subject: "Chemistry", type: "multiple", text: "Which are noble gases? Select all.", options: ["A) Helium", "B) Nitrogen", "C) Neon", "D) Oxygen", "E) Argon", "F) Carbon"] },
    {
      id: 610, subject: "Chemistry", type: "match", text: "Match the element with its symbol.",
      leftItems: ["Sodium", "Iron"],
      rightOptions: ["Na", "Fe", "K", "Cu"],
    },
  ],
  Biology: [
    { id: 701, subject: "Biology", type: "single", text: "What is the powerhouse of the cell?", options: ["A) Nucleus", "B) Ribosome", "C) Mitochondria", "D) Golgi apparatus", "E) ER"] },
    { id: 702, subject: "Biology", type: "multiple", text: "Which are components of DNA? Select all.", options: ["A) Adenine", "B) Uracil", "C) Thymine", "D) Glucose", "E) Guanine", "F) Ribose"] },
    {
      id: 710, subject: "Biology", type: "context-group",
      context: { text: "Photosynthesis is the process by which green plants convert CO₂ and H₂O into glucose and O₂ using sunlight. The light reactions occur in the thylakoids, while the Calvin cycle occurs in the stroma." },
      questions: [
        { id: 711, text: "Where do light reactions take place?", options: ["A) Stroma", "B) Thylakoids", "C) Cytoplasm", "D) Nucleus", "E) Vacuole"] },
        { id: 712, text: "What is the main product of the Calvin cycle?", options: ["A) O₂", "B) H₂O", "C) Glucose", "D) CO₂", "E) ATP"] },
        { id: 713, text: "Which gas is released during photosynthesis?", options: ["A) CO₂", "B) N₂", "C) O₂", "D) H₂", "E) CH₄"] },
        { id: 714, text: "What pigment captures sunlight?", options: ["A) Melanin", "B) Hemoglobin", "C) Chlorophyll", "D) Keratin", "E) Carotene"] },
        { id: 715, text: "What is the overall equation input besides CO₂?", options: ["A) O₂", "B) H₂O", "C) Glucose", "D) ATP", "E) NADPH"] },
      ],
    },
  ],
  Geography: [
    { id: 801, subject: "Geography", type: "single", text: "What is the capital of Kazakhstan?", options: ["A) Almaty", "B) Astana", "C) Shymkent", "D) Karaganda", "E) Aktobe"] },
    { id: 802, subject: "Geography", type: "multiple", text: "Which are landlocked countries? Select all.", options: ["A) Kazakhstan", "B) Japan", "C) Mongolia", "D) Brazil", "E) Uzbekistan", "F) Australia"] },
  ],
  "World History": [
    { id: 901, subject: "World History", type: "single", text: "In what year did World War II end?", options: ["A) 1943", "B) 1944", "C) 1945", "D) 1946", "E) 1947"] },
    { id: 902, subject: "World History", type: "multiple", text: "Which countries were part of the Allied Powers in WWII? Select all.", options: ["A) USA", "B) Germany", "C) UK", "D) Japan", "E) USSR", "F) Italy"] },
  ],
  "Computer Science": [
    { id: 1001, subject: "Computer Science", type: "single", text: "What does CPU stand for?", options: ["A) Central Process Unit", "B) Central Processing Unit", "C) Computer Personal Unit", "D) Central Program Unit", "E) Core Processing Unit"] },
    { id: 1002, subject: "Computer Science", type: "multiple", text: "Which are programming languages? Select all.", options: ["A) Python", "B) HTML", "C) Java", "D) Photoshop", "E) C++", "F) Excel"] },
  ],
  English: [
    { id: 1101, subject: "English", type: "single", text: "What is the past tense of 'go'?", options: ["A) Goed", "B) Gone", "C) Went", "D) Going", "E) Goes"] },
  ],
  Law: [
    { id: 1201, subject: "Law", type: "single", text: "What is the supreme law of Kazakhstan?", options: ["A) Civil Code", "B) Constitution", "C) Criminal Code", "D) Tax Code", "E) Labor Code"] },
  ],
};

const secondarySubjectsList = ["Physics", "Math", "Chemistry", "Biology", "Geography", "World History", "Computer Science", "English", "Law"];

// ─── Flatten questions for navigation ──────────────────────────────────────────

interface FlatItem {
  question: SingleQuestion | MultipleQuestion | MatchQuestion | { id: number; text: string; options: string[]; type: "single"; subject: string };
  contextGroup?: ContextGroup;
  subIndex?: number;
}

function flattenQuestions(questions: Question[]): FlatItem[] {
  const items: FlatItem[] = [];
  for (const q of questions) {
    if (q.type === "context-group") {
      q.questions.forEach((sub, i) => {
        items.push({
          question: { ...sub, type: "single" as const, subject: q.subject },
          contextGroup: q,
          subIndex: i,
        });
      });
    } else {
      items.push({ question: q });
    }
  }
  return items;
}

// ─── Answer types ──────────────────────────────────────────────────────────────

type AnswerMap = Record<number, string[]>;
type MatchAnswerMap = Record<number, Record<string, string>>;

// ─── Component ─────────────────────────────────────────────────────────────────

export default function MockTest() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"select" | "test">("select");
  const [subject1, setSubject1] = useState("");
  const [subject2, setSubject2] = useState("");
  const [allItems, setAllItems] = useState<FlatItem[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [matchAnswers, setMatchAnswers] = useState<MatchAnswerMap>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(150 * 60); // 2h30m

  // Timer
  useEffect(() => {
    if (phase !== "test") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const formatTime = useCallback((s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }, []);

  const startTest = () => {
    const questions: Question[] = [
      ...kazakhHistoryQuestions,
      ...mathLiteracyQuestions,
      ...functionalLiteracyQuestions,
      ...(secondarySubjectQuestions[subject1] || []),
      ...(secondarySubjectQuestions[subject2] || []),
    ];
    setAllItems(flattenQuestions(questions));
    setPhase("test");
  };

  // ─── Subject selection screen ────────────────────────────────────────────────

  if (phase === "select") {
    const available2 = secondarySubjectsList.filter((s) => s !== subject1);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <GraduationCap className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">UNT Mock Test</h1>
            <p className="text-muted-foreground mt-1">Select your two profile subjects to begin</p>
          </div>

          <Card className="shadow-lg border-border/60">
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mandatory subjects</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Kazakh History</Badge>
                    <Badge>Math Literacy</Badge>
                    <Badge>Functional Literacy</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Profile Subject 1</label>
                  <Select value={subject1} onValueChange={setSubject1}>
                    <SelectTrigger><SelectValue placeholder="Choose subject..." /></SelectTrigger>
                    <SelectContent>
                      {secondarySubjectsList.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Profile Subject 2</label>
                  <Select value={subject2} onValueChange={setSubject2}>
                    <SelectTrigger><SelectValue placeholder="Choose subject..." /></SelectTrigger>
                    <SelectContent>
                      {available2.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full gap-2" disabled={!subject1 || !subject2} onClick={startTest}>
                <PlayCircle className="h-5 w-5" />
                Start Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Test interface ──────────────────────────────────────────────────────────

  const total = allItems.length;
  const item = allItems[currentQ];
  const q = item.question;
  const answeredCount = Object.keys(answers).length + Object.keys(matchAnswers).length;

  const toggleAnswer = (qId: number, option: string, type: string) => {
    setAnswers((prev) => {
      const current = prev[qId] || [];
      if (type === "single") return { ...prev, [qId]: [option] };
      return {
        ...prev,
        [qId]: current.includes(option) ? current.filter((o) => o !== option) : [...current, option],
      };
    });
  };

  const setMatchAnswer = (qId: number, leftItem: string, rightOption: string) => {
    setMatchAnswers((prev) => ({
      ...prev,
      [qId]: { ...(prev[qId] || {}), [leftItem]: rightOption },
    }));
  };

  const toggleMark = () => {
    setMarked((prev) => {
      const next = new Set(prev);
      next.has(currentQ) ? next.delete(currentQ) : next.add(currentQ);
      return next;
    });
  };

  const isAnswered = (idx: number) => {
    const it = allItems[idx];
    if (!it) return false;
    if ("leftItems" in it.question && it.question.type === "match") {
      return !!matchAnswers[it.question.id];
    }
    return !!answers[it.question.id];
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 md:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">{q.subject}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
            </div>
            <Badge variant="outline">{answeredCount}/{total} answered</Badge>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-2">
          <Progress value={(answeredCount / total) * 100} className="h-1.5" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-6 py-6 flex gap-6">
        <div className="flex-1 space-y-4 animate-fade-in" key={currentQ}>
          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{q.subject}</Badge>
            <Badge variant="outline" className="capitalize">
              {q.type === "match" ? "Matching" : q.type === "multiple" ? "Multiple choice" : "Single choice"}
            </Badge>
            {item.contextGroup && <Badge variant="outline">Context Q{(item.subIndex || 0) + 1}/5</Badge>}
            <span className="text-sm text-muted-foreground ml-auto">
              Question {currentQ + 1} of {total}
            </span>
          </div>

          {/* Context block */}
          {item.contextGroup?.context && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Context</p>
                {item.contextGroup.context.image && (
                  <div className="mb-3 rounded-lg overflow-hidden bg-muted flex items-center justify-center h-40">
                    <span className="text-muted-foreground text-sm">[Image placeholder]</span>
                  </div>
                )}
                {item.contextGroup.context.text && (
                  <p className="text-sm text-foreground leading-relaxed">{item.contextGroup.context.text}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Match context */}
          {"type" in q && q.type === "match" && (q as MatchQuestion).context && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Context</p>
                {(q as MatchQuestion).context?.text && (
                  <p className="text-sm text-foreground leading-relaxed">{(q as MatchQuestion).context!.text}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Question */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-foreground leading-relaxed whitespace-pre-line">{q.text}</p>
            </CardContent>
          </Card>

          {/* Answer area */}
          {q.type === "match" ? (
            <MatchAnswerArea
              question={q as MatchQuestion}
              matchAnswers={matchAnswers}
              setMatchAnswer={setMatchAnswer}
            />
          ) : (
            <div className="space-y-2">
              {q.options.map((option) => {
                const selected = (answers[q.id] || []).includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggleAnswer(q.id, option, q.type)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                      selected
                        ? "border-primary bg-primary/5 text-foreground font-medium"
                        : "border-border hover:border-primary/40 text-foreground"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ((c) => c - 1)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button variant={marked.has(currentQ) ? "default" : "outline"} onClick={toggleMark} className="gap-1">
              <Flag className="h-4 w-4" /> {marked.has(currentQ) ? "Marked" : "Mark"}
            </Button>
            {currentQ < total - 1 ? (
              <Button onClick={() => setCurrentQ((c) => c + 1)} className="gap-1">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => navigate("/test-results")} className="gap-1">
                <Send className="h-4 w-4" /> Submit
              </Button>
            )}
          </div>
        </div>

        {/* Palette */}
        <div className="hidden lg:block w-48 shrink-0">
          <Card className="sticky top-28">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Questions</p>
              <div className="grid grid-cols-5 gap-1.5 max-h-80 overflow-y-auto">
                {allItems.map((_, i) => {
                  const answered = isAnswered(i);
                  const isMarked = marked.has(i);
                  const isCurrent = i === currentQ;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentQ(i)}
                      className={`h-8 w-8 rounded-md text-xs font-medium transition-colors ${
                        isCurrent ? "bg-primary text-primary-foreground"
                        : isMarked ? "bg-accent text-accent-foreground"
                        : answered ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-secondary" /> Answered</div>
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-accent" /> Marked</div>
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-muted" /> Unanswered</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Match answer component ────────────────────────────────────────────────────

function MatchAnswerArea({
  question,
  matchAnswers,
  setMatchAnswer,
}: {
  question: MatchQuestion;
  matchAnswers: MatchAnswerMap;
  setMatchAnswer: (qId: number, left: string, right: string) => void;
}) {
  const current = matchAnswers[question.id] || {};

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Match each item on the left with the correct option on the right:</p>
      {question.leftItems.map((left) => (
        <div key={left} className="flex items-center gap-4 p-3 rounded-lg border border-border">
          <span className="font-medium text-sm text-foreground min-w-[120px]">{left}</span>
          <span className="text-muted-foreground">→</span>
          <div className="flex flex-wrap gap-2 flex-1">
            {question.rightOptions.map((right) => {
              const selected = current[left] === right;
              return (
                <button
                  key={right}
                  onClick={() => setMatchAnswer(question.id, left, right)}
                  className={`px-3 py-1.5 rounded-md border text-sm transition-all ${
                    selected
                      ? "border-primary bg-primary/10 text-foreground font-medium"
                      : "border-border hover:border-primary/40 text-foreground"
                  }`}
                >
                  {right}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
