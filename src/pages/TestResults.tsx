import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Target, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const summary = {
  total: 95,
  max: 140,
  correct: 72,
  incorrect: 38,
  unanswered: 10,
  time: "2h 35m",
};

const subjects = [
  { name: "Math Literacy", score: 18, max: 20, pct: 90 },
  { name: "Reading Literacy", score: 15, max: 20, pct: 75 },
  { name: "History of KZ", score: 14, max: 20, pct: 70 },
  { name: "Math", score: 27, max: 40, pct: 67 },
  { name: "Physics", score: 21, max: 40, pct: 52 },
];

const questionTypeData = [
  { type: "Single Choice", pct: 82 },
  { type: "Multiple Choice", pct: 65 },
  { type: "Matching", pct: 58 },
  { type: "Context", pct: 70 },
];

const questionReview = [
  { num: 1, subject: "Math Literacy", type: "single", text: "A store offers a 20% discount...", yours: "C) 4,000", correct: "C) 4,000", isCorrect: true },
  { num: 2, subject: "Reading Literacy", type: "single", text: "Identify the main idea of the passage...", yours: "A) Growing", correct: "B) Irrigation shrink", isCorrect: false },
  { num: 3, subject: "Physics", type: "multiple", text: "Which are scalar quantities?", yours: "A, C, E", correct: "A, C, E", isCorrect: true },
];

export default function TestResults() {
  const navigate = useNavigate();

  return (
    <AppLayout role="student">
      <div className="page-container space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Test Report</h1>
            <p className="text-muted-foreground">Math + Physics — Feb 14, 2026</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="stat-card">
            <CardContent className="p-0 text-center">
              <Target className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{summary.total}</p>
              <p className="text-xs text-muted-foreground">/ {summary.max} Score</p>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-0 text-center">
              <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{summary.correct}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-0 text-center">
              <XCircle className="h-5 w-5 text-destructive mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{summary.incorrect}</p>
              <p className="text-xs text-muted-foreground">Incorrect</p>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-0 text-center">
              <Clock className="h-5 w-5 text-info mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{summary.time}</p>
              <p className="text-xs text-muted-foreground">Time Taken</p>
            </CardContent>
          </Card>
        </div>

        {/* Subject breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subject Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjects.map((s) => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="text-muted-foreground">{s.score}/{s.max} ({s.pct}%)</span>
                </div>
                <Progress value={s.pct} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Performance by type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance by Question Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={questionTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(215, 12%, 50%)' }} />
                  <YAxis type="category" dataKey="type" tick={{ fill: 'hsl(215, 12%, 50%)', fontSize: 12 }} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, "Correct"]}
                  />
                  <Bar dataKey="pct" fill="hsl(170, 55%, 42%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Question review */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Question Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {questionReview.map((q) => (
              <div
                key={q.num}
                className={`p-4 rounded-lg border ${
                  q.isCorrect ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {q.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">Q{q.num}</span>
                      <Badge variant="outline" className="text-xs">{q.subject}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{q.type}</Badge>
                    </div>
                    <p className="text-sm text-foreground">{q.text}</p>
                    <div className="flex gap-4 text-xs">
                      <span className="text-muted-foreground">
                        Your answer: <strong className="text-foreground">{q.yours}</strong>
                      </span>
                      {!q.isCorrect && (
                        <span className="text-success">
                          Correct: <strong>{q.correct}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
