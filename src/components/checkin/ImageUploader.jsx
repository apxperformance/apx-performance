
import { useRef, useEffect } from "react";
import { Upload, X, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// Utility function to compress and resize images
const compressImage = (file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export default function ImageUploader({ files, setFiles, isUploading = false, uploadProgress = 0 }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Check if adding these files would exceed the limit
    if (files.length + selectedFiles.length > 5) {
      toast.error('You can only upload up to 5 images');
      return;
    }

    // Compress images before adding to state
    const compressedFiles = await Promise.all(
      selectedFiles.map(async (file) => {
        try {
          // Only compress if it's an image and larger than 500KB
          if (file.type.startsWith('image/') && file.size > 500000) {
            const compressed = await compressImage(file);
            const originalSizeKB = (file.size / 1024).toFixed(0);
            const compressedSizeKB = (compressed.size / 1024).toFixed(0);
            console.log(`Compressed ${file.name}: ${originalSizeKB}KB → ${compressedSizeKB}KB (${Math.round((1 - compressed.size / file.size) * 100)}% reduction)`);
            return Object.assign(compressed, {
              preview: URL.createObjectURL(compressed)
            });
          }
          // If already small, just use as-is
          return Object.assign(file, {
            preview: URL.createObjectURL(file)
          });
        } catch (error) {
          console.error('Error compressing image:', error);
          // If compression fails, use original
          return Object.assign(file, {
            preview: URL.createObjectURL(file)
          });
        }
      })
    );

    setFiles(prev => [...prev, ...compressedFiles].slice(0, 5));
  };

  // Enhanced remove with proper cleanup and confirmation
  const removeFile = (e, fileToRemove, index) => {
    e.stopPropagation();
    
    if (isUploading) {
      toast.warning("Cannot remove photos while uploading");
      return;
    }

    // Clean up the blob URL to prevent memory leaks
    URL.revokeObjectURL(fileToRemove.preview);
    
    setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
    
    toast.success(`Photo ${index + 1} removed`);
  };

  // Clear all files with confirmation
  const clearAllFiles = (e) => {
    e.stopPropagation();
    
    if (isUploading) {
      toast.warning("Cannot clear photos while uploading");
      return;
    }

    if (files.length === 0) return;

    // Clean up all blob URLs
    files.forEach(file => URL.revokeObjectURL(file.preview));
    
    setFiles([]);
    toast.success("All photos removed");
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]); // Added files to dependency array to ensure cleanup is correct if files change

  return (
    <div className="space-y-3">
      <div
        onClick={handleClick}
        className={`p-6 border-2 border-dashed rounded-lg text-center transition-colors ${
          isUploading 
            ? 'border-border bg-secondary/50 cursor-not-allowed' 
            : 'border-border hover:border-[#C5B358]/50 hover:bg-secondary/30 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />
        {isUploading ? (
          <>
            <Loader2 className="mx-auto w-8 h-8 text-[#C5B358] mb-2 animate-spin" />
            <p className="text-[#C5B358] font-medium">Uploading images...</p>
            <p className="text-xs text-muted-foreground mt-1">{uploadProgress}% complete</p>
            {uploadProgress > 0 && (
              <Progress value={uploadProgress} className="mt-3 h-2" />
            )}
          </>
        ) : (
          <>
            <Upload className="mx-auto w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-foreground">Click to upload progress photos</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5 files (auto-compressed)</p>
            <p className="text-xs text-muted-foreground">{files.length}/5 photos selected</p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          {/* Header with clear all button */}
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-foreground">{files.length} photo{files.length > 1 ? 's' : ''} selected</p>
            {!isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllFiles}
                className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 h-8"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Enhanced photo grid with better delete buttons */}
          <div className="grid grid-cols-3 gap-3">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <img 
                  src={file.preview} 
                  alt={`preview ${index + 1}`} 
                  className="w-full h-28 object-cover rounded-md border border-border" 
                />
                
                {/* Photo number badge */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-medium px-2 py-0.5 rounded">
                  {index + 1}
                </div>

                {/* Delete button - always visible on mobile, hover on desktop */}
                {!isUploading && (
                  <button
                    type="button"
                    onClick={(e) => removeFile(e, file, index)}
                    className="absolute top-2 right-2 bg-[hsl(var(--destructive))]/90 hover:bg-[hsl(var(--destructive))] rounded-full p-1.5 text-white transition-all md:opacity-0 md:group-hover:opacity-100 shadow-lg"
                    title="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* Upload progress overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-md">
                    <Loader2 className="w-5 h-5 text-white animate-spin mb-1" />
                    <span className="text-white text-xs font-medium">{uploadProgress}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
