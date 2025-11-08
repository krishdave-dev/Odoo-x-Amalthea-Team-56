"use client"

import { ProjectCard } from "@/components/MainPages/Project/ProjectCard"
import { Plus } from "lucide-react"

// Mock data - will be replaced with API calls later
const mockProjects = [
  {
    id: 1,
    title: "Website Redesign",
    description: "Complete overhaul of company website with new branding and improved UX",
    status: "active" as const,
    teamMembers: 5,
    dueDate: "Dec 15, 2025",
    tasksCompleted: 12,
    totalTasks: 25,
  },
  {
    id: 2,
    title: "Mobile App Development",
    description: "Native mobile application for iOS and Android platforms",
    status: "active" as const,
    teamMembers: 8,
    dueDate: "Jan 30, 2026",
    tasksCompleted: 8,
    totalTasks: 40,
  },
  {
    id: 3,
    title: "Marketing Campaign",
    description: "Q4 marketing campaign for product launch",
    status: "planning" as const,
    teamMembers: 4,
    dueDate: "Nov 20, 2025",
    tasksCompleted: 3,
    totalTasks: 15,
  },
  {
    id: 4,
    title: "Database Migration",
    description: "Migrate legacy database to new cloud infrastructure",
    status: "completed" as const,
    teamMembers: 3,
    dueDate: "Oct 30, 2025",
    tasksCompleted: 18,
    totalTasks: 18,
  },
  {
    id: 5,
    title: "API Integration",
    description: "Integrate third-party APIs for enhanced functionality",
    status: "active" as const,
    teamMembers: 6,
    dueDate: "Dec 1, 2025",
    tasksCompleted: 15,
    totalTasks: 22,
  },
  {
    id: 6,
    title: "Security Audit",
    description: "Comprehensive security audit and vulnerability assessment",
    status: "planning" as const,
    teamMembers: 2,
    dueDate: "Nov 25, 2025",
    tasksCompleted: 0,
    totalTasks: 10,
  },
]

export function ProjectPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all your projects in one place
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProjects.map((project) => (
          <ProjectCard
            key={project.id}
            title={project.title}
            description={project.description}
            status={project.status}
            teamMembers={project.teamMembers}
            dueDate={project.dueDate}
            tasksCompleted={project.tasksCompleted}
            totalTasks={project.totalTasks}
          />
        ))}
      </div>
    </div>
  )
}
