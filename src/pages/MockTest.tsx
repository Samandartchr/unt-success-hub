import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  BookOpen,
} from "lucide-react";

const sampleQuestions = [
  {
    id: 1,
    subject: "Math Literacy",
    text: "A store offers a 20% discount on a product originally priced at 5,000 tenge. What is the final price?",
    type: "single",
    options: ["A) 3,000 tenge", "B) 3,500 tenge", "C) 4,000 tenge", "D) 4,500 tenge", "E) 5,000 tenge"],
  },
  {
    id: 2,
    subject: "Reading Literacy",
    text: "Read the following passage and identify the main idea:\n\n\"The Aral Sea, once the fourth-largest lake in the world, has shrunk dramatically since the 1960s due to Soviet-era irrigation projects that diverted its feeding rivers.\"",
    type: "single",
    options: [
      "A) The Aral Sea is growing",
      "B) Irrigation caused the Aral Sea to shrink",
      "C) The Aral Sea is in Europe",
      "D) The Soviet Union built the Aral Sea",
      "E) The Aral Sea has always been small",
    ],
  },
  {
    id: 3,
    subject: "Physics",
    text: "Which of the following are scalar quantities? Select all that apply.",
    type: "multiple",
    options: ["A) Mass", "B) Velocity", "C) Temperature", "D) Force", "E) Energy", "F) Acceleration"],
  },
];

type AnswerMap = Record<number, string[]>;

export default function MockTest() {
  const navigate = useNavigate();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());

  const question = sampleQuestions[currentQ];
  const total = sampleQuestions.length;
  const answered = Object.keys(answers).length;

  const toggleAnswer = (qId: number, option: string, type: string) => {
    setAnswers((prev) => {
      const current = prev[qId] || [];
      if (type === "single") return { ...prev, [qId]: [option] };
      return {
        ...prev,
        [qId]: current.includes(option) ? current.filter((o) => o !== option) : [...current, option],
      };
    });
  };

  const toggleMark = () => {
    setMarked((prev) => {
      const next = new Set(prev);
      next.has(currentQ) ? next.delete(currentQ) : next.add(currentQ);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Test header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 md:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Math + Physics</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-mono font-medium">02:15:30</span>
            </div>
            <Badge variant="outline">{answered}/{total} answered</Badge>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-2">
          <Progress value={(answered / total) * 100} className="h-1.5" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-6 py-6 flex gap-6">
        {/* Question area */}
        <div className="flex-1 space-y-4 animate-fade-in" key={currentQ}>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{question.subject}</Badge>
            <Badge variant="outline" className="capitalize">{question.type} choice</Badge>
            <span className="text-sm text-muted-foreground ml-auto">
              Question {currentQ + 1} of {total}
            </span>
          </div>

          <Card>
            <CardContent className="pt-6">
              <p className="text-foreground leading-relaxed whitespace-pre-line">{question.text}</p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {question.options.map((option) => {
              const selected = (answers[question.id] || []).includes(option);
              return (
                <button
                  key={option}
                  onClick={() => toggleAnswer(question.id, option, question.type)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                    selected
                      ? "border-primary bg-primary/5 text-foreground font-medium"
                      : "border-border hover:border-primary/40 text-foreground"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              disabled={currentQ === 0}
              onClick={() => setCurrentQ((c) => c - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant={marked.has(currentQ) ? "default" : "outline"}
              onClick={toggleMark}
              className="gap-1"
            >
              <Flag className="h-4 w-4" />
              {marked.has(currentQ) ? "Marked" : "Mark"}
            </Button>
            {currentQ < total - 1 ? (
              <Button onClick={() => setCurrentQ((c) => c + 1)} className="gap-1">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => navigate("/test-results")} className="gap-1">
                <Send className="h-4 w-4" />
                Submit
              </Button>
            )}
          </div>
        </div>

        {/* Question palette (desktop) */}
        <div className="hidden lg:block w-48 shrink-0">
          <Card className="sticky top-28">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Questions</p>
              <div className="grid grid-cols-5 gap-1.5">
                {sampleQuestions.map((_, i) => {
                  const isAnswered = answers[sampleQuestions[i].id];
                  const isMarked = marked.has(i);
                  const isCurrent = i === currentQ;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentQ(i)}
                      className={`h-8 w-8 rounded-md text-xs font-medium transition-colors ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isMarked
                          ? "bg-accent text-accent-foreground"
                          : isAnswered
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-secondary" /> Answered
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-accent" /> Marked
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-muted" /> Unanswered
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
