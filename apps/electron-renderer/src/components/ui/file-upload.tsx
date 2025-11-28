import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Upload, X, Image as ImageIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const fileUploadVariants = cva(
  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
  {
    variants: {
      variant: {
        default: "border-input hover:border-primary/50",
        error: "border-destructive hover:border-destructive/50",
        success: "border-green-500 hover:border-green-600",
      },
      dragActive: {
        true: "border-primary bg-primary/5",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      dragActive: false,
    },
  }
)

export interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof fileUploadVariants> {
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSize?: number
  value?: File[]
  onValueChange?: (files: File[]) => void
  disabled?: boolean
  error?: string
}

export interface FileUploadItemProps {
  file: File
  onRemove: () => void
  preview?: string
}

const FileUploadItem = ({ file, onRemove, preview }: FileUploadItemProps) => {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const isImage = file.type.startsWith("image/")

  React.useEffect(() => {
    if (isImage && file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file, isImage])

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
      {isImage && previewUrl ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="size-10 object-cover rounded"
        />
      ) : (
        <div className="size-10 bg-muted rounded flex items-center justify-center">
          <ImageIcon className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="shrink-0"
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({
    className,
    variant,
    accept = "image/*",
    multiple = false,
    maxFiles = 1,
    maxSize = 5 * 1024 * 1024, // 5MB
    value = [],
    onValueChange,
    disabled = false,
    error,
    children,
    ...props
  }, ref) => {
    const [dragActive, setDragActive] = React.useState(false)
    const [validationError, setValidationError] = React.useState<string | null>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const validateFiles = (files: FileList | null): string | null => {
      if (!files) return null

      const fileArray = Array.from(files)

      // Check number of files
      if (maxFiles && value.length + fileArray.length > maxFiles) {
        return `Maximum ${maxFiles} files allowed`
      }

      // Check file sizes
      for (const file of fileArray) {
        if (maxSize && file.size > maxSize) {
          return `File "${file.name}" exceeds maximum size of ${(maxSize / 1024 / 1024).toFixed(1)}MB`
        }
      }

      return null
    }

    const handleFiles = (files: FileList | null) => {
      if (!files) return

      const validationError = validateFiles(files)
      if (validationError) {
        setValidationError(validationError)
        setTimeout(() => setValidationError(null), 5000)
        return
      }

      const newFiles = multiple
        ? [...value, ...Array.from(files)]
        : Array.from(files).slice(0, 1)

      onValueChange?.(newFiles)
      setValidationError(null)
    }

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true)
      } else if (e.type === "dragleave") {
        setDragActive(false)
      }
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled) return

      const files = e.dataTransfer.files
      handleFiles(files)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return
      handleFiles(e.target.files)
      // Reset input value to allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }

    const handleRemoveFile = (index: number) => {
      const newFiles = value.filter((_, i) => i !== index)
      onValueChange?.(newFiles)
    }

    const handleClick = () => {
      if (!disabled && inputRef.current) {
        inputRef.current.click()
      }
    }

    const currentVariant = error || validationError ? "error" : variant

    return (
      <div ref={ref} className={cn("space-y-3", className)}>
        <div
          className={cn(
            fileUploadVariants({
              variant: currentVariant,
              dragActive
            }),
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "cursor-pointer"
          )}
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          {...props}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
            disabled={disabled}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-2">
            <Upload className="size-8 text-muted-foreground" />
            {children || (
              <>
                <p className="text-sm font-medium">
                  {dragActive ? "Drop files here" : "Upload images"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, JPEG up to {(maxSize / 1024 / 1024).toFixed(1)}MB
                </p>
              </>
            )}
          </div>
        </div>

        {(error || validationError) && (
          <p className="text-sm text-destructive">{error || validationError}</p>
        )}

        {value.length > 0 && (
          <div className="space-y-2">
            {value.map((file, index) => (
              <FileUploadItem
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => handleRemoveFile(index)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }
)

FileUpload.displayName = "FileUpload"

export { FileUpload, fileUploadVariants }