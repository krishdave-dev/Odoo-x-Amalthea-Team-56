"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ReactNode } from "react";

interface DroppableColumnProps {
  id: string;
  children: ReactNode;
  items: string[]; // Array of task IDs for sortable context
}

export function DroppableColumn({ id, children, items }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${id}`,
  });

  // Map status to friendly name
  const statusNames: Record<string, string> = {
    'new': 'New',
    'in_progress': 'In Progress',
    'completed': 'Completed'
  };

  return (
    <div
      ref={setNodeRef}
      className={`relative transition-all duration-200 min-h-[200px] rounded-lg ${
        isOver 
          ? 'bg-gradient-to-b from-blue-50 to-blue-100/50 ring-2 ring-blue-400 ring-inset shadow-inner' 
          : ''
      }`}
    >
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg font-medium animate-pulse">
            Drop to move to {statusNames[id] || id}
          </div>
        </div>
      )}
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
}
