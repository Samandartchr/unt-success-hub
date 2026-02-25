import { useState, useEffect } from "react";
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
import { getAuth, onAuthStateChanged } from "firebase/auth";

const initialInvitations = [
  { nickname: "alex_92", group: "Physics Advanced" },
  { nickname: "dana_k", group: "Math Olympiad" },
];

const initialRequests = [
  { nickname: "murat_05", group: "Physics Advanced" },
  { nickname: "aisha_n", group: "Biology Basics" },
];

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [groups, setGroups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [joinRequests, setJoinRequests] = useState(initialRequests);
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteNickname, setInviteNickname] = useState("");
  const [inviteGroup, setInviteGroup] = useState("");

  //get groups on load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      setCurrentUser(user);
      if (!user) { setLoading(false); return; }

      try {
        const token = await user.getIdToken();
        const response = await fetch("http://localhost:5275/api/group/getteachergroups", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setGroups(data.map((el) => ({ name: el.groupName, id: el.groupId })));
      } 
      catch (error) {
        console.error("Error fetching groups:", error);
      } 
      finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  //get group invites on load
  useEffect(() => {
    if(!currentUser) return;
    try {
      const res = fetch("http://localhost:5275/api/membership/getinvitations",{
        method: "GET",
        headers: {
          "Authorization": `Bearer ${currentUser?.getIdToken()}`,
        },
      }).then((r) => r.json()).then((data) => {
        setPendingInvitations(data);
      });
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
  }, [currentUser]);

  //get group join requests on load
  useEffect(() => {
    if(!currentUser) return;
  }, [currentUser]);

  const getSection = () => {
    if (location.pathname === "/teacher-groups") return "groups";
    if (location.pathname === "/teacher-invitations") return "invitations";
    if (location.pathname === "/teacher-requests") return "requests";
    return "dashboard";
  };
  const section = getSection();

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch("http://localhost:5275/api/group/creategroup", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupname: newGroupName.trim() }),
      });

      if (!response.ok) throw new Error(await response.text());

      const newGroupId = await response.text();
      setGroups((prev) => [...prev, { name: newGroupName.trim(), id: newGroupId }]);
      setNewGroupName("");
      setCreateOpen(false);
      toast({ title: "Group created", description: `"${newGroupName.trim()}" created with ID ${newGroupId}.` });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to create group.", variant: "destructive" });
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteNickname.trim() || !inviteGroup) {
      toast({ title: "Missing fields", description: "Please enter a nickname and select a group.", variant: "destructive" });
      return;
    }
    try {
      const token = await currentUser?.getIdToken();
      const groupName = groups.find((g) => g.id === inviteGroup)?.name || inviteGroup;
      

      const res = await fetch("http://localhost:5275/api/membership/sendinvitation", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname: inviteNickname.trim(), groupId: inviteGroup }),
      }).then((r) => r.json());
      console.log(res);

      if (res === true)
      {
        console.log(res);
        setPendingInvitations((prev) => [...prev, { nickname: inviteNickname.trim(), group: groupName }]);
        toast({ title: "Invitation sent", description: `Invited "${inviteNickname.trim()}" to ${groupName}.` });
        setInviteNickname("");
        setInviteGroup("");
      }
      else {toast({ title: "Error", description: res.message || "Failed to send invitation.", variant: "destructive" });}
      
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({ title: "Error", description: "Failed to send invitation.", variant: "destructive" });
    }
  };

  const handleCancelInvitation = (index: number) => {
    const inv = pendingInvitations[index];
    setPendingInvitations((prev) => prev.filter((_, i) => i !== index));
    toast({ title: "Invitation cancelled", description: `Cancelled invitation for "${inv.nickname}".` });
  };

  const handleAcceptRequest = (index: number) => {
    const req = joinRequests[index];
    setJoinRequests((prev) => prev.filter((_, i) => i !== index));
    toast({ title: "Request accepted", description: `"${req.nickname}" added to ${req.group}.` });
  };

  const handleRejectRequest = (index: number) => {
    const req = joinRequests[index];
    setJoinRequests((prev) => prev.filter((_, i) => i !== index));
    toast({ title: "Request rejected", description: `Rejected "${req.nickname}"'s request.` });
  };

  const renderDashboard = () => (
    <>
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
              <p className="text-sm text-muted-foreground">Pending Requests</p>
              <p className="text-2xl font-bold text-foreground">{joinRequests.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {renderGroupsTable()}
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
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/group/${g.id}`)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
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
                      <Check className="h-3 w-3 mr-1" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleRejectRequest(i)}>
                      <X className="h-3 w-3 mr-1" /> Reject
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
      case "groups": return renderGroupsTable();
      case "invitations": return renderInviteSection();
      case "requests": return renderRequestsSection();
      default: return renderDashboard();
    }
  };

  const sectionTitle = {
    dashboard: "Teacher Home",
    groups: "My Groups",
    invitations: "Invitations",
    requests: "Join Requests",
  }[section];

  if (loading) return <p>Loading...</p>;

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