"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon, Video } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface UploadedFile {
  storageId: Id<"_storage">;
  url: string;
  type: "image" | "video";
  file: File;
}

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

export function FileUpload({ onFilesChange, maxFiles = 5 }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const uploadedFiles: UploadedFile[] = [];

      for (const file of selectedFiles) {
        // Validate file type
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          setError(`${file.name} is not a valid image or video file`);
          continue;
        }

        // Validate file size
        const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
        if (file.size > maxSize) {
          setError(
            `${file.name} is too large. Max size: ${isVideo ? "50MB" : "10MB"}`
          );
          continue;
        }

        // Get upload URL
        const uploadUrl = await generateUploadUrl();

        // Upload file
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        const { storageId } = await result.json();

        // Get file URL
        const fileUrl = await fetch(
          `/api/files/url?storageId=${storageId}`
        ).then((res) => res.json());

        uploadedFiles.push({
          storageId,
          url: fileUrl.url,
          type: isVideo ? "video" : "image",
          file,
        });
      }

      const newFiles = [...files, ...uploadedFiles];
      setFiles(newFiles);
      onFilesChange(newFiles);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          disabled={uploading || files.length >= maxFiles}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload className="w-8 h-8 text-gray-400" />
          <div className="text-sm text-gray-600">
            {uploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <span className="font-semibold text-primary">
                  Click to upload
                </span>{" "}
                or drag and drop
              </>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Images (max 10MB) or Videos (max 50MB)
          </div>
          <div className="text-xs text-gray-500">
            {files.length} / {maxFiles} files
          </div>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                {file.type === "image" ? (
                  <img
                    src={URL.createObjectURL(file.file)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(index)}
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {file.type === "image" ? (
                  <ImageIcon className="w-3 h-3 inline mr-1" />
                ) : (
                  <Video className="w-3 h-3 inline mr-1" />
                )}
                {file.file.name.length > 15
                  ? file.file.name.substring(0, 15) + "..."
                  : file.file.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
