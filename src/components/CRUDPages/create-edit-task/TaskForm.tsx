"use client";

import * as React from "react";
import { useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface TaskFormProps {
  mode?: "create" | "edit";
  initialData?: any;
}

const tagOptions = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "urgent", label: "Urgent" },
];

const people = [
  { value: "abhi", label: "Abhi" },
  { value: "krish", label: "Krish" },
  { value: "dave", label: "Dave" },
];

export function TaskForm({ mode = "create", initialData }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [assignee, setAssignee] = useState(initialData?.assignee || "");
  const [project, setProject] = useState(initialData?.project || "");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [deadline, setDeadline] = useState<Date | undefined>(initialData?.deadline);
  const [image, setImage] = useState<string | null>(initialData?.image || null);
  const [descEditing, setDescEditing] = useState(false);
  const [description, setDescription] = useState(initialData?.description || "");

  // Timesheets state
  const [timesheets, setTimesheets] = useState<Array<{ employee: string; time: string }>>(
    initialData?.timesheets || [
      { employee: "Abhi", time: "2h 30m" },
      { employee: "Krish", time: "1h 10m" },
    ]
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const removeTimesheet = (index: number) => {
    setTimesheets((prev) => prev.filter((_, i) => i !== index));
  };

  const addTimesheet = () => {
    setTimesheets((prev) => [...prev, { employee: "", time: "0h 00m" }]);
  };

  const totalWorkingHours = "03:40"; // placeholder
  const lastChangedBy = "Composed Loris";
  const lastChangedOn = new Date().toLocaleString();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        {/* Header actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-72">
            <Input placeholder="Search......" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Discard</Button>
            <Button>Save</Button>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="text-xl h-12"
          />
        </div>

        {/* Assignee / Project */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label className="block mb-2">Assignee</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {people.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="block mb-2">Project</Label>
            <Select value={project} onValueChange={setProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="odoo">Odoo</SelectItem>
                <SelectItem value="amalthea">Amalthea</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tags / Deadline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label className="block mb-2">Tags</Label>
            <MultiSelect options={tagOptions} selected={tags} onChange={setTags} placeholder="Select tags..." />
          </div>

          <div>
            <Label className="block mb-2">Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start", !deadline && "text-muted-foreground")}> 
                  {deadline ? deadline.toDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Image */}
        <div className="mb-6">
          <Label className="block mb-2">Image</Label>
          {image ? (
            <img src={image} alt="Task" className="h-40 w-auto rounded-md object-cover" />
          ) : (
            <Button variant="outline" asChild>
              <label htmlFor="task-image" className="cursor-pointer inline-flex items-center gap-2">
                <Upload className="h-4 w-4" /> Upload Image
                <input id="task-image" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </Button>
          )}
        </div>

        {/* Tabs row - description inline, others popovers */}
        <div className="flex items-center gap-4 border-b pb-2 mb-4">
          <button className="px-3 py-1 rounded-md border" onClick={() => setDescEditing(true)}>Description</button>
          <Popover>
            <PopoverTrigger asChild>
              <button className="px-3 py-1 rounded-md border">Timesheets</button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[480px]">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold">Timesheets</h4>
                <Button size="sm" onClick={addTimesheet}>Add row</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Time logged</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheets.map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Input value={t.employee} onChange={(e) => setTimesheets((prev) => prev.map((r, i) => i===idx ? { ...r, employee: e.target.value } : r))} />
                      </TableCell>
                      <TableCell>
                        <Input value={t.time} onChange={(e) => setTimesheets((prev) => prev.map((r, i) => i===idx ? { ...r, time: e.target.value } : r))} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="icon" onClick={() => removeTimesheet(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <button className="px-3 py-1 rounded-md border">Task info</button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Last changes by</span><span className="font-medium">{lastChangedBy}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Last changes on</span><span className="font-medium">{lastChangedOn}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total working hours</span><span className="font-medium">{totalWorkingHours}</span></div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Description section inline edit */}
        <div className="mt-2">
          {descEditing ? (
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              onBlur={() => setDescEditing(false)}
              placeholder="Type task description..."
            />
          ) : (
            <div className="min-h-24 text-muted-foreground italic cursor-text" onClick={() => setDescEditing(true)}>
              {description || "Click to add a description"}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
