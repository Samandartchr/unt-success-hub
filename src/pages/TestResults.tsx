import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Target, Eye, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

// ─── Data ──────────────────────────────────────────────────────────────────────

const testHistory = [
  { id: 1, date: "2026-02-14", subjects: "Math + Physics", score: 95, time: "2h 35m", correct: 72, incorrect: 38, unanswered: 10 },
  { id: 2, date: "2026-02-10", subjects: "Math + Physics", score: 85, time: "2h 50m", correct: 64, incorrect: 48, unanswered: 8 },
  { id: 3, date: "2026-02-06", subjects: "Math + Physics", score: 91, time: "2h 40m", correct: 69, incorrect: 41, unanswered: 10 },
  { id: 4, date: "2026-01-29", subjects: "Math + Physics", score: 78, time: "2h 55m", correct: 59, incorrect: 55, unanswered: 6 },
  { id: 5, date: "2026-01-22", subjects: "Math + Physics", score: 82, time: "2h 45m", correct: 62, incorrect: 50, unanswered: 8 },
];

const subjectBreakdown = [
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

const scoreChartData = [...testHistory].reverse().map((t, i) => ({ label: `T${i + 1}`, score: t.score, date: t.date }));

// ─── Component ─────────────────────────────────────────────────────────────────

export default function TestResults() {
  const navigate = useNavigate();
  const [selectedTest, setSelectedTest] = useState<typeof testHistory[0] | null>(null);

  // ── Report view ───────────────────────────────────────────────────────────────
  if (selectedTest) {
    return (
      <AppLayout role="student">
        <div className="page-container space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedTest(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Test Report</h1>
              <p className="text-muted-foreground">{selectedTest.subjects} — {selectedTest.date}</p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="stat-card">
              <CardContent className="p-0 text-center">
                <Target className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">{selectedTest.score}</p>
                <p className="text-xs text-muted-foreground">/ 140 Score</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-0 text-center">
                <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">{selectedTest.correct}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-0 text-center">
                <XCircle className="h-5 w-5 text-destructive mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">{selectedTest.incorrect}</p>
                <p className="text-xs text-muted-foreground">Incorrect</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-0 text-center">
                <Clock className="h-5 w-5 text-info mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">{selectedTest.time}</p>
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
              {subjectBreakdown.map((s) => (
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

          {/* Performance by question type */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Performance by Question Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={questionTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(215, 12%, 50%)" }} />
                    <YAxis type="category" dataKey="type" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 12 }} width={120} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      formatter={(value: number) => [`${value}%`, "Correct"]}
                    />
                    <Bar dataKey="pct" fill="hsl(170, 55%, 42%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // ── History list view ─────────────────────────────────────────────────────────
  return (
    <AppLayout role="student">
      <div className="page-container space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Results</h1>
            <p className="text-muted-foreground">{testHistory.length} tests taken</p>
          </div>
        </div>

        {/* Score progression chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Score Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fill: "hsl(215, 12%, 50%)" }} />
                  <YAxis domain={[60, 140]} tick={{ fill: "hsl(215, 12%, 50%)" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value: number) => [value + "/140", "Score"]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.date ?? label}
                  />
                  <Line type="monotone" dataKey="score" stroke="hsl(210, 70%, 45%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(210, 70%, 45%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* All tests */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">All Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testHistory.map((t, i) => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelectedTest(t)}>
                    <TableCell className="text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
                    <TableCell className="text-muted-foreground">{t.date}</TableCell>
                    <TableCell className="font-medium">{t.subjects}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          t.score >= 90 ? "bg-success/15 text-success border-success/30" :
                          t.score >= 75 ? "" :
                          "bg-destructive/10 text-destructive border-destructive/30"
                        }
                      >
                        {t.score}/140
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.time}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={(e) => { e.stopPropagation(); setSelectedTest(t); }}
                      >
                        <Eye className="h-3.5 w-3.5" /> Report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}