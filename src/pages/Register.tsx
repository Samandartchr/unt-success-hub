import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    nickname: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.role === "student") {
      navigate("/onboarding");
    } else {
      navigate("/teacher-dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-1">Join UNT Prep and start practicing</p>
        </div>

        <Card className="shadow-lg border-border/60">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-nickname">Nickname</Label>
                <Input id="reg-nickname" placeholder="Choose a unique nickname" value={form.nickname} onChange={(e) => update("nickname", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" placeholder="Confirm your password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} />
              </div>

              <div className="space-y-3">
                <Label>I am a</Label>
                <RadioGroup value={form.role} onValueChange={(v) => update("role", v)} className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="student" id="role-student" />
                    <Label htmlFor="role-student" className="font-normal cursor-pointer">Student</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="teacher" id="role-teacher" />
                    <Label htmlFor="role-teacher" className="font-normal cursor-pointer">Teacher</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full">Register</Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
