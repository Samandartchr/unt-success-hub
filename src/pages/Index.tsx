import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight, BookOpen, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: BookOpen,
    title: "Realistic Mock Tests",
    description: "Practice with full-length UNT simulations including all question types",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Track your progress with subject-wise breakdowns and score trends",
  },
  {
    icon: Users,
    title: "Group Learning",
    description: "Join study groups managed by teachers and compare performance",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">UNT Prep</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 md:py-28 text-center">
        <div className="animate-fade-in space-y-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <span>🇰🇿</span> Kazakhstan's #1 UNT Prep Platform
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
            Ace Your <span className="gradient-text">UNT Exam</span> with Confidence
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Practice with realistic mock tests, track your progress with detailed analytics,
            and prepare smarter — not harder.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button size="lg" asChild className="gap-2">
              <Link to="/register">
                Start Practicing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">I Have an Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="stat-card flex flex-col items-start gap-4 animate-fade-in"
            >
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6">
        <p className="text-center text-sm text-muted-foreground">
          © 2026 UNT Prep. Built for Kazakhstan's future leaders.
        </p>
      </footer>
    </div>
  );
}
