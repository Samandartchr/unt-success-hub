import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Users, UserPlus, PlusCircle, Settings, Send, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
} from "firebase/auth";

let user;
let groups;

//Follow the user state
onAuthStateChanged(getAuth(), (u) => {
  user = u;
  console.log("User:", user);
  GetGroups();
  console.log("Groups:", groups);
});

//Get the groups of the teacher
async function GetGroups()
{
  await fetch("http://localhost:5275/api/group/getteachergroups",
  {
    method: "GET",
    headers:{
      "Authorization": `Bearer ${await user?.getIdToken()}`,
      "Content-Type": "application/json",
    }
  }
).then((response) => response.json()).then((data) => {
  console.log("Fetched teacher groups:", data);
  return data;
});
} 

const initialGroups = [
  { name: "Physics Advanced", id: "GRP-001", students: 24 },
  { name: "Math Olympiad", id: "GRP-002", students: 18 },
  { name: "Biology Basics", id: "GRP-003", students: 31 },
];

const initialInvitations = [
  { nickname: "alex_92", group: "Physics Advanced" },
  { nickname: "dana_k", group: "Math Olympiad" },
];

const initialRequests = [
  { nickname: "murat_05", group: "Physics Advanced" },
  { nickname: "aisha_n", group: "Biology Basics" },
];

//Teacher home page function
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [groups, setGroups] = useState(initialGroups);
  const [pendingInvitations, setPendingInvitations] = useState(initialInvitations);
  const [joinRequests, setJoinRequests] = useState(initialRequests);

  // Create group dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Invite student
  const [inviteNickname, setInviteNickname] = useState("");
  const [inviteGroup, setInviteGroup] = useState("");

  // Determine active section from route
  const getSection = () => {
    if (location.pathname === "/teacher-groups") return "groups";
    if (location.pathname === "/teacher-invitations") return "invitations";
    if (location.pathname === "/teacher-requests") return "requests";
    return "dashboard";
  };
  const section = getSection();

  // Create group function
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const response = await fetch("http://localhost:5275/api/group/creategroup", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${await user?.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupname: newGroupName.trim() }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server error: ${errText}`);
      }

      const newGroupId = await response.text(); // backend returns plain string ID

      setGroups((prev) => [...prev, { name: newGroupName.trim(), id: newGroupId, students: 0 }]);
      setNewGroupName("");
      setCreateOpen(false);
      toast({ title: "Group created", description: `"${newGroupName.trim()}" has been created with ID ${newGroupId}.` });

      } catch (error) {
      console.log("Error creating group:", error.message);
      toast({ title: "Error", description: error.message || "Failed to create group.", variant: "destructive" });
    }
  };

  const handleSendInvitation = () => {
    if (!inviteNickname.trim() || !inviteGroup) {
      toast({ title: "Missing fields", description: "Please enter a nickname and select a group.", variant: "destructive" });
      return;
    }
    const groupName = groups.find((g) => g.id === inviteGroup)?.name || inviteGroup;
    setPendingInvitations((prev) => [...prev, { nickname: inviteNickname.trim(), group: groupName }]);
    toast({ title: "Invitation sent", description: `Invited "${inviteNickname.trim()}" to ${groupName}.` });
    setInviteNickname("");
    setInviteGroup("");
  };

  const handleCancelInvitation = (index: number) => {
    const inv = pendingInvitations[index];
    setPendingInvitations((prev) => prev.filter((_, i) => i !== index));
    toast({ title: "Invitation cancelled", description: `Cancelled invitation for "${inv.nickname}".` });
  };

  const handleAcceptRequest = (index: number) => {
    const req = joinRequests[index];
    setJoinRequests((prev) => prev.filter((_, i) => i !== index));
    toast({ title: "Request accepted", description: `"${req.nickname}" has been added to ${req.group}.` });
  };

  const handleRejectRequest = (index: number) => {
    const req = joinRequests[index];
    setJoinRequests((prev) => prev.filter((_, i) => i !== index));
    toast({ title: "Request rejected", description: `Rejected "${req.nickname}"'s request to join ${req.group}.` });
  };

  const renderDashboard = () => (
    <>
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
              <p className="text-2xl font-bold text-foreground">
                {groups.reduce((sum, g) => sum + g.students, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups table */}
      {renderGroupsTable()}

      {/* Invite & Requests side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderInviteSection()}
        {renderRequestsSection()}
      </div>
    </>
  );

  const renderGroupsTable = () => (
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
            {groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                  No groups yet. Create one to get started!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderInviteSection = () => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Invite Student</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Student Nickname</Label>
          <Input
            placeholder="Enter student nickname"
            value={inviteNickname}
            onChange={(e) => setInviteNickname(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Select Group</Label>
          <Select value={inviteGroup} onValueChange={setInviteGroup}>
            <SelectTrigger><SelectValue placeholder="Choose group..." /></SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full gap-2" onClick={handleSendInvitation}>
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
                <Button variant="ghost" size="sm" onClick={() => handleCancelInvitation(i)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderRequestsSection = () => (
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
                    <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleAcceptRequest(i)}>
                      <Check className="h-3 w-3 mr-1" />
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleRejectRequest(i)}>
                      <X className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {joinRequests.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                  No pending requests.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (section) {
      case "groups":
        return renderGroupsTable();
      case "invitations":
        return renderInviteSection();
      case "requests":
        return renderRequestsSection();
      default:
        return renderDashboard();
    }
  };

  const sectionTitle = {
    dashboard: "Teacher Dashboard",
    groups: "My Groups",
    invitations: "Invitations",
    requests: "Join Requests",
  }[section];

  return (
    <AppLayout role="teacher">
      <div className="page-container space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{sectionTitle}</h1>
            <p className="text-muted-foreground">Manage your groups and students</p>
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Create New Group
          </Button>
        </div>

        {renderContent()}
      </div>

      {/* Create Group Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Group Name</Label>
            <Input
              placeholder="e.g. Physics Advanced"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
