"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Brain, Wand2, Bot, Loader2, CheckCircle2, Rocket, Users, Layers } from "lucide-react";

interface SuggestedTask {
  title: string;
  role: string; // suggested role
  assignee?: string; // suggested person (placeholder)
  effortHours: number;
}

export function AIProjectAssign() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [generated, setGenerated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  // Very simple placeholder generator for UI only
  const suggestedTasks: SuggestedTask[] = [
    { title: "UI/UX Wireframes", role: "UI/UX Designer", assignee: "(auto)", effortHours: 16 },
    { title: "Frontend Components", role: "Frontend Developer", assignee: "(auto)", effortHours: 32 },
    { title: "Backend API Endpoints", role: "Backend Developer", assignee: "(auto)", effortHours: 40 },
    { title: "Integration & E2E Tests", role: "QA Engineer", assignee: "(auto)", effortHours: 24 },
    { title: "Deployment & CI/CD", role: "DevOps Engineer", assignee: "(auto)", effortHours: 12 },
  ];

  const handleGenerate = () => {
    // In the future, call AI/Backend; for now, show preview UI
    setGenerated(true);
  };

  const steps = [
    { label: "Analyzing brief", icon: Brain },
    { label: "Planning milestones", icon: Layers },
    { label: "Assigning team", icon: Users },
    { label: "Generating tasks", icon: Bot },
    { label: "Finalizing project", icon: Rocket },
  ];

  const startCreation = () => {
    setCreating(true);
    setProgress(0);
    setStepIndex(0);

    // Simulate progress + step changes
    const totalMs = 3500;
    const tick = 70;
    const inc = 100 / (totalMs / tick);
    const interval = setInterval(() => {
      setProgress((p) => {
        const np = Math.min(100, p + inc);
        const stepSize = 100 / steps.length;
        setStepIndex(Math.min(steps.length - 1, Math.floor(np / stepSize)));
        if (np >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Redirect to projects after a short success pause
            setCreating(false);
            setGenerated(false);
            router.push("/project");
          }, 700);
        }
        return np;
      });
    }, tick);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#0A1931]">Assign Project with AI</h1>
        <p className="mt-2 text-[#4A7FA7]">Describe your project and we’ll generate a draft plan with suggested task assignments. (UI only for now)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <Card>
          <CardHeader>
            <CardTitle>Project Brief</CardTitle>
            <CardDescription>Provide a short description so AI can plan tasks and assignments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g., Website Revamp"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Target Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                placeholder="Describe key goals, features, tech stack, constraints, and any preferences..."
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Example: Redesign marketing site with a modern UI, build product pages and a blog, integrate CMS, and set up analytics.</p>
            </div>

            <div className="flex items-center gap-2">
              <Button className="bg-primary hover:bg-primary/90" onClick={handleGenerate}>
                Generate Plan (UI)
              </Button>
              <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Suggested Plan</CardTitle>
            <CardDescription>Draft tasks and assignments (placeholder)</CardDescription>
          </CardHeader>
          <CardContent>
            {!generated ? (
              <div className="text-muted-foreground text-sm">
                Fill in the brief and click &quot;Generate Plan&quot; to preview tasks and assignments.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{name || "(Untitled Project)"}</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {suggestedTasks.map((t, idx) => (
                    <div key={idx} className={cn("rounded-lg border p-3", "bg-white/50")}> 
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{t.title}</p>
                        <span className="text-xs text-muted-foreground">~{t.effortHours}h</span>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Role: <span className="text-foreground">{t.role}</span> • Assignee: <span className="text-foreground">{t.assignee}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button className="bg-primary hover:bg-primary/90" onClick={startCreation}>
                    <Wand2 className="h-4 w-4 mr-1" /> Create with AI (dummy)
                  </Button>
                  <Button variant="outline" onClick={() => setGenerated(false)}>Revise Brief</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Creating Progress Modal */}
      <Dialog open={creating} onOpenChange={(v) => !v && setCreating(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" /> Creating project with AI
            </DialogTitle>
            <DialogDescription>
              Hang tight while we analyze your brief, plan milestones, assign teammates, and generate tasks.
            </DialogDescription>
          </DialogHeader>

        <div className="space-y-4">
          <div className="relative p-4 rounded-lg border bg-white/60">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                {progress < 100 ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
                <div className="absolute inset-0 rounded-full animate-ping bg-primary/10" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{steps[stepIndex].label}</p>
                <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
              </div>
            </div>
            <div className="mt-3">
              <Progress value={progress} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {steps.map((s, idx) => {
              const Icon = s.icon
              const active = idx <= stepIndex
              return (
                <div key={s.label} className={cn("rounded-md border p-2 text-center", active ? "bg-primary/10 border-primary/30" : "bg-white/40")}> 
                  <Icon className={cn("mx-auto h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                  <p className={cn("mt-1 text-xs", active ? "text-foreground" : "text-muted-foreground")}>{s.label}</p>
                </div>
              )
            })}
          </div>
        </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
