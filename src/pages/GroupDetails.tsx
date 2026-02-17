import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, UserMinus, Copy, Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";

// ─── Data ──────────────────────────────────────────────────────────────────────

const students = [
  { nickname: "amir_t",    avgScore: 88, lastScore: 92, tests: 6, trend: "up"     },
  { nickname: "zarina_k",  avgScore: 75, lastScore: 80, tests: 5, trend: "up"     },
  { nickname: "daniyar_m", avgScore: 93, lastScore: 95, tests: 7, trend: "stable" },
  { nickname: "aigerim_s", avgScore: 70, lastScore: 68, tests: 4, trend: "down"   },
  { nickname: "nurlan_b",  avgScore: 82, lastScore: 85, tests: 6, trend: "up"     },
];

const subjectPerformance = [
  { subject: "Math Lit.",    avg: 18 },
  { subject: "Reading Lit.", avg: 15 },
  { subject: "History KZ",   avg: 16 },
  { subject: "Math",         avg: 22 },
  { subject: "Physics",      avg: 19 },
];

type TestEntry = { date: string; score: number; subjects: string; correct: number; incorrect: number; time: string };

const studentTestHistory: Record<string, TestEntry[]> = {
  "amir_t": [
    { date: "2026-02-14", score: 92, subjects: "Math + Physics", correct: 70, incorrect: 40, time: "2h 30m" },
    { date: "2026-02-07", score: 88, subjects: "Math + Physics", correct: 67, incorrect: 43, time: "2h 42m" },
    { date: "2026-01-31", score: 85, subjects: "Math + Physics", correct: 64, incorrect: 46, time: "2h 50m" },
    { date: "2026-01-24", score: 91, subjects: "Math + Physics", correct: 69, incorrect: 41, time: "2h 35m" },
    { date: "2026-01-17", score: 84, subjects: "Math + Physics", correct: 63, incorrect: 47, time: "2h 48m" },
    { date: "2026-01-10", score: 88, subjects: "Math + Physics", correct: 67, incorrect: 43, time: "2h 40m" },
  ],
  "zarina_k": [
    { date: "2026-02-12", score: 80, subjects: "Math + Physics", correct: 61, incorrect: 49, time: "2h 55m" },
    { date: "2026-02-05", score: 75, subjects: "Math + Physics", correct: 57, incorrect: 53, time: "3h 00m" },
    { date: "2026-01-29", score: 72, subjects: "Math + Physics", correct: 55, incorrect: 55, time: "3h 05m" },
    { date: "2026-01-22", score: 78, subjects: "Math + Physics", correct: 59, incorrect: 51, time: "2h 58m" },
    { date: "2026-01-15", score: 70, subjects: "Math + Physics", correct: 53, incorrect: 57, time: "3h 10m" },
  ],
  "daniyar_m": [
    { date: "2026-02-15", score: 95, subjects: "Math + Physics", correct: 72, incorrect: 38, time: "2h 20m" },
    { date: "2026-02-08", score: 94, subjects: "Math + Physics", correct: 71, incorrect: 39, time: "2h 22m" },
    { date: "2026-02-01", score: 92, subjects: "Math + Physics", correct: 70, incorrect: 40, time: "2h 28m" },
    { date: "2026-01-25", score: 91, subjects: "Math + Physics", correct: 69, incorrect: 41, time: "2h 30m" },
    { date: "2026-01-18", score: 95, subjects: "Math + Physics", correct: 72, incorrect: 38, time: "2h 18m" },
    { date: "2026-01-11", score: 93, subjects: "Math + Physics", correct: 70, incorrect: 40, time: "2h 25m" },
    { date: "2026-01-04", score: 90, subjects: "Math + Physics", correct: 68, incorrect: 42, time: "2h 35m" },
  ],
  "aigerim_s": [
    { date: "2026-02-10", score: 68, subjects: "Math + Physics", correct: 52, incorrect: 58, time: "3h 15m" },
    { date: "2026-02-03", score: 72, subjects: "Math + Physics", correct: 55, incorrect: 55, time: "3h 08m" },
    { date: "2026-01-27", score: 70, subjects: "Math + Physics", correct: 53, incorrect: 57, time: "3h 12m" },
    { date: "2026-01-20", score: 71, subjects: "Math + Physics", correct: 54, incorrect: 56, time: "3h 10m" },
  ],
  "nurlan_b": [
    { date: "2026-02-13", score: 85, subjects: "Math + Physics", correct: 64, incorrect: 46, time: "2h 48m" },
    { date: "2026-02-06", score: 82, subjects: "Math + Physics", correct: 62, incorrect: 48, time: "2h 52m" },
    { date: "2026-01-30", score: 80, subjects: "Math + Physics", correct: 61, incorrect: 49, time: "2h 55m" },
    { date: "2026-01-23", score: 83, subjects: "Math + Physics", correct: 63, incorrect: 47, time: "2h 50m" },
    { date: "2026-01-16", score: 81, subjects: "Math + Physics", correct: 61, incorrect: 49, time: "2h 53m" },
    { date: "2026-01-09", score: 79, subjects: "Math + Physics", correct: 60, incorrect: 50, time: "2h 58m" },
  ],
};

const subjectBreakdown = [
  { name: "Math Literacy",    score: 18, max: 20, pct: 90 },
  { name: "Reading Literacy", score: 15, max: 20, pct: 75 },
  { name: "History of KZ",    score: 14, max: 20, pct: 70 },
  { name: "Math",             score: 27, max: 40, pct: 67 },
  { name: "Physics",          score: 21, max: 40, pct: 52 },
];

