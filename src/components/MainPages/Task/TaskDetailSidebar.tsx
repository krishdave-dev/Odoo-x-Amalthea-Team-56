"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle2, 
  MessageSquare, 
  RefreshCw, 
  Plus,
  Send,
  History,
  MessageCircle,
  Clock,
  HelpCircle,
  Lightbulb,
  Info,
  Reply
} from "lucide-react";

// Event type configuration
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

// Comment type configuration
const commentTypeConfig = {
  QUESTION: {
    icon: HelpCircle,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    label: "Question",
    hoverBg: "hover:bg-orange-100",
    activeBg: "bg-orange-100",
    activeBorder: "border-orange-400"
  },
  UPDATE: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Update",
    hoverBg: "hover:bg-blue-100",
    activeBg: "bg-blue-100",
    activeBorder: "border-blue-400"
  },
  FEEDBACK: {
    icon: Lightbulb,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    label: "Feedback",
    hoverBg: "hover:bg-green-100",
    activeBg: "bg-green-100",
    activeBorder: "border-green-400"
  },
} as const;

interface HistoryEvent {
  id: number;
  type: keyof typeof eventTypeConfig;
  message: string;
  timestamp: string;
}

interface Comment {
  id: number;
  user: string;
  type: keyof typeof commentTypeConfig;
  comment: string;
  timestamp: string;
  mentions?: string[]; // List of mentioned users
  requiresResolution?: boolean; // If comment has mentions that need resolution
  isResolved?: boolean; // If all mentioned users have replied
  parentId?: number; // For threading replies
  replies?: Comment[]; // Nested replies
}

interface Timesheet {
  id: number;
  user: string;
  hours: number;
  description: string;
  date: string;
  timestamp: string;
}

interface TaskDetailSidebarProps {
  taskTitle: string;
  taskId: number;
}

// Mock team members for mentions
const TEAM_MEMBERS = [
  "Krish Dave",
  "Chhaya Patel", 
  "Shreya Shah",
  "Raj Mehta",
  "Priya Desai",
  "You"
];

// Mock data generators
function generateMockHistory(): HistoryEvent[] {
  const mockUsers = ["Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson"];
  const now = new Date();
  
  return [
    {
      id: 5,
      type: "STATUS_CHANGED",
      message: "Status changed from 'In Progress' → 'Completed'",
      timestamp: formatRelativeTime(new Date(now.getTime() - 30 * 60 * 1000)),
    },
    {
      id: 4,
      type: "UPDATED",
      message: "Due date changed to tomorrow",
      timestamp: formatRelativeTime(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
    },
    {
      id: 3,
      type: "COMMENT",
      message: `${mockUsers[2]} commented: "Need to verify timesheet entry."`,
      timestamp: formatRelativeTime(new Date(now.getTime() - 3 * 60 * 60 * 1000)),
    },
    {
      id: 2,
      type: "STATUS_CHANGED",
      message: "Status changed from 'New' → 'In Progress'",
      timestamp: formatRelativeTime(new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000)),
    },
    {
      id: 1,
      type: "CREATED",
      message: `Task created by ${mockUsers[0]}`,
      timestamp: formatRelativeTime(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
    },
  ];
}

function generateMockComments(): Comment[] {
  const now = new Date();
  
  return [
    {
      id: 1,
      user: "Krish Dave",
      type: "QUESTION",
      comment: "@Chhaya Patel Should we include design review in this sprint?",
      timestamp: formatRelativeTime(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
      mentions: ["Chhaya Patel"],
      requiresResolution: true,
      isResolved: true,
      replies: [
        {
          id: 4,
          user: "Chhaya Patel",
          type: "UPDATE",
          comment: "Yes, let's schedule it for Friday afternoon.",
          timestamp: formatRelativeTime(new Date(now.getTime() - 1.8 * 24 * 60 * 60 * 1000)),
          parentId: 1,
        }
      ]
    },
    {
      id: 2,
      user: "Chhaya Patel",
      type: "UPDATE",
      comment: "@You Backend integration completed. Can you verify the API endpoints?",
      timestamp: formatRelativeTime(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
      mentions: ["You"],
      requiresResolution: true,
      isResolved: false,
    },
    {
      id: 3,
      user: "Shreya Shah",
      type: "FEEDBACK",
      comment: "UI looks great now! The animations are smooth.",
      timestamp: formatRelativeTime(new Date(now.getTime() - 3 * 60 * 60 * 1000)),
    },
  ];
}

function generateMockTimesheets(): Timesheet[] {
  const now = new Date();
  
  return [
    {
      id: 1,
      user: "Krish Dave",
      hours: 4.5,
      description: "Implemented user authentication and session management",
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric' 
      }),
      timestamp: formatRelativeTime(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
    },
    {
      id: 2,
      user: "Chhaya Patel",
      hours: 3.0,
      description: "Backend API integration and database schema updates",
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric' 
      }),
      timestamp: formatRelativeTime(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
    },
    {
      id: 3,
      user: "Shreya Shah",
      hours: 2.5,
      description: "UI/UX refinements and responsive design improvements",
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric' 
      }),
      timestamp: formatRelativeTime(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
    },
    {
      id: 4,
      user: "Krish Dave",
      hours: 5.0,
      description: "Code review, bug fixes, and performance optimization",
      date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric' 
      }),
      timestamp: formatRelativeTime(new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)),
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

