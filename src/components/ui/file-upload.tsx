"use client";

import * as React from "react";
import { useState } from "react";
import { Upload, X, FileIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  /**
   * Organization ID for file organization in Cloudinary
   */
  organizationId: number;

  /**
   * Owner type (e.g., 'task', 'project', 'expense')
   */
  ownerType: string;

  /**
   * Owner ID (e.g., task ID, project ID)
   */
  ownerId: number;

  /**
   * User ID who is uploading the file
   */
  uploadedBy?: number;

  /**
   * Accept specific file types (e.g., "image/*", ".pdf,.doc")
   */
  accept?: string;

  /**
   * Maximum file size in MB (default: 10MB)
   */
  maxSizeMB?: number;

  /**
   * Allow multiple files
   */
  multiple?: boolean;

  /**
   * Show preview for uploaded files
   */
  showPreview?: boolean;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Callback when files are successfully uploaded
   */
  onUploadComplete?: (attachments: UploadedAttachment[]) => void;

  /**
   * Callback when upload fails
   */
  onUploadError?: (error: string) => void;
}

interface UploadedAttachment {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  cloudUrl: string | null;
  backupAvailable: boolean;
  status: string;
}

interface UploadState {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  attachment?: UploadedAttachment;
}

export function FileUpload({
  organizationId,
  ownerType,
  ownerId,
  uploadedBy,
  accept,
  maxSizeMB = 10,
  multiple = false,
  showPreview = true,
  className,
  onUploadComplete,
  onUploadError,
}: FileUploadProps) {
  const { toast } = useToast();
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

    // Validate file sizes
    const maxSize = maxSizeMB * 1024 * 1024;
    const invalidFiles = selectedFiles.filter((f) => f.size > maxSize);

    if (invalidFiles.length > 0) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    // Initialize upload states
    const newUploads: UploadState[] = selectedFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending" as const,
    }));

    setUploads((prev) => (multiple ? [...prev, ...newUploads] : newUploads));

    // Upload files
    for (let i = 0; i < newUploads.length; i++) {
      await uploadFile(newUploads[i], multiple ? uploads.length + i : i);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (uploadState: UploadState, index: number) => {
    const { file } = uploadState;

    try {
      // Update status to uploading
      setUploads((prev) =>
        prev.map((u, i) => (i === index ? { ...u, status: "uploading" as const, progress: 10 } : u))
      );

      // Prepare form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("organizationId", organizationId.toString());
      formData.append("ownerType", ownerType);
      formData.append("ownerId", ownerId.toString());
      if (uploadedBy) {
        formData.append("uploadedBy", uploadedBy.toString());
      }

      // Simulate progress (since we can't track real upload progress with fetch)
      const progressInterval = setInterval(() => {
        setUploads((prev) =>
          prev.map((u, i) =>
            i === index && u.progress < 90 ? { ...u, progress: u.progress + 10 } : u
          )
        );
      }, 200);

      // Upload to API
      const response = await fetch("/api/attachments/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Upload failed");
      }

      const result = await response.json();

      // Update to success
      setUploads((prev) =>
        prev.map((u, i) =>
          i === index
            ? {
                ...u,
                status: "success" as const,
                progress: 100,
                attachment: result.data,
              }
            : u
        )
      );

      // Notify parent
      if (onUploadComplete) {
        onUploadComplete([result.data]);
      }

      toast({
        title: "Upload successful",
        description: `${file.name} uploaded successfully`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";

      setUploads((prev) =>
        prev.map((u, i) =>
          i === index
            ? {
                ...u,
                status: "error" as const,
                error: errorMessage,
              }
            : u
        )
      );

      if (onUploadError) {
        onUploadError(errorMessage);
      }

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const removeUpload = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const retryUpload = async (index: number) => {
    const upload = uploads[index];
    if (upload) {
      setUploads((prev) =>
        prev.map((u, i) =>
          i === index ? { ...u, status: "pending" as const, error: undefined } : u
        )
      );
      await uploadFile(upload, index);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getStatusIcon = (status: UploadState["status"]) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Button */}
      <div>
        <Button type="button" variant="outline" asChild>
          <label htmlFor="file-upload-input" className="cursor-pointer inline-flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {multiple ? "Upload Files" : "Upload File"}
            <input
              id="file-upload-input"
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={accept}
              multiple={multiple}
              onChange={handleFileSelect}
            />
          </label>
        </Button>
        {accept && (
          <p className="text-xs text-muted-foreground mt-1">
            Accepts: {accept}
          </p>
        )}
      </div>

      {/* Upload List */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 border rounded-lg bg-card"
            >
              {/* File Icon/Preview */}
              <div className="flex-shrink-0">
                {showPreview &&
                upload.file.type.startsWith("image/") &&
                upload.status === "success" &&
                upload.attachment?.cloudUrl ? (
                  <img
                    src={upload.attachment.cloudUrl}
                    alt={upload.file.name}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                    {getStatusIcon(upload.status)}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{upload.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(upload.file.size)}
                </p>

                {/* Progress Bar */}
                {upload.status === "uploading" && (
                  <Progress value={upload.progress} className="h-1 mt-2" />
                )}

                {/* Error Message */}
                {upload.status === "error" && upload.error && (
                  <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                )}

                {/* Success Message */}
                {upload.status === "success" && upload.attachment && (
                  <p className="text-xs text-green-600 mt-1">
                    {upload.attachment.status === "active"
                      ? "Uploaded successfully"
                      : "Queued for upload"}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex gap-1">
                {upload.status === "error" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => retryUpload(index)}
                  >
                    Retry
                  </Button>
                )}
                {(upload.status === "pending" ||
                  upload.status === "error" ||
                  upload.status === "success") && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeUpload(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