const questionTypeData = [
  { type: "Single Choice",   pct: 82 },
  { type: "Multiple Choice", pct: 65 },
  { type: "Matching",        pct: 58 },
  { type: "Context",         pct: 70 },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = (searchParams.get("role") as "teacher" | "student") || "teacher";
  const isStudent = role === "student";

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestEntry | null>(null);

  const selected = selectedStudent ? students.find((s) => s.nickname === selectedStudent) : null;
  const history = selectedStudent ? studentTestHistory[selectedStudent] || [] : [];
  const chartData = [...history].reverse().map((t, i) => ({ label: `T${i + 1}`, score: t.score, date: t.date }));

  const groupAvg = Math.round(students.reduce((sum, s) => sum + s.avgScore, 0) / students.length);
  const topStudent = students.reduce((a, b) => a.avgScore > b.avgScore ? a : b);
  const needsHelp = students.reduce((a, b) => a.avgScore < b.avgScore ? a : b);
  const mostActive = students.reduce((a, b) => a.tests > b.tests ? a : b);

  return (
    <AppLayout role={role}>
      <div className="page-container space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Physics Advanced</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-xs">{id}</Badge>
              {!isStudent && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground gap-1">
                  <Copy className="h-3 w-3" /> Copy ID
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Group stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="stat-card">
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground mb-1">Group Average</p>
              <p className="text-2xl font-bold text-foreground">{groupAvg}/140</p>
              <Progress value={(groupAvg / 140) * 100} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground mb-1">Top Performer</p>
              <p className="text-lg font-bold text-foreground">{topStudent.nickname}</p>
              <p className="text-sm text-success font-medium">{topStudent.avgScore}/140 avg</p>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground mb-1">{isStudent ? "Most Active" : "Needs Attention"}</p>
              <p className="text-lg font-bold text-foreground">{isStudent ? mostActive.nickname : needsHelp.nickname}</p>
              <p className={`text-sm font-medium ${isStudent ? "text-primary" : "text-destructive"}`}>
                {isStudent ? `${mostActive.tests} tests taken` : `${needsHelp.avgScore}/140 avg`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Subject performance chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Average Score by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="subject" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(215, 12%, 50%)" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="avg" fill="hsl(210, 70%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Members table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isStudent ? "Group Members" : `Students (${students.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nickname</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Last Test</TableHead>
                  <TableHead>Tests Taken</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.nickname}>
                    <TableCell className="font-medium">{s.nickname}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{s.avgScore}/140</Badge>
                        <div className="w-16">
                          <Progress value={(s.avgScore / 140) * 100} className="h-1.5" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{s.lastScore}/140</TableCell>
                    <TableCell><Badge variant="outline">{s.tests}</Badge></TableCell>
                    <TableCell>
                      {s.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : s.trend === "down" ? (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => { setSelectedStudent(s.nickname); setSelectedTest(null); }}
                        >
                          <Eye className="h-3.5 w-3.5" /> History
                        </Button>
                        {!isStudent && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* History / Report dialog */}
      <Dialog
        open={!!selectedStudent}
        onOpenChange={(open) => { if (!open) { setSelectedStudent(null); setSelectedTest(null); } }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              {selectedTest ? (
                <>
                  <button
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setSelectedTest(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <span>Test Report — {selectedStudent}</span>
                  <span className="text-sm font-normal text-muted-foreground">{selectedTest.date}</span>
                </>
              ) : (
                <>
                  <span>Test History — {selectedStudent}</span>
                  {selected && (
                    <span className="text-sm font-normal text-muted-foreground">
                      Avg: {selected.avgScore}/140 · {selected.tests} tests
                    </span>
                  )}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedTest ? (
            /* ── Report view ── */
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Score",     value: `${selectedTest.score}/140`, color: "text-primary"     },
                  { label: "Correct",   value: selectedTest.correct,        color: "text-success"     },
                  { label: "Incorrect", value: selectedTest.incorrect,      color: "text-destructive" },
                  { label: "Time",      value: selectedTest.time,           color: "text-foreground"  },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 rounded-lg bg-muted/50">
                    <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-foreground">Subject Breakdown</p>
                {subjectBreakdown.map((s) => (
                  <div key={s.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{s.name}</span>
                      <span className="text-muted-foreground">{s.score}/{s.max} ({s.pct}%)</span>
                    </div>
                    <Progress value={s.pct} className="h-1.5" />
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Performance by Question Type</p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={questionTypeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} />
                      <YAxis type="category" dataKey="type" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} width={110} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                        formatter={(value: number) => [`${value}%`, "Correct"]}
                      />
                      <Bar dataKey="pct" fill="hsl(170, 55%, 42%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            /* ── History list view ── */
            <div className="space-y-4 mt-2">
              {chartData.length > 0 && (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 12 }} />
                      <YAxis domain={[50, 140]} tick={{ fill: "hsl(215, 12%, 50%)" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                        formatter={(value: number) => [value + "/140", "Score"]}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.date ?? label}
                      />
                      <Line type="monotone" dataKey="score" stroke="hsl(210, 70%, 45%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(210, 70%, 45%)" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((t, i) => (
                    <TableRow
                      key={i}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelectedTest(t)}
                    >
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}