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

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [groups, setGroups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
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
        const response = await fetch("https://api-service-xy2qzucrkq-uc.a.run.app/api/group/getteachergroups", {
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
  if (!currentUser) return;
  const fetchInvitations = async () => {
    try {
      const data = await fetch("https://api-service-xy2qzucrkq-uc.a.run.app/api/membership/getinvitations", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${await currentUser.getIdToken()}`,
        },
      }).then((r) => r.json());

      setPendingInvitations(data.map((inv) => ({ nickname: inv.acceptorUsername, group: inv.groupName, groupId: inv.groupId })));
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
  };
  fetchInvitations();
}, [currentUser]);

  //get requests on load
  useEffect(() => {
  if (!currentUser) return;

  async function fetchRequests() {
    try {
      const data = await fetch("https://api-service-xy2qzucrkq-uc.a.run.app/api/membership/getrequests", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${await currentUser.getIdToken()}`,
        },
      }).then((r) => r.json());

      setJoinRequests(data.map((req) => ({ senderUsername: req.acceptorUsername, group: req.groupName, groupId: req.groupId, nickname: req.senderUsername })));
    } catch (error) {
      console.error("Error fetching join requests:", error);
    }
  }
  fetchRequests();
}, [currentUser]);
  console.log(pendingInvitations);
  console.log(joinRequests);

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
      const response = await fetch("https://api-service-xy2qzucrkq-uc.a.run.app/api/group/creategroup", {
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
      

      const res = await fetch("https://api-service-xy2qzucrkq-uc.a.run.app/api/membership/sendinvitation", {
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

  const handleCancelInvitation = async (index: number) => {
  const inv = pendingInvitations[index];
  try {
    const res = await fetch("https://api-service-xy2qzucrkq-uc.a.run.app/api/membership/removeorder", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${await currentUser?.getIdToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: inv.nickname, groupId: inv.groupId }),
    });
    if (!res.ok) throw new Error(await res.text());
    setPendingInvitations((prev) => prev.filter((_, i) => i !== index));
    toast({ title: "Invitation cancelled", description: `Cancelled invitation for "${inv.nickname}".` });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    toast({ title: "Failed to cancel invitation", variant: "destructive" });
  }
};

const handleAcceptRequest = async (index: number) => {
  const req = joinRequests[index];
  try {
    const res = await fetch("https://api-service-xy2qzucrkq-uc.a.run.app/api/membership/acceptstudent", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${await currentUser?.getIdToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: req.nickname, groupId: req.groupId }),
    });
    if (!res.ok) throw new Error(await res.text());
    setJoinRequests((prev) => prev.filter((_, i) => i !== index));
    toast({ title: "Request accepted", description: `"${req.nickname}" added to ${req.group}.` });
  } catch (error) {
    console.error("Error accepting request:", error);
    toast({ title: "Failed to accept request", variant: "destructive" });
  }
};

const handleRejectRequest = async (index: number) => {
  const req = joinRequests[index];
  try {
    const res = await fetch("https://api-service-xy2qzucrkq-uc.a.run.app/api/membership/removeorder", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${await currentUser?.getIdToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: req.nickname, groupId: req.groupId }),
    });
    if (!res.ok) throw new Error(await res.text());
    setJoinRequests((prev) => prev.filter((_, i) => i !== index));
    toast({ title: "Request rejected", description: `Rejected "${req.nickname}"'s request.` });
  } catch (error) {
    console.error("Error rejecting request:", error);
    toast({ title: "Failed to reject request", variant: "destructive" });
  }
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
              <p className="text-sm text-muted-foreground">Топтар саны</p>
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
              <p className="text-sm text-muted-foreground">Сұраныс саны</p>
              <p className="text-2xl font-bold text-foreground">{pendingInvitations.length + joinRequests.length}</p>
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
        <CardTitle className="text-base">Менің топтарым</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Топ аты</TableHead>
              <TableHead>ID</TableHead>
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
                  Сізде әлі топ жоқ. Жаңа топ құру үшін "Create New Group" батырмасын басыңыз.
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
        <CardTitle className="text-base">Оқушыны шақыру</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Никнейм</Label>
          <Input
            placeholder="Никнеймді енгізіңіз"
            value={inviteNickname}
            onChange={(e) => setInviteNickname(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Топты таңдау</Label>
          <Select value={inviteGroup} onValueChange={setInviteGroup}>
            <SelectTrigger><SelectValue placeholder="Топты таңдау..." /></SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full gap-2" onClick={handleSendInvitation}>
          <Send className="h-4 w-4" />
          Шақырту жіберу
        </Button>
        {pendingInvitations.length > 0 && (
          <div className="pt-3 border-t border-border space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Шақыртулар</p>
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
        <CardTitle className="text-base">Сұраныстар</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Оқушы</TableHead>
              <TableHead>Топ</TableHead>
              <TableHead>Әрекеттер</TableHead>
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
                      <Check className="h-3 w-3 mr-1" /> Қабылдау
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleRejectRequest(i)}>
                      <X className="h-3 w-3 mr-1" /> Бас тарту
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {joinRequests.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                  Әлі сұраныстар жоқ.
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
    dashboard: "Басты бет",
    groups: "Топтар",
    invitations: "Шақыртулар",
    requests: "Сұраныстар",
  }[section];

  const sectionDescription = {
    dashboard: "Топтарды және оқушыларды басқару.",
    groups: "Топтарды қарау және басқару.",
    invitations: "Оқушыларға шақыртулар жіберу.",
    requests: "Сұраныстарды қарау және жауап беру.",
  }[section];

  if (loading) return <p>Loading...</p>;

  return (
    <AppLayout role="teacher">
      <div className="page-container space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{sectionTitle}</h1>
            <p className="text-muted-foreground">{sectionDescription}</p>
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Жаңа топ құру
          </Button>
        </div>

        {renderContent()}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Жаңа топ құру</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Топ атауы</Label>
            <Input
              placeholder="мысалы: IT 3 - ағым"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Бас тарту</Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName}>Жасау</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}