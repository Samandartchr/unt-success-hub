import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Target, Eye, TrendingUp, AlertCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getMyResults,
  subjectBreakdown,
  formatDate,
  subjectLabel,
  TOTAL_MAX,
  type TestResultClient,
} from "@/lib/apiClient";

// ─── Score badge colour ────────────────────────────────────────────────────────

function scoreBadgeClass(score: number): string {
  const pct = (score / TOTAL_MAX) * 100;
  if (pct >= 70) return "bg-success/15 text-success border-success/30";
  if (pct >= 50) return "";
  return "bg-destructive/10 text-destructive border-destructive/30";
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

// ─── Report view ───────────────────────────────────────────────────────────────

function ReportView({
  result,
  onBack,
}: {
  result: TestResultClient;
  onBack: () => void;
}) {
  const breakdown = subjectBreakdown(result);

  const barData = breakdown.map((s) => ({ subject: s.name, score: s.score, max: s.max }));

  return (
    <AppLayout role="student">
      <div className="page-container space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Test Report</h1>
            <p className="text-muted-foreground">
              {subjectLabel(result)} — {formatDate(result.takenAt)}
            </p>
          </div>
        </div>

        {/* Total score card */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-4xl font-extrabold text-foreground">
                  {result.totalScore}
                  <span className="text-lg font-normal text-muted-foreground"> / {TOTAL_MAX}</span>
                </p>
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Progress value={(result.totalScore / TOTAL_MAX) * 100} className="h-3" />
              <p className="text-right text-sm text-muted-foreground mt-1">
                {Math.round((result.totalScore / TOTAL_MAX) * 100)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subject breakdown bars */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subject Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {breakdown.map((s) => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="text-muted-foreground">
                    {s.score}/{s.max}{" "}
                    <span className="text-xs">({s.pct}%)</span>
                  </span>
                </div>
                <Progress value={s.pct} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Score by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="subject"
                    tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fill: "hsl(215, 12%, 50%)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, _: string, entry: { payload: { max: number } }) => [
                      `${value} / ${entry.payload.max}`,
                      "Score",
                    ]}
                  />
                  <Bar dataKey="score" fill="hsl(210, 70%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function TestResults() {
  const navigate = useNavigate();
  const location = useLocation();

  const [results, setResults] = useState<TestResultClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<TestResultClient | null>(null);

  // If navigated from dashboard with a result id, pre-select it once loaded
  const preSelectId = (location.state as { resultId?: string } | null)?.resultId ?? null;

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), async (user) => {
      if (!user) { setLoading(false); return; }
      try {
        const data = await getMyResults();
        // Sort newest first
        const sorted = [...data].sort(
          (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
        );
        setResults(sorted);
        if (preSelectId) {
          const found = sorted.find((r) => r.id === preSelectId);
          if (found) setSelectedResult(found);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load results.");
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  // Show report if one is selected
  if (selectedResult) {
    return (
      <ReportView result={selectedResult} onBack={() => setSelectedResult(null)} />
    );
  }

  // Chart data (oldest → newest for progression)
  const chartData = [...results]
    .reverse()
    .map((r, i) => ({
      label: `T${i + 1}`,
      score: r.totalScore,
      date: formatDate(r.takenAt),
    }));

  const latestScore = results[0]?.totalScore ?? null;
  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.totalScore, 0) / results.length)
      : null;
  const bestScore = results.length > 0 ? Math.max(...results.map((r) => r.totalScore)) : null;

  return (
    <AppLayout role="student">
      <div className="page-container space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Results</h1>
            <p className="text-muted-foreground">
              {loading ? "Loading…" : `${results.length} test${results.length !== 1 ? "s" : ""} taken`}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-3 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </CardContent>
          </Card>
        )}

        {/* Summary stats */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Latest", value: latestScore },
              { label: "Average", value: avgScore },
              { label: "Best", value: bestScore },
            ].map((s) => (
              <Card key={s.label} className="stat-card">
                <CardContent className="p-0 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {s.value ?? "—"}
                    <span className="text-sm font-normal text-muted-foreground"> /140</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Score progression chart */}
        {!loading && chartData.length > 1 && (
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
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fill: "hsl(215, 12%, 50%)" }} />
                    <YAxis domain={[0, 140]} tick={{ fill: "hsl(215, 12%, 50%)" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(v: number) => [v + "/140", "Score"]}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.date ?? label
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(210, 70%, 45%)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "hsl(210, 70%, 45%)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All tests table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">All Tests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton />
            ) : results.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No tests taken yet.</p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate("/mock-test")}
                >
                  Take Your First Test
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>History</TableHead>
                    <TableHead>Math Lit.</TableHead>
                    <TableHead>Func. Lit.</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelectedResult(r)}
                    >
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {i + 1}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(r.takenAt)}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {r.secondarySubject1} + {r.secondarySubject2}
                      </TableCell>
                      <TableCell className="text-sm">{r.kazakhHistoryScore}/20</TableCell>
                      <TableCell className="text-sm">{r.mathematicalLiteracyScore}/20</TableCell>
                      <TableCell className="text-sm">{r.functionalLiteracyScore}/20</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={scoreBadgeClass(r.totalScore)}
                        >
                          {r.totalScore}/140
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedResult(r);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" /> Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}