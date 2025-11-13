"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Receipt, Wand2 } from "lucide-react";

interface CreateExpenseChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (mode: "custom" | "ocr") => void;
}

export function CreateExpenseChoiceDialog({
  open,
  onOpenChange,
  onChoose,
}: CreateExpenseChoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create Expense</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-4 hover:bg-accent/40 transition">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary/15 text-primary flex items-center justify-center">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Custom Expense</h4>
                <p className="text-xs text-muted-foreground">
                  Fill details manually
                </p>
              </div>
            </div>
            <Button className="mt-4 w-full" onClick={() => onChoose("custom")}>
              Continue
            </Button>
          </Card>
          <Card className="p-4 hover:bg-accent/40 transition">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary/15 text-primary flex items-center justify-center">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Expense with OCR</h4>
                <p className="text-xs text-muted-foreground">
                  Upload bill image/PDF
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => onChoose("ocr")}
            >
              Try OCR
            </Button>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
