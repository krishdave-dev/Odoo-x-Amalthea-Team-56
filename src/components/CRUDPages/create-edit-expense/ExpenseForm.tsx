"use client";

import * as React from "react";
import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ExpenseFormProps {
  mode?: "create" | "edit";
  initialData?: {
    name?: string;
    period?: string;
    project?: string;
    image?: string;
    description?: string;
  };
  onSave?: (data: any) => void;
  onDiscard?: () => void;
}

export function ExpenseForm({ mode = "create", initialData, onSave, onDiscard }: ExpenseFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [period, setPeriod] = useState(initialData?.period || "");
  const [project, setProject] = useState(initialData?.project || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [image, setImage] = useState<string | null>(initialData?.image || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
  };

  const handleSave = () => {
    const data = { name, period, project, image, description };
    onSave?.(data);
    console.log("Saving expense:", data);
  };

  const handleDiscard = () => {
    onDiscard?.();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 min-h-[480px]">
        <div className="space-y-6">
          <div>
            <Label className="block mb-2">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-transparent border-b" />
          </div>

          <div>
            <Label className="block mb-2">Expense Period</Label>
            <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. 2025-11" className="bg-transparent border-b" />
          </div>

          <div>
            <Label className="block mb-2">Project</Label>
            <Input value={project} onChange={(e) => setProject(e.target.value)} className="bg-transparent border-b" />
          </div>

          <div>
            <Label className="block mb-2">Image</Label>
            {image ? (
              <div className="relative inline-block">
                <img src={image} alt="Expense" className="h-40 w-auto rounded-md object-cover" />
                <Button variant="destructive" size="icon" className="absolute -top-2 -right-2" onClick={handleRemoveImage}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="outline" asChild className="h-10">
                  <label htmlFor="expense-image" className="cursor-pointer inline-flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Image
                    <input id="expense-image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </Button>
                <span className="text-sm text-muted-foreground">Optional</span>
              </div>
            )}
          </div>

          <div>
            <Label className="block mb-2">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={handleDiscard}>Discard</Button>
          <Button onClick={handleSave}>{mode === "create" ? "Create" : "Save"}</Button>
        </div>
      </Card>
    </div>
  );
}
