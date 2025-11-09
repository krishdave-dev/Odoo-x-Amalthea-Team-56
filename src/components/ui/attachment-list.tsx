"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Download, Eye, Trash2, FileIcon, Image as ImageIcon, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Attachment {
  id: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string | null;
  backupAvailable: boolean;
  status: string;
  uploadedAt: string;
  uploader?: {
    id: number;
    name: string;
    email: string;
  };
}

interface AttachmentListProps {
  /**
   * Owner type (e.g., 'task', 'project', 'expense')
   */
  ownerType: string;

  /**
   * Owner ID (e.g., task ID, project ID)
   */
  ownerId: number;

  /**
   * Organization ID for filtering
   */
  organizationId?: number;

  /**
   * Show delete button
   */
  allowDelete?: boolean;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Callback when attachment is deleted
   */
  onDelete?: (attachmentId: number) => void;

  /**
   * Trigger refresh from parent
   */
  refreshTrigger?: number;
}

export function AttachmentList({
  ownerType,
  ownerId,
  organizationId,
  allowDelete = true,
  className,
  onDelete,
  refreshTrigger,
}: AttachmentListProps) {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");
  const [previewName, setPreviewName] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchAttachments();
  }, [ownerType, ownerId, organizationId, refreshTrigger]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ownerType,
        ownerId: ownerId.toString(),
      });

      if (organizationId) {
        params.append("organizationId", organizationId.toString());
      }

      const response = await fetch(`/api/attachments?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch attachments");
      }

      const data = await response.json();
      setAttachments(data.data || []);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      toast({
        title: "Error",
        description: "Failed to load attachments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (attachment: Attachment) => {
    if (attachment.fileUrl) {
      // Use Cloudinary URL directly
      setPreviewUrl(attachment.fileUrl);
      setPreviewType(attachment.mimeType);
      setPreviewName(attachment.fileName);
    } else if (attachment.backupAvailable) {
      // Fetch fallback preview
      try {
        const response = await fetch(`/api/attachments/${attachment.id}/preview`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Preview not available");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewType(attachment.mimeType);
        setPreviewName(attachment.fileName);
      } catch (error) {
        toast({
          title: "Preview unavailable",
          description: "Cannot preview this file",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      if (attachment.fileUrl) {
        // Download from Cloudinary
        window.open(attachment.fileUrl, "_blank");
      } else if (attachment.backupAvailable) {
        // Download fallback data
        const response = await fetch(`/api/attachments/${attachment.id}/fallback`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Download failed");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = attachment.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (attachmentId: number) => {
    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));

      toast({
        title: "Deleted",
        description: "Attachment deleted successfully",
      });

      if (onDelete) {
        onDelete(attachmentId);
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Could not delete attachment",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (mimeType.includes("pdf") || mimeType.includes("text")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No attachments yet
      </div>
    );
  }

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
          >
            {/* File Icon/Thumbnail */}
            <div className="flex-shrink-0">
              {attachment.mimeType.startsWith("image/") && attachment.fileUrl ? (
                <img
                  src={attachment.fileUrl}
                  alt={attachment.fileName}
                  className="h-12 w-12 rounded object-cover cursor-pointer"
                  onClick={() => handlePreview(attachment)}
                />
              ) : (
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                  {getFileIcon(attachment.mimeType)}
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.fileName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatFileSize(attachment.fileSize)}</span>
                <span>•</span>
                <span>{formatDate(attachment.uploadedAt)}</span>
                {attachment.uploader && (
                  <>
                    <span>•</span>
                    <span>{attachment.uploader.name}</span>
                  </>
                )}
              </div>
              {attachment.status !== "active" && (
                <span className="text-xs text-yellow-600">
                  {attachment.status === "pending_upload" ? "Upload pending" : attachment.status}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex gap-1">
              {attachment.mimeType.startsWith("image/") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePreview(attachment)}
                  title="Preview"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleDownload(attachment)}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              {allowDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDeletingId(attachment.id);
                    setDeleteDialogOpen(true);
                  }}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewName}</DialogTitle>
            <DialogDescription>Preview</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto">
            {previewType.startsWith("image/") && previewUrl && (
              <img src={previewUrl} alt={previewName} className="w-full h-auto" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attachment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
