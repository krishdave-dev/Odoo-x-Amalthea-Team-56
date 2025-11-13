import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";

export interface Subtask {
  id: number;
  text: string;
  completed: boolean;
}

export function SubtasksChecklist({ initialSubtasks = [] }: { initialSubtasks?: Subtask[] }) {
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks);
  const [newSubtask, setNewSubtask] = useState("");

  const handleAdd = () => {
    if (newSubtask.trim()) {
      setSubtasks([
        ...subtasks,
        { id: Date.now(), text: newSubtask.trim(), completed: false },
      ]);
      setNewSubtask("");
    }
  };

  const handleToggle = (id: number) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
  };

  const handleRemove = (id: number) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  return (
    <div className="pt-4 border-t border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className="h-1 w-1 rounded-full bg-green-500" />
        Subtasks / Checklist
      </h3>
      <div className="space-y-2">
        {subtasks.length === 0 && (
          <p className="text-xs text-gray-400 italic">No subtasks yet</p>
        )}
        {subtasks.map((st) => (
          <div key={st.id} className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2">
            <Checkbox checked={st.completed} onCheckedChange={() => handleToggle(st.id)} />
            <span className={`flex-1 text-sm ${st.completed ? "line-through text-gray-400" : "text-gray-700"}`}>{st.text}</span>
            <Button variant="ghost" size="icon" onClick={() => handleRemove(st.id)}>
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2">
          <Input
            value={newSubtask}
            onChange={e => setNewSubtask(e.target.value)}
            placeholder="Add subtask..."
            className="text-sm"
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
          />
          <Button size="sm" variant="outline" onClick={handleAdd} className="gap-1">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
