import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, UserPlus, PlusCircle, Settings, Send, X } from "lucide-react";

const groups = [
  { name: "Physics Advanced", id: "GRP-001", students: 24 },
  { name: "Math Olympiad", id: "GRP-002", students: 18 },
  { name: "Biology Basics", id: "GRP-003", students: 31 },
];

const pendingInvitations = [
  { nickname: "alex_92", group: "Physics Advanced" },
  { nickname: "dana_k", group: "Math Olympiad" },
];

const joinRequests = [
  { nickname: "murat_05", group: "Physics Advanced" },
  { nickname: "aisha_n", group: "Biology Basics" },
];

export default function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <AppLayout role="teacher">
      <div className="page-container space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Manage your groups and students</p>
          </div>
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Group
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="stat-card">
            <CardContent className="p-0 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Groups</p>
                <p className="text-2xl font-bold text-foreground">{groups.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-0 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-foreground">73</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Groups table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">My Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Group ID</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{g.id}</Badge>
                    </TableCell>
                    <TableCell>{g.students}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/group/${g.id}`)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Invite & Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Invite Student</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Student Nickname</Label>
                <Input placeholder="Enter student nickname" />
              </div>
              <div className="space-y-2">
                <Label>Select Group</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Choose group..." /></SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full gap-2">
                <Send className="h-4 w-4" />
                Send Invitation
              </Button>
              {pendingInvitations.length > 0 && (
                <div className="pt-3 border-t border-border space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Pending Invitations</p>
                  {pendingInvitations.map((inv, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <div>
                        <span className="text-sm font-medium">{inv.nickname}</span>
                        <span className="text-xs text-muted-foreground ml-2">→ {inv.group}</span>
                      </div>
                      <Button variant="ghost" size="sm"><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Join Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {joinRequests.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.nickname}</TableCell>
                      <TableCell className="text-muted-foreground">{r.group}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="default" className="h-7 text-xs">Accept</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs">Reject</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
