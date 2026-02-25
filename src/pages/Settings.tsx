import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, Save, Lock, User, Mail, Phone, Calendar, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Try to get stored user info from session
function getUserInfo() {
  try {
    const stored = sessionStorage.getItem("userPublicInfo");
    if (stored) return JSON.parse(stored);
  } catch (err) {
    console.error("Failed to retrieve user info:", err);
  }
  return null;
}

const storedUser = getUserInfo();

const defaultProfile = {
  username: storedUser?.username || "nickname123",
  email: storedUser?.email || "user@example.com",
  name: storedUser?.name || "Amir",
  surname: storedUser?.surname || "Temirov",
  role: storedUser?.role || "Student",
  createdAt: "2025-09-01",
  phone: "+7 701 234 5678",
  profileImage: "",
};

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Determine role for layout
  const role = (defaultProfile.role?.toLowerCase() === "teacher" ? "teacher" : "student") as "teacher" | "student";

  const [profile, setProfile] = useState(defaultProfile);
  const [editName, setEditName] = useState(defaultProfile.name);
  const [editSurname, setEditSurname] = useState(defaultProfile.surname);
  const [editPhone, setEditPhone] = useState(defaultProfile.phone);
  const [imagePreview, setImagePreview] = useState(defaultProfile.profileImage);
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save — replace with real API call
    await new Promise((r) => setTimeout(r, 600));
    setProfile((prev) => ({ ...prev, name: editName, surname: editSurname, phone: editPhone }));
    toast({ title: "Profile updated", description: "Your changes have been saved." });
    setSaving(false);
  };

  const initials = `${editName?.[0] || ""}${editSurname?.[0] || ""}`.toUpperCase() || "U";

  return (
    <AppLayout role={role}>
      <div className="page-container space-y-6 animate-fade-in max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your profile information</p>
        </div>

        {/* Profile image & read-only identity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {imagePreview ? (
                    <AvatarImage src={imagePreview} alt="Profile" />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow"
                >
                  <Camera className="h-3.5 w-3.5" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">{editName} {editSurname}</p>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                <Badge variant="secondary" className="mt-1 capitalize">{profile.role}</Badge>
              </div>
            </div>

            <Separator />

            {/* Read-only fields */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Non-editable fields
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3 w-3" /> Username
                  </Label>
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground items-center">
                    {profile.username}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> Email
                  </Label>
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground items-center">
                    {profile.email}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3 w-3" /> Role
                  </Label>
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground items-center">
                    {profile.role}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Member Since
                  </Label>
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground items-center">
                    {profile.createdAt}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Editable fields */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Editable fields
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">First Name</Label>
                  <Input
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="surname">Last Name</Label>
                  <Input
                    id="surname"
                    value={editSurname}
                    onChange={(e) => setEditSurname(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+7 700 000 0000"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}