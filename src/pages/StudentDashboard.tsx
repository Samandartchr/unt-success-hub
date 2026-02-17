import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Trophy, Users, PlayCircle, TrendingUp, Clock, Eye, Send, Bell, Check, X,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";

const scoreData = [
  { test: "Test 1", score: 82 },
  { test: "Test 2", score: 78 },
  { test: "Test 3", score: 91 },
  { test: "Test 4", score: 85 },
  { test: "Test 5", score: 95 },
];

const testHistory = [
  { id: 1, date: "2026-02-14", subjects: "Math + Physics", score: 95, time: "2h 35m" },
  { id: 2, date: "2026-02-10", subjects: "Math + Physics", score: 85, time: "2h 50m" },
  { id: 3, date: "2026-02-06", subjects: "Math + Physics", score: 91, time: "2h 40m" },
  { id: 4, date: "2026-01-29", subjects: "Math + Physics", score: 78, time: "2h 55m" },
  { id: 5, date: "2026-01-22", subjects: "Math + Physics", score: 82, time: "2h 45m" },
];

const initialInvitations = [
  { id: 1, group: "Chemistry Prep", groupId: "GRP-007", teacher: "teacher_01" },
  { id: 2, group: "World History Advanced", groupId: "GRP-009", teacher: "teacher_03" },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [groupIdInput, setGroupIdInput] = useState("");
  const [joinRequests, setJoinRequests] = useState([
    { group: "Physics Advanced", status: "Pending" },
    { group: "Math Olympiad", status: "Accepted" },
  ]);
  const [joinedGroups] = useState([
    { name: "Physics Advanced", id: "GRP-001", members: 12 },
    { name: "Math Olympiad", id: "GRP-002", members: 8 },
    { name: "Biology Prep", id: "GRP-003", members: 15 },
  ]);
  const [invitations, setInvitations] = useState(initialInvitations);

  const isGroupsPage = location.pathname === "/groups";

  const handleSendJoinRequest = () => {
    if (!groupIdInput.trim()) {
      toast({ title: "Enter a Group ID", variant: "destructive" });
      return;
    }
    setJoinRequests((prev) => [...prev, { group: groupIdInput.trim(), status: "Pending" }]);
    toast({ title: "Join request sent", description: `Requested to join group ${groupIdInput}` });
    setGroupIdInput("");
  };

  const handleAcceptInvitation = (inv: typeof initialInvitations[0]) => {
    setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
    toast({ title: "Invitation accepted", description: `You joined "${inv.group}"` });
  };

  const handleRejectInvitation = (inv: typeof initialInvitations[0]) => {
    setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
    toast({ title: "Invitation declined", description: `Declined invitation to "${inv.group}"` });
  };

  if (isGroupsPage) {
    return (
      <AppLayout role="student">
        <div className="page-container space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Groups</h1>
            <p className="text-muted-foreground">Manage your group memberships</p>
          </div>

          {/* Invitations */}
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
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
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
                        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => handleRejectInvitation(inv)}>
                          <X className="h-3.5 w-3.5" /> Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">My Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {joinRequests.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium">{r.group}</span>
                      <Badge variant={r.status === "Accepted" ? "default" : "outline"}>
                        {r.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Joined Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Group ID</TableHead>
                    <TableHead>Members</TableHead>
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
                        <Badge variant="secondary">{g.members}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={(e) => { e.stopPropagation(); navigate(`/group/${g.id}?role=student`); }}
                        >
                          <Eye className="h-3.5 w-3.5" /> View
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

  return (
    <AppLayout role="student">
      <div className="page-container space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and prepare for UNT</p>
        </div>

        {/* Invitation banner */}
        {invitations.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-medium text-foreground">
                  You have {invitations.length} pending group invitation{invitations.length > 1 ? "s" : ""}
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
                <p className="text-2xl font-bold text-foreground">95 / 140</p>
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
                <p className="text-2xl font-bold text-foreground">{joinedGroups.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card sm:col-span-2 lg:col-span-1">
            <CardContent className="p-0">
              <Button className="w-full h-full py-4 text-base gap-2" onClick={() => navigate("/mock-test")}>
                <PlayCircle className="h-5 w-5" />
                Start New Mock Test
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Score chart */}
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
                <LineChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="test" className="text-xs fill-muted-foreground" tick={{ fill: 'hsl(215, 12%, 50%)' }} />
                  <YAxis domain={[60, 140]} className="text-xs fill-muted-foreground" tick={{ fill: 'hsl(215, 12%, 50%)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="hsl(210, 70%, 45%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(210, 70%, 45%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* All test history */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              All Test Results
            </CardTitle>
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
                  <TableRow key={t.id}>
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
                      <Button variant="ghost" size="sm" onClick={() => navigate("/test-results")}>
                        <Eye className="h-4 w-4" />
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