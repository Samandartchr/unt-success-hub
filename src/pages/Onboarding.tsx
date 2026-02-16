import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const subjectCombinations = [
  "Math + Physics",
  "Math + Computer Science",
  "Biology + Chemistry",
  "Geography + World History",
  "World History + Law",
  "English + World History",
  "Biology + Geography",
  "Chemistry + Physics",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Almost there!</h1>
          <p className="text-muted-foreground mt-1">Select your UNT profile subjects to personalize your experience</p>
        </div>

        <Card className="shadow-lg border-border/60">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              <Label>Profile Subject Combination</Label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your subjects..." />
                </SelectTrigger>
                <SelectContent>
                  {subjectCombinations.map((combo) => (
                    <SelectItem key={combo} value={combo}>
                      {combo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selected && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success animate-fade-in">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Great choice! You selected: {selected}</span>
              </div>
            )}

            <Button
              className="w-full"
              disabled={!selected}
              onClick={() => navigate("/dashboard")}
            >
              Save Choices & Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
