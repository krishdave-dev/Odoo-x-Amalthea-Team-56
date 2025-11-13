"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Clock, CheckCircle2, AlertTriangle, FileText, ListTodo, Users, Receipt, CalendarDays } from "lucide-react";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
// Using a lightweight separator; if shadcn separator not available fall back to a div.
// @ts-expect-error: optional dependency may not exist yet
import { Separator } from '@/components/ui/separator';
import { badgeVariants } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface NotificationData {
  [key: string]: unknown;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: NotificationData | null;
}

interface DeadlineAlert {
  id: string; // synthetic id prefix 'deadline-' + task id
  title: string;
  message: string;
  dueDate: string;
  taskId: number;
  isOverdue: boolean;
  type: 'DEADLINE_ALERT';
}

// Map notification type to icon + color accent
const typeMeta: Record<string, { icon: React.ReactNode; className: string; label?: string }> = {
  INVITATION_RECEIVED: { icon: <Users className="h-4 w-4" />, className: 'bg-secondary text-secondary-foreground', label: 'Invitation' },
  INVITATION_ACCEPTED: { icon: <Users className="h-4 w-4" />, className: 'bg-secondary text-secondary-foreground', label: 'Invitation' },
  INVITATION_REJECTED: { icon: <Users className="h-4 w-4" />, className: 'bg-secondary text-secondary-foreground', label: 'Invitation' },
  TASK_ASSIGNED: { icon: <ListTodo className="h-4 w-4" />, className: 'bg-primary/15 text-primary', label: 'Task' },
  TASK_COMPLETED: { icon: <CheckCircle2 className="h-4 w-4" />, className: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300', label: 'Task' },
  EXPENSE_APPROVED: { icon: <Receipt className="h-4 w-4" />, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', label: 'Expense' },
  EXPENSE_REJECTED: { icon: <Receipt className="h-4 w-4" />, className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', label: 'Expense' },
  PROJECT_CREATED: { icon: <FileText className="h-4 w-4" />, className: 'bg-primary/15 text-primary', label: 'Project' },
  REPORT_READY: { icon: <FileText className="h-4 w-4" />, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', label: 'Report' },
  SYSTEM_ALERT: { icon: <AlertTriangle className="h-4 w-4" />, className: 'bg-destructive/15 text-destructive', label: 'System' },
  DEADLINE_ALERT: { icon: <Clock className="h-4 w-4" />, className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', label: 'Deadline' },
  CUSTOM: { icon: <Bell className="h-4 w-4" />, className: 'bg-muted text-muted-foreground', label: 'Notice' },
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deadlineAlerts, setDeadlineAlerts] = useState<DeadlineAlert[]>([]);
  const [markingAll, setMarkingAll] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const userId = user?.id; // derived from auth context

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      // TEMP: Require userId query param until session integration
      if (!userId) {
        setNotifications([]);
        setDeadlineAlerts([]);
        setLoading(false);
        return;
      }
      const params = new URLSearchParams({ userId: String(userId) });
      if (showUnreadOnly) params.set('unreadOnly', 'true');
      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load notifications');
      const data = await res.json();
      setNotifications(data.data.notifications || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, userId, showUnreadOnly]);

  const fetchDeadlineAlerts = useCallback(async () => {
    try {
      // We can reuse tasks endpoint or build synthetic ones; placeholder for now
      // TODO: fetch tasks assigned to current user and compute due soon alerts
      setDeadlineAlerts([]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchDeadlineAlerts();
  }, [fetchNotifications, fetchDeadlineAlerts]);

  const markAllRead = async () => {
    if (!userId) return;
    try {
      setMarkingAll(true);
  const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark all as read');
      toast({ title: 'Success', description: 'All notifications marked as read.' });
      fetchNotifications();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setMarkingAll(false);
    }
  };

  const toggleUnreadFilter = () => setShowUnreadOnly(v => !v);

  const markSingleRead = async (id: number) => {
    if (!userId) return;
    try {
  const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to mark notification as read');
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const renderItem = (n: Notification | DeadlineAlert) => {
    const isDeadline = (n as DeadlineAlert).type === 'DEADLINE_ALERT';
    const meta = typeMeta[n.type] || typeMeta.CUSTOM;
    const createdAt = 'createdAt' in n ? new Date(n.createdAt) : new Date((n as DeadlineAlert).dueDate);
    const rel = timeAgo(createdAt);
    const isRead = !isDeadline && (n as Notification).isRead;

    return (
      <div key={n.id} className={cn('flex items-start gap-3 rounded-md border p-3 bg-card hover:bg-accent/40 transition', isRead && 'opacity-65')}>        
        <div className={cn('h-8 w-8 rounded-md flex items-center justify-center shrink-0', meta.className)}>
          {meta.icon}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium leading-none text-sm">{n.title}</h4>
            {isDeadline && (
              <span className={cn(badgeVariants({ variant: 'outline' }), 'text-[10px]')}>Due Soon</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{'message' in n ? (n as Notification).message : (n as DeadlineAlert).message}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{rel}</span>
            {!isRead && !isDeadline && (
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => markSingleRead((n as Notification).id)}>Mark Read</Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</h2>
          <p className="text-sm text-muted-foreground">Your updates, assignments & system messages.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showUnreadOnly ? 'secondary' : 'outline'} onClick={toggleUnreadFilter}>{showUnreadOnly ? 'Showing Unread' : 'Show Unread'}</Button>
          <Button variant="outline" disabled={markingAll || !notifications.length} onClick={markAllRead}>Mark All Read</Button>
        </div>
      </div>
      <Separator />
      {loading ? (
  <div className="grid gap-3" aria-busy="true" aria-label="Loading notifications">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-md bg-muted/40" />
          ))}
        </div>
      ) : notifications.length === 0 && deadlineAlerts.length === 0 ? (
        <Card className="p-8 text-center space-y-2" role="status" aria-live="polite">
          <Bell className="h-8 w-8 mx-auto text-muted-foreground" />
          <h3 className="font-medium">No notifications</h3>
          <p className="text-sm text-muted-foreground">You&apos;re all caught up. We&apos;ll notify you when something changes.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {deadlineAlerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Upcoming Deadlines</h3>
              {deadlineAlerts.map(renderItem)}
            </div>
          )}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Bell className="h-4 w-4" /> All Notifications</h3>
            {notifications.map(renderItem)}
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(day / 365);
  return `${yr}y ago`;
}
