import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Trophy, Users, PlayCircle, TrendingUp, Clock, Eye, Send, Bell, Check, X,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getMyResults, formatDate, subjectLabel, TOTAL_MAX, type TestResultClient } from "@/lib/apiClient";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function scoreBadgeClass(score: number): string {
  const pct = (score / TOTAL_MAX) * 100;
  if (pct >= 70) return "bg-success/15 text-success border-success/30";
  if (pct >= 50) return "";
  return "bg-destructive/10 text-destructive border-destructive/30";
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [groupIdInput, setGroupIdInput] = useState("");
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getAuth>["currentUser"]>(null);

  // Test results
  const [results, setResults] = useState<TestResultClient[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);

  // Groups
  const [joinedGroups, setJoinedGroups] = useState<{ id: string; name: string }[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  // Invitations
  const [invitations, setInvitations] = useState<
    { id: string; group: string; groupId: string; teacher: string }[]
  >([]);
  const [invLoading, setInvLoading] = useState(true);

  const isGroupsPage = location.pathname === "/groups";

  // ── Auth + data fetch ────────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), async (user) => {
      setCurrentUser(user);
      if (!user) {
        setResultsLoading(false);
        setGroupsLoading(false);
        setInvLoading(false);
        return;
      }

      const token = await user.getIdToken();

      // Fetch test results
      getMyResults()
        .then((data) => {
          const sorted = [...data].sort(
            (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
          );
          setResults(sorted);
        })
        .catch(console.error)
        .finally(() => setResultsLoading(false));

      // Fetch joined groups
      fetch("http://localhost:5275/api/group/getjoinedgroups", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data: { groupId: string; groupName: string }[]) => setJoinedGroups(data.map((g) => ({ id: g.groupId, name: g.groupName }))))
        .catch(console.error)
        .finally(() => setGroupsLoading(false));

      // Fetch invitations
      fetch("http://localhost:5275/api/membership/getrequests", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data: { id: string; groupName: string; groupId: string; senderUsername: string }[]) =>
          setInvitations(
            data.map((d) => ({
              id: d.id,
              group: d.groupName,
              groupId: d.groupId,
              teacher: d.senderUsername,
            }))
          )
        )
        .catch(console.error)
        .finally(() => setInvLoading(false));
    });
    return unsub;
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleSendJoinRequest = async () => {
    if (!groupIdInput.trim()) {
      toast({ title: "Enter a Group ID", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("http://localhost:5275/api/membership/sendrequest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await currentUser?.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId: groupIdInput }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Join request sent", description: `Requested to join group ${groupIdInput}` });
      setGroupIdInput("");
    } catch (error) {
      toast({ title: "Failed to send request", variant: "destructive" });
    }
  };

  const handleAcceptInvitation = async (inv: typeof invitations[0]) => {
    try {
      const res = await fetch("http://localhost:5275/api/membership/acceptasstudent", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await currentUser?.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId: inv.groupId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      toast({ title: "Invitation accepted", description: `You joined "${inv.group}"` });
    } catch (error) {
      toast({ title: "Failed to accept invitation", variant: "destructive" });
    }
  };

  const handleRejectInvitation = async (inv: typeof invitations[0]) => {
    try {
      const res = await fetch("http://localhost:5275/api/membership/removeorder", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await currentUser?.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId: inv.groupId, username: inv.teacher }),
      });
      if (!res.ok) throw new Error(await res.text());
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      toast({ title: "Invitation declined", description: `Declined invitation to "${inv.group}"` });
    } catch (error) {
      toast({ title: "Failed to decline invitation", variant: "destructive" });
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────────

  const latestScore = results[0]?.totalScore ?? null;
  const chartData = [...results]
    .reverse()
    .map((r, i) => ({ test: `T${i + 1}`, score: r.totalScore, date: formatDate(r.takenAt) }));

  // ── Groups page ───────────────────────────────────────────────────────────────

  if (isGroupsPage) {
    return (
      <AppLayout role="student">
        <div className="page-container space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Groups</h1>
            <p className="text-muted-foreground">Manage your group memberships</p>
          </div>

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Pending Invitations
                  <Badge className="ml-1">{invitations.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{inv.group}</p>
                        <p className="text-xs text-muted-foreground">
                          Invited by {inv.teacher} · ID: {inv.groupId}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 gap-1" onClick={() => handleAcceptInvitation(inv)}>
                          <Check className="h-3.5 w-3.5" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1"
                          onClick={() => handleRejectInvitation(inv)}
                        >
                          <X className="h-3.5 w-3.5" /> Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Join a group */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Join a Group</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Group ID"
                  value={groupIdInput}
                  onChange={(e) => setGroupIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendJoinRequest()}
                />
                <Button size="sm" className="gap-1" onClick={handleSendJoinRequest}>
                  <Send className="h-4 w-4" /> Send
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Joined groups */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Joined Groups</CardTitle>
            </CardHeader>
            <CardContent>
              {groupsLoading ? (
                <TableSkeleton />
              ) : joinedGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  You haven't joined any groups yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group Name</TableHead>
                      <TableHead>Group ID</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {joinedGroups.map((g) => (
                      <TableRow
                        key={g.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => navigate(`/group/${g.id}?role=student`)}
                      >
                        <TableCell className="font-medium">{g.name}</TableCell>
                        <TableCell className="text-muted-foreground">{g.id}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/group/${g.id}?role=student`);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" /> View
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

  // ── Main Dashboard ────────────────────────────────────────────────────────────

  return (
    <AppLayout role="student">
      <div className="page-container space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Home</h1>
          <p className="text-muted-foreground">Track your progress and prepare for UNT</p>
        </div>

        {/* Invitation banner */}
        {invitations.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-medium text-foreground">
                  You have {invitations.length} pending group invitation
                  {invitations.length > 1 ? "s" : ""}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/groups")}>
                View
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="stat-card">
            <CardContent className="p-0 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Latest Score</p>
                {resultsLoading ? (
                  <Skeleton className="h-7 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {latestScore !== null ? `${latestScore} / 140` : "No tests yet"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-0 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined Groups</p>
                {groupsLoading ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{joinedGroups.length}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card sm:col-span-2 lg:col-span-1">
            <CardContent className="p-0">
              <Button
                className="w-full h-full py-4 text-base gap-2"
                onClick={() => navigate("/mock-test")}
              >
                <PlayCircle className="h-5 w-5" />
                Start New Mock Test
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Score progression chart */}
        {!resultsLoading && chartData.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Score Progression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="test" tick={{ fill: "hsl(215, 12%, 50%)" }} />
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
            </CardContent>
          </Card>
        )}

        {/* Test history table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              All Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resultsLoading ? (
              <TableSkeleton />
            ) : results.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No tests taken yet.</p>
                <Button size="sm" className="mt-3" onClick={() => navigate("/mock-test")}>
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
                    <TableHead>Score</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() =>
                        navigate("/test-results", { state: { resultId: r.id } })
                      }
                    >
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {i + 1}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(r.takenAt)}</TableCell>
                      <TableCell className="font-medium">{subjectLabel(r)}</TableCell>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/test-results", { state: { resultId: r.id } });
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