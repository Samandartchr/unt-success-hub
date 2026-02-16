import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, UserMinus, Copy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const students = [
  { nickname: "amir_t", avgScore: 88, lastScore: 92 },
  { nickname: "zarina_k", avgScore: 75, lastScore: 80 },
  { nickname: "daniyar_m", avgScore: 93, lastScore: 95 },
  { nickname: "aigerim_s", avgScore: 70, lastScore: 68 },
  { nickname: "nurlan_b", avgScore: 82, lastScore: 85 },
];

const subjectPerformance = [
  { subject: "Math Literacy", avg: 18 },
  { subject: "Reading Lit.", avg: 15 },
  { subject: "History KZ", avg: 16 },
  { subject: "Math", avg: 22 },
  { subject: "Physics", avg: 19 },
];

export default function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <AppLayout role="teacher">
      <div className="page-container space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Physics Advanced</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-xs">{id}</Badge>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground gap-1">
                <Copy className="h-3 w-3" /> Copy ID
              </Button>
            </div>
          </div>
        </div>

        {/* Performance chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Average Score by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="subject" tick={{ fill: 'hsl(215, 12%, 50%)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(215, 12%, 50%)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="avg" fill="hsl(210, 70%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Students table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Students ({students.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nickname</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Last Test</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.nickname}>
                    <TableCell className="font-medium">{s.nickname}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.avgScore}/140</Badge>
                    </TableCell>
                    <TableCell>{s.lastScore}/140</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <UserMinus className="h-4 w-4" />
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
