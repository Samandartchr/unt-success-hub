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
  Trophy, Users, PlayCircle, TrendingUp, Clock, Eye, Send,
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
  { date: "2026-02-14", subjects: "Math + Physics", score: 95, time: "2h 35m" },
  { date: "2026-02-10", subjects: "Math + Physics", score: 85, time: "2h 50m" },
  { date: "2026-02-06", subjects: "Math + Physics", score: 91, time: "2h 40m" },
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

  if (isGroupsPage) {
    return (
      <AppLayout role="student">
        <div className="page-container space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Groups</h1>
            <p className="text-muted-foreground">Manage your group memberships</p>
          </div>

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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {joinedGroups.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell className="text-muted-foreground">{g.id}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{g.members}</Badge>
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

        {/* Test history */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Recent Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testHistory.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">{t.date}</TableCell>
                    <TableCell className="font-medium">{t.subjects}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t.score}/140</Badge>
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