// Get initials
function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Render text with highlighted mentions
function renderTextWithMentions(text: string, highlightYou: boolean = true) {
  if (!text) return null;
  
  // Create a regex that matches all team members with @ prefix
  // Sort by length (longest first) to match "Krish Dave" before "Krish"
  const sortedMembers = [...TEAM_MEMBERS].sort((a, b) => b.length - a.length);
  const memberPattern = sortedMembers.map(m => m.replace(/\s+/g, '\\s+')).join('|');
  const regex = new RegExp(`(@(?:${memberPattern}))`, 'gi');
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }
    
    const mention = match[0]; // e.g., "@You"
    const mentionName = mention.substring(1).trim(); // e.g., "You"
    const isYou = mentionName.toLowerCase() === 'you';
    
    // Add the highlighted mention
    parts.push(
      <span 
        key={`mention-${match.index}`}
        className={`font-semibold ${
          highlightYou && isYou
            ? 'text-orange-600 bg-orange-100 px-1 rounded' 
            : 'text-blue-600 bg-blue-100 px-1 rounded'
        }`}
      >
        {mention}
      </span>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after last mention
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }
  
  return parts.length > 0 ? parts : <span>{text}</span>;
}

export function TaskDetailSidebar({ taskTitle, taskId }: TaskDetailSidebarProps) {
  const [history] = useState<HistoryEvent[]>(generateMockHistory());
  const [comments, setComments] = useState<Comment[]>(generateMockComments());
  const [timesheets] = useState<Timesheet[]>(generateMockTimesheets());
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState<keyof typeof commentTypeConfig>("UPDATE");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  // Extract mentions from comment text
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+(?:\s+\w+)?)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedName = match[1];
      // Check if the mention matches a team member
      const teamMember = TEAM_MEMBERS.find(member => 
        member.toLowerCase().includes(mentionedName.toLowerCase())
      );
      if (teamMember) {
        mentions.push(teamMember);
      }
    }
    
    return [...new Set(mentions)]; // Remove duplicates
  };

  // Handle comment input changes with mention detection
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart;
    setNewComment(value);
    setCursorPosition(cursor);

    // Check if user is typing a mention
    const textBeforeCursor = value.substring(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && atIndex === cursor - 1) {
      // Just typed @
      setShowMentionSuggestions(true);
      setMentionSearch("");
    } else if (atIndex !== -1) {
      const searchText = textBeforeCursor.substring(atIndex + 1);
      if (searchText.length > 0 && !searchText.includes(' ')) {
        setShowMentionSuggestions(true);
        setMentionSearch(searchText);
      } else if (searchText.includes(' ') || cursor - atIndex > 20) {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Insert mention at cursor position
  const insertMention = (memberName: string) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const textAfterCursor = newComment.substring(cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    const newText = 
      textBeforeCursor.substring(0, atIndex) + 
      `@${memberName} ` + 
      textAfterCursor;
    
    setNewComment(newText);
    setShowMentionSuggestions(false);
  };

  // Filter team members based on search
  const filteredMembers = TEAM_MEMBERS.filter(member =>
    member.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const mentions = extractMentions(newComment);
    const newCommentObj: Comment = {
      id: Date.now(),
      user: "You",
      type: commentType,
      comment: newComment,
      timestamp: "just now",
      mentions: mentions.length > 0 ? mentions : undefined,
      requiresResolution: mentions.length > 0,
      isResolved: false,
      parentId: replyingTo || undefined,
    };

    if (replyingTo) {
      // Add as a reply to existing comment
      setComments(comments.map(comment => {
        if (comment.id === replyingTo) {
          return {
            ...comment,
            isResolved: true, // Mark parent as resolved when replied
            replies: [...(comment.replies || []), newCommentObj]
          };
        }
        return comment;
      }));
      setReplyingTo(null);
    } else {
      // Add as new comment
      setComments([...comments, newCommentObj]);
    }

    setNewComment("");
  };

  // Calculate total hours from timesheets
  const totalHours = timesheets.reduce((sum, timesheet) => sum + timesheet.hours, 0);

  return (
    <Card className="shadow-lg border-gray-200 h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
      <Tabs defaultValue="activity" className="w-full flex flex-col h-full overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 flex-shrink-0">
          <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-white">
            <History className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2 data-[state=active]:bg-white">
            <MessageCircle className="h-4 w-4" />
            Comments
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {comments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="timesheets" className="gap-2 data-[state=active]:bg-white">
            <Clock className="h-4 w-4" />
            Hours
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {totalHours}h
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <CardContent className="p-4">
              <div className="space-y-1">
                <AnimatePresence>
                  {history.map((event, index) => {
                    const config = eventTypeConfig[event.type];
                    const Icon = config.icon;
                    const isLast = index === history.length - 1;

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className="relative"
                      >
                        {/* Timeline line */}
                        {!isLast && (
                          <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 to-transparent" />
                        )}

                        {/* Event card */}
                        <div className="flex items-start gap-3 group">
                          {/* Icon */}
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className={`relative z-10 flex items-center justify-center h-8 w-8 rounded-full ${config.bgColor} ${config.borderColor} border-2 shadow-sm transition-all group-hover:shadow-md`}
                          >
                            <Icon className={`h-4 w-4 ${config.color}`} />
                          </motion.div>

                          {/* Event content */}
                          <div className="flex-1 min-w-0 pb-6">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs mb-1.5 ${config.bgColor} ${config.color} ${config.borderColor} border font-medium`}
                                >
                                  {config.label}
                                </Badge>
                                <p className="text-sm text-gray-800 leading-relaxed">
                                  {event.message}
                                </p>
                              </div>
                              <time className="text-xs text-gray-500 font-medium shrink-0">
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
            </CardContent>
          </ScrollArea>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <CardContent className="p-4 space-y-4">
              {/* Comments List */}
              <div className="space-y-3">
                <AnimatePresence>
                  {comments.filter(c => !c.parentId).map((comment, index) => {
                    const typeConfig = commentTypeConfig[comment.type];
                    const needsYourResolution = comment.mentions?.includes("You") && !comment.isResolved;

                    return (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className={`bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow ${
                          needsYourResolution ? 'border-orange-300 bg-orange-50/30' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <Avatar className="h-8 w-8 border-2 border-gray-200">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                              {getInitials(comment.user)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Comment content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900">
                                {comment.user}
                              </span>
                              <Badge 
                                variant="outline"
                                className={`text-xs ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border} border`}
                              >
                                {typeConfig.label}
                              </Badge>
                              
                              {/* Resolution Status */}
                              {comment.requiresResolution && (
                                <Badge 
                                  variant="outline"
                                  className={`text-xs ${
                                    comment.isResolved 
                                      ? 'bg-green-50 text-green-700 border-green-200' 
                                      : 'bg-orange-50 text-orange-700 border-orange-200'
                                  }`}
                                >
                                  {comment.isResolved ? '✓ Resolved' : '⏳ Needs Reply'}
                                </Badge>
                              )}
                              
                              <time className="text-xs text-gray-500 ml-auto">
                                {comment.timestamp}
                              </time>
                            </div>
                            
                            {/* Comment Text with Highlighted Mentions */}
                            <p className="text-sm text-gray-700 leading-relaxed mb-2">
                              {renderTextWithMentions(comment.comment, true)}
                            </p>

                            {/* Action Buttons */}
                            {needsYourResolution && (
                              <button
                                onClick={() => {
                                  setReplyingTo(comment.id);
                                  setNewComment(`@${comment.user} `);
                                }}
                                className="inline-flex items-center justify-center h-6 w-6 rounded bg-orange-100 border border-orange-200 text-orange-700 hover:bg-orange-200 hover:border-orange-300 transition-all"
                                title="Reply to Resolve"
                              >
                                <Reply className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-3 ml-4 space-y-2 border-l-2 border-gray-200 pl-3">
                                {comment.replies.map((reply) => {
                                  const replyTypeConfig = commentTypeConfig[reply.type];
                                  return (
                                    <div key={reply.id} className="flex items-start gap-2">
                                      <Avatar className="h-6 w-6 border border-gray-200">
                                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-[10px] font-bold">
                                          {getInitials(reply.user)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                          <span className="text-xs font-semibold text-gray-900">
                                            {reply.user}
                                          </span>
                                          <time className="text-[10px] text-gray-500">
                                            {reply.timestamp}
                                          </time>
                                        </div>
                                        <p className="text-xs text-gray-700 leading-relaxed">
                                          {renderTextWithMentions(reply.comment, false)}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Add Comment Form */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 space-y-3">
                {/* Comment Type Selector - Compact Visual Buttons */}
                <div className="flex gap-1.5">
                  {(Object.keys(commentTypeConfig) as Array<keyof typeof commentTypeConfig>).map((type) => {
                    const config = commentTypeConfig[type];
                    const Icon = config.icon;
                    const isActive = commentType === type;
                    
                    return (
                      <button
                        key={type}
                        onClick={() => setCommentType(type)}
                        className={`flex items-center gap-1 px-2 py-1 rounded border-2 transition-all text-xs font-medium ${
                          isActive 
                            ? `${config.activeBg} ${config.color} ${config.activeBorder} shadow-sm` 
                            : `${config.bg} ${config.color} ${config.border} ${config.hoverBg}`
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
                
                {/* Replying To Indicator */}
                {replyingTo && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <span className="text-blue-700">
                      ↩ Replying to comment #{replyingTo}
                    </span>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setNewComment("");
                      }}
                      className="ml-auto text-blue-600 hover:text-blue-800"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                )}
                
                <div className="relative">
                  {/* Overlay for highlighting mentions - shows behind textarea */}
                  {newComment.includes('@') && (
                    <div 
                      className="absolute inset-0 pointer-events-none overflow-hidden rounded-md border border-transparent px-3 py-2 text-sm whitespace-pre-wrap break-words text-gray-700"
                      style={{ 
                        lineHeight: '1.5rem',
                        minHeight: '60px',
                        fontFamily: 'inherit'
                      }}
                    >
                      {renderTextWithMentions(newComment, true)}
                    </div>
                  )}
                  
                  {/* Actual textarea */}
                  <Textarea
                    placeholder="Add a comment… (Use @ to mention someone)"
                    value={newComment}
                    onChange={handleCommentChange}
                    className={`relative flex-1 min-h-[60px] text-sm resize-none ${
                      newComment.includes('@') ? 'text-transparent caret-gray-900' : ''
                    }`}
                    style={newComment.includes('@') ? { 
                      caretColor: '#111827'
                    } : {}}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !showMentionSuggestions) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  
                  {/* Mention Suggestions Dropdown */}
                  {showMentionSuggestions && filteredMembers.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                      {filteredMembers.map((member) => (
                        <button
                          key={member}
                          onClick={() => insertMention(member)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
                        >
                          <Avatar className="h-6 w-6 border border-gray-200">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[10px] font-bold">
                              {getInitials(member)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900">{member}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  size="sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  {replyingTo ? 'Send Reply' : 'Send Comment'}
                </Button>
              </div>
            </CardContent>
          </ScrollArea>
        </TabsContent>

        {/* Timesheets Tab */}
        <TabsContent value="timesheets" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <CardContent className="p-4 space-y-4">
              {/* Total Hours Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Hours Logged</p>
                    <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
                  </div>
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {timesheets.length} timesheet entr{timesheets.length === 1 ? 'y' : 'ies'}
                </p>
              </div>

              {/* Timesheets List */}
              <div className="space-y-3">
                <AnimatePresence>
                  {timesheets.map((timesheet, index) => (
                    <motion.div
                      key={timesheet.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <Avatar className="h-8 w-8 border-2 border-gray-200">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                            {getInitials(timesheet.user)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Timesheet content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-gray-900">
                              {timesheet.user}
                            </span>
                            <Badge 
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {timesheet.hours}h
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed mb-2">
                            {timesheet.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="font-medium">{timesheet.date}</span>
                            <span>•</span>
                            <span>{timesheet.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Empty State */}
              {timesheets.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No timesheet entries yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start logging your hours to track progress</p>
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
