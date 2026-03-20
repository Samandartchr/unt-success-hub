import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, UserMinus, Copy, Eye, TrendingUp, TrendingDown, Minus, AlertCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import {
  getGroupInfo,
  getGroupStudents,
  getGroupResults,
  getStudentResults,
  removeStudent,
  subjectBreakdown,
  formatDate,
  TOTAL_MAX,
  type TestResultClient,
  type UserPublicInfo,
  type GroupPublic,
} from "@/lib/apiClient";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function trend(results: TestResultClient[]): "up" | "down" | "stable" {
  if (results.length < 2) return "stable";
  const sorted = [...results].sort(
    (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()
  );
  const last = sorted[sorted.length - 1].totalScore;
  const prev = sorted[sorted.length - 2].totalScore;
  if (last > prev + 2) return "up";
  if (last < prev - 2) return "down";
  return "stable";
}

function scoreBadgeClass(score: number): string {
  const pct = (score / TOTAL_MAX) * 100;
  if (pct >= 70) return "bg-success/15 text-success border-success/30";
  if (pct >= 50) return "";
  return "bg-destructive/10 text-destructive border-destructive/30";
}

// ─── Skeleton helpers ──────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

// ─── Student row data (enriched with computed stats) ──────────────────────────

interface StudentRow {
  info: UserPublicInfo;
  results: TestResultClient[];
  avgScore: number;
  lastScore: number | null;
  trend: "up" | "down" | "stable";
}

// ─── Subject avg chart data from group results ─────────────────────────────────

function buildSubjectAvgs(results: TestResultClient[], sub1?: string, sub2?: string) {
  if (!results.length) return [];
  return [
    {
      subject: "Math Lit.",
      avg: avg(results.map((r) => r.mathematicalLiteracyScore)),
    },
    {
      subject: "Func. Lit.",
      avg: avg(results.map((r) => r.functionalLiteracyScore)),
    },
    {
      subject: "KZ History",
      avg: avg(results.map((r) => r.kazakhHistoryScore)),
    },
    ...(sub1
      ? [{ subject: sub1.slice(0, 8), avg: avg(results.map((r) => r.secondarySubject1Score)) }]
      : []),
    ...(sub2
      ? [{ subject: sub2.slice(0, 8), avg: avg(results.map((r) => r.secondarySubject2Score)) }]
      : []),
  ];
}

// ─── Per-student history dialog ────────────────────────────────────────────────

function StudentHistoryDialog({
  student,
  open,
  onClose,
  isTeacher,
}: {
  student: StudentRow | null;
  open: boolean;
  onClose: () => void;
  isTeacher: boolean;
}) {
  const [selectedResult, setSelectedResult] = useState<TestResultClient | null>(null);

  useEffect(() => {
    if (!open) setSelectedResult(null);
  }, [open]);

  if (!student) return null;

  const sorted = [...student.results].sort(
    (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
  );
  const chartData = [...sorted]
    .reverse()
    .map((r, i) => ({ label: `T${i + 1}`, score: r.totalScore, date: formatDate(r.takenAt) }));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {selectedResult ? (
              <>
                <button
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setSelectedResult(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span>Test Report — {student.info.username}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {formatDate(selectedResult.takenAt)}
                </span>
              </>
            ) : (
              <>
                <span>Test History — {student.info.username}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Avg: {student.avgScore}/140 · {sorted.length} tests
                </span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {selectedResult ? (
          /* ── Report view ── */
          <div className="space-y-4 mt-2">
            {/* Total */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-3 text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-primary">
                  {selectedResult.totalScore}
                  <span className="text-base font-normal text-muted-foreground"> / 140</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total Score</p>
              </div>
            </div>

            {/* Subject breakdown */}
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-foreground">Subject Breakdown</p>
              {subjectBreakdown(selectedResult).map((s) => (
                <div key={s.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{s.name}</span>
                    <span className="text-muted-foreground">
                      {s.score}/{s.max} ({s.pct}%)
                    </span>
                  </div>
                  <Progress value={s.pct} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── History list ── */
          <div className="space-y-4 mt-2">
            {chartData.length > 1 && (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 12 }} />
                    <YAxis domain={[0, 140]} tick={{ fill: "hsl(215, 12%, 50%)" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(v: number) => [v + "/140", "Score"]}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.date ?? label}
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
            )}

            {sorted.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No tests taken yet.
              </div>
            ) : (
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
                  {sorted.map((r, i) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelectedResult(r)}
                    >
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {i + 1}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(r.takenAt)}</TableCell>
                      <TableCell className="font-medium text-sm">
                        {r.secondarySubject1} + {r.secondarySubject2}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={scoreBadgeClass(r.totalScore)}>
                          {r.totalScore}/140
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={(e) => { e.stopPropagation(); setSelectedResult(r); }}
                        >
                          <Eye className="h-3.5 w-3.5" /> Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const role = (searchParams.get("role") as "teacher" | "student") || "teacher";
  const isStudent = role === "student";

  // Auth
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getAuth>["currentUser"]>(null);

  // Data
  const [groupInfo, setGroupInfo] = useState<GroupPublic | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [groupResults, setGroupResults] = useState<TestResultClient[]>([]);

  // Loading / error states
  const [pageLoading, setPageLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);

  // Remove confirm
  const [removeTarget, setRemoveTarget] = useState<StudentRow | null>(null);
  const [removing, setRemoving] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), async (user) => {
      setCurrentUser(user);
      if (!user || !id) { setPageLoading(false); return; }

      try {
        const [info, grpResults] = await Promise.all([
          getGroupInfo(id),
          getGroupResults(id),
        ]);
        setGroupInfo(info);
        setGroupResults(grpResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load group.");
      } finally {
        setPageLoading(false);
      }

      // Fetch students + their individual results in parallel
      setStudentsLoading(true);
      try {
        const studentList = await getGroupStudents(id);

        // Fetch each student's results concurrently
        const rows = await Promise.all(
          studentList.map(async (s): Promise<StudentRow> => {
            try {
              const res = await getStudentResults(s.username);
              const sorted = [...res].sort(
                (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
              );
              return {
                info: s,
                results: sorted,
                avgScore: avg(sorted.map((r) => r.totalScore)),
                lastScore: sorted[0]?.totalScore ?? null,
                trend: trend(sorted),
              };
            } catch {
              // If student results fetch fails, still show student with no results
              return {
                info: s,
                results: [],
                avgScore: 0,
                lastScore: null,
                trend: "stable",
              };
            }
          })
        );

        setStudents(rows);
      } catch (err) {
        console.error("Failed to load students:", err);
      } finally {
        setStudentsLoading(false);
      }
    });
    return unsub;
  }, [id]);

  // ── Remove student ────────────────────────────────────────────────────────────

  const handleRemoveStudent = async () => {
    if (!removeTarget || !id) return;
    setRemoving(true);
    try {
      await removeStudent(id, removeTarget.info.username);
      setStudents((prev) => prev.filter((s) => s.info.username !== removeTarget.info.username));
      toast({
        title: "Student removed",
        description: `${removeTarget.info.username} removed from the group.`,
      });
    } catch (err) {
      toast({ title: "Failed to remove student", variant: "destructive" });
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────────

  const groupAvg = students.length
    ? avg(students.filter((s) => s.avgScore > 0).map((s) => s.avgScore))
    : 0;

  const topStudent = students.length
    ? students.reduce((a, b) => (a.avgScore > b.avgScore ? a : b))
    : null;

  const needsHelp = students.filter((s) => s.avgScore > 0).length
    ? students
        .filter((s) => s.avgScore > 0)
        .reduce((a, b) => (a.avgScore < b.avgScore ? a : b))
    : null;

  const mostActive = students.length
    ? students.reduce((a, b) => (a.results.length > b.results.length ? a : b))
    : null;

  // Subject avg chart — use group results for aggregate view
  const subjectAvgData = groupResults.length
    ? buildSubjectAvgs(
        groupResults,
        groupResults[0]?.secondarySubject1,
        groupResults[0]?.secondarySubject2
      )
    : [];

  // ── Copy group ID ─────────────────────────────────────────────────────────────

  const copyGroupId = () => {
    if (id) {
      navigator.clipboard.writeText(id);
      toast({ title: "Group ID copied" });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <AppLayout role={role}>
        <div className="page-container">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-4 flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role={role}>
      <div className="page-container space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            {pageLoading ? (
              <>
                <Skeleton className="h-7 w-48 mb-1" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground">
                  {groupInfo?.groupName ?? "Group"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono text-xs">{id}</Badge>
                  {!isStudent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground gap-1"
                      onClick={copyGroupId}
                    >
                      <Copy className="h-3 w-3" /> Copy ID
                    </Button>
                  )}
                  {groupInfo?.teacherUsername && (
                    <span className="text-xs text-muted-foreground">
                      Teacher: {groupInfo.teacherUsername}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Group stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {pageLoading || studentsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="stat-card">
                <CardSkeleton />
              </Card>
            ))
          ) : (
            <>
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
                  {topStudent && topStudent.avgScore > 0 ? (
                    <>
                      <p className="text-lg font-bold text-foreground">
                        {topStudent.info.username}
                      </p>
                      <p className="text-sm text-success font-medium">
                        {topStudent.avgScore}/140 avg
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data yet</p>
                  )}
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardContent className="p-0">
                  <p className="text-sm text-muted-foreground mb-1">
                    {isStudent ? "Most Active" : "Needs Attention"}
                  </p>
                  {isStudent && mostActive ? (
                    <>
                      <p className="text-lg font-bold text-foreground">
                        {mostActive.info.username}
                      </p>
                      <p className="text-sm text-primary font-medium">
                        {mostActive.results.length} tests taken
                      </p>
                    </>
                  ) : !isStudent && needsHelp && needsHelp.avgScore > 0 ? (
                    <>
                      <p className="text-lg font-bold text-foreground">
                        {needsHelp.info.username}
                      </p>
                      <p className="text-sm text-destructive font-medium">
                        {needsHelp.avgScore}/140 avg
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data yet</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Subject performance chart */}
        {subjectAvgData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Average Score by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectAvgData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="subject" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(215, 12%, 50%)" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="avg" fill="hsl(210, 70%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isStudent ? "Group Members" : `Students (${students.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No students in this group yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Last Test</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.info.username}>
                      <TableCell className="font-medium">{s.info.username}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.info.name} {s.info.surname}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {s.avgScore > 0 ? `${s.avgScore}/140` : "—"}
                          </Badge>
                          {s.avgScore > 0 && (
                            <div className="w-16">
                              <Progress value={(s.avgScore / 140) * 100} className="h-1.5" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {s.lastScore !== null ? `${s.lastScore}/140` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{s.results.length}</Badge>
                      </TableCell>
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
                            onClick={() => {
                              setSelectedStudent(s);
                              setStudentDialogOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" /> History
                          </Button>
                          {!isStudent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setRemoveTarget(s)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student history dialog */}
      <StudentHistoryDialog
        student={selectedStudent}
        open={studentDialogOpen}
        onClose={() => { setStudentDialogOpen(false); setSelectedStudent(null); }}
        isTeacher={!isStudent}
      />

      {/* Remove student confirm dialog */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{removeTarget?.info.username}</strong> from this group? They will lose
              access to group data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={removing}
              onClick={handleRemoveStudent}
            >
              {removing ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}