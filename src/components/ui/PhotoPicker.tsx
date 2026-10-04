'use client';

import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Upload, X, RotateCcw, Check, Sparkles, Loader2, AlertCircle } from 'lucide-react';

export interface PhotoPickerProps {
  currentImageUrl?: string;
  onPhotoSelected: (url: string, file?: File) => void;
  onPhotoRemoved?: () => void;
  label?: string;
  required?: boolean;
  parentType?: string; // 'TASK_PROOF' | 'MEAL' | 'WORKOUT' | 'JOURNAL' | 'MEMORY' | 'STUDY'
  parentId?: string;
  visibility?: 'PRIVATE' | 'SHARED';
  ownerId?: string;
  spaceId?: string;
}

export function PhotoPicker({
  currentImageUrl,
  onPhotoSelected,
  onPhotoRemoved,
  label = 'Add Photo',
  required = false,
  parentType = 'TASK_PROOF',
  parentId,
  visibility = 'PRIVATE',
  ownerId = 'user_shanmukh',
  spaceId = 'space_lifeos_demo'
}: PhotoPickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    // Validate size (15MB max)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 15MB. Please choose a smaller photo.');
      return;
    }

    // Immediate local preview using Object URL
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // Upload to server API
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ownerId', ownerId);
      formData.append('spaceId', spaceId);
      formData.append('parentType', parentType);
      if (parentId) formData.append('parentId', parentId);
      formData.append('visibility', visibility);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setPreviewUrl(data.url);
      onPhotoSelected(data.url, file);
    } catch (err: any) {
      console.error('Photo upload error:', err);
      // Fallback to local base64/blob if network fails
      onPhotoSelected(localUrl, file);
    } finally {
      setIsUploading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (onPhotoRemoved) onPhotoRemoved();
  };

  return (
    <div className="space-y-2">
      {/* Hidden native mobile camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* Hidden standard gallery/file input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={onFileInputChange}
        className="hidden"
      />

      {label && (
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-foreground flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5 text-primary" />
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*Required</span>}
          </label>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            visibility === 'SHARED' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            {visibility === 'SHARED' ? 'Shared with Partner' : 'Private (You Only)'}
          </span>
        </div>
      )}

      {/* Active Photo Preview */}
      {previewUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-sm group">
          <div className="aspect-video w-full relative bg-muted flex items-center justify-center overflow-hidden">
            <img
              src={previewUrl}
              alt="Uploaded photo preview"
              className="w-full h-full object-cover transition-transform group-hover:scale-102 duration-300"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs font-semibold">Persisting authentic photo...</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-card border-t border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-foreground">Real User Photo Attached</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-foreground text-[11px] font-medium"
              >
                <RotateCcw className="h-3 w-3" /> Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-500 hover:bg-rose-500/10 text-[11px] font-medium"
              >
                <X className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Upload State */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border bg-secondary/20 hover:border-primary/50'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <Camera className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-bold text-foreground">Attach Real Photographic Evidence</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Real photos from your phone camera or gallery. No fake AI placeholders.
              </p>
            </div>

            {/* Mobile / Desktop Action Buttons */}
            <div className="flex items-center justify-center gap-2 w-full max-w-xs">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:opacity-95 transition-all"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground transition-all"
              >
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                <span>Gallery / File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-rose-500 text-xs p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
