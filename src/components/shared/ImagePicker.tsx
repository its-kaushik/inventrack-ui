'use client';

import { useCallback, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface ImagePickerProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImagePicker({
  images,
  onChange,
  maxImages = 5,
  className,
}: ImagePickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const remaining = maxImages - images.length;
      const toProcess = Array.from(files).slice(0, remaining);

      toProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          onChange([...images, result]);
        };
        reader.readAsDataURL(file);
      });
    },
    [images, maxImages, onChange],
  );

  const handleCameraCapture = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    },
    [processFiles],
  );

  const handleGallerySelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      e.target.value = '';
    },
    [processFiles],
  );

  const removeImage = useCallback(
    (index: number) => {
      onChange(images.filter((_, i) => i !== index));
    },
    [images, onChange],
  );

  const canAddMore = images.length < maxImages;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={!canAddMore}
          className="h-11 flex-1 gap-1.5"
        >
          <Camera className="size-5" />
          Take Photo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => galleryInputRef.current?.click()}
          disabled={!canAddMore}
          className="h-11 flex-1 gap-1.5"
        >
          <Upload className="size-5" />
          Upload
        </Button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleGallerySelect}
        className="hidden"
        aria-hidden="true"
      />

      {/* Image count */}
      {images.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {images.length} / {maxImages} images
        </p>
      )}

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {images.map((src, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-lg border border-input"
            >
              <img
                src={src}
                alt={`Image ${index + 1}`}
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className={cn(
                  'absolute top-1 right-1 flex size-6 items-center justify-center rounded-full',
                  'bg-black/60 text-white transition-opacity',
                  'opacity-100 hover:bg-black/80',
                  'sm:opacity-0 sm:group-hover:opacity-100',
                )}
                aria-label={`Remove image ${index + 1}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
