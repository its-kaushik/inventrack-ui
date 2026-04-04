import { useState, useCallback } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { getPresignedUrl } from '@/api/uploads.api'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value: string[] // S3 keys
  onChange: (keys: string[]) => void
  purpose: string // e.g. 'products', 'purchases'
  maxFiles?: number
  className?: string
}

export function ImageUpload({ value, onChange, purpose, maxFiles = 5, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    if (value.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    setUploading(true)
    const newKeys: string[] = []

    try {
      for (const file of files) {
        // Get presigned URL
        const response = await getPresignedUrl(file.name, file.type, purpose)
        const { url, key } = response.data

        // Upload directly to S3
        await fetch(url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })

        newKeys.push(key)
      }

      onChange([...value, ...newKeys])
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }, [value, onChange, purpose, maxFiles])

  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Thumbnail grid */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((key, index) => (
            <div
              key={key}
              className="relative size-20 rounded-md border bg-muted flex items-center justify-center group"
            >
              <ImageIcon className="size-8 text-muted-foreground" />
              <button
                type="button"
                className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(index)}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {value.length < maxFiles && (
        <label
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:bg-accent/50 transition-colors',
            uploading && 'pointer-events-none opacity-60'
          )}
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="size-6 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
          </span>
          <span className="text-xs text-muted-foreground">
            JPEG, PNG, WebP, PDF (max {maxFiles} files)
          </span>
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple={maxFiles > 1}
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  )
}

export type { ImageUploadProps }
