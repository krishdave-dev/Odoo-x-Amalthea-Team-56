"use client";

import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckCircle2, 
  MessageSquare, 
  RefreshCw, 
  Plus,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Event type configuration with icons and colors
const eventTypeConfig = {
  CREATED: {
    icon: Plus,
    color: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    label: "Created"
  },
  STATUS_CHANGED: {
    icon: RefreshCw,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    label: "Status Changed"
  },
  COMMENT: {
    icon: MessageSquare,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    label: "Comment"
  },
  UPDATED: {
    icon: CheckCircle2,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    label: "Updated"
  },
} as const;

interface HistoryEvent {
  id: number;
  type: keyof typeof eventTypeConfig;
  message: string;
  timestamp: string;
  user?: string;
}

interface TaskHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  history?: HistoryEvent[];
}

// Mock history data generator
function generateMockHistory(): HistoryEvent[] {
  const mockUsers = ["Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson"];
  const now = new Date();
  
  return [
    {
      id: 1,
      type: "CREATED",
      message: `Task created by ${mockUsers[0]}`,
      timestamp: formatRelativeTime(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
      user: mockUsers[0]
    },
    {
      id: 2,
      type: "STATUS_CHANGED",
      message: "Status changed from 'New' → 'In Progress'",
      timestamp: formatRelativeTime(new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000)),
      user: mockUsers[1]
    },
    {
      id: 3,
      type: "COMMENT",
      message: `${mockUsers[2]} commented: "Need to verify timesheet entry."`,
      timestamp: formatRelativeTime(new Date(now.getTime() - 3 * 60 * 60 * 1000)),
      user: mockUsers[2]
    },
    {
      id: 4,
      type: "UPDATED",
      message: "Due date changed to tomorrow",
      timestamp: formatRelativeTime(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
      user: mockUsers[1]
    },
    {
      id: 5,
      type: "STATUS_CHANGED",
      message: "Status changed from 'In Progress' → 'Completed'",
      timestamp: formatRelativeTime(new Date(now.getTime() - 30 * 60 * 1000)),
      user: mockUsers[3]
    },
  ];
}

// Format timestamp to relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

export function TaskHistory({ 
  isOpen, 
  onClose, 
  taskTitle,
  history 
}: TaskHistoryProps) {
  const events = history && history.length > 0 ? history : generateMockHistory();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5 text-blue-600" />
            Task History
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Activity log for: <span className="font-semibold text-gray-900">{taskTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Timeline container with scroll */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="space-y-1 py-4">
            <AnimatePresence>
              {events.map((event, index) => {
                const config = eventTypeConfig[event.type];
                const Icon = config.icon;
                const isLast = index === events.length - 1;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="relative"
                  >
                    {/* Timeline line */}
                    {!isLast && (
                      <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 to-transparent" />
                    )}

                    {/* Event card */}
                    <div className="flex items-start gap-3 group">
                      {/* Icon with animated background */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`relative z-10 flex items-center justify-center h-8 w-8 rounded-full ${config.bgColor} ${config.borderColor} border-2 shadow-sm transition-all group-hover:shadow-md`}
                      >
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </motion.div>

                      {/* Event content */}
                      <div className="flex-1 min-w-0 pb-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Event type badge */}
                            <Badge 
                              variant="outline" 
                              className={`text-xs mb-1.5 ${config.bgColor} ${config.color} ${config.borderColor} border font-medium`}
                            >
                              {config.label}
                            </Badge>
                            
                            {/* Event message */}
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {event.message}
                            </p>
                          </div>

                          {/* Timestamp */}
                          <time className="text-xs text-gray-500 font-medium shrink-0 mt-0.5">
                            {event.timestamp}
                          </time>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer with event count */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-700">{events.length}</span> activity {events.length === 1 ? 'entry' : 'entries'}
          </p>
          <Badge variant="secondary" className="text-xs">
            Latest activity {events[0]?.timestamp}
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}
