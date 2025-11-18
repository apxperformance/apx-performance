import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";
import { format } from 'date-fns';

export default function PhotoGalleryDialog({ isOpen, onClose, photos }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  if (!photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    setZoom(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 1));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentPhoto.url;
    link.download = `progress-photo-${format(new Date(currentPhoto.date), 'yyyy-MM-dd')}.jpg`;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-border text-white max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">
              {currentPhoto.clientName} - {format(new Date(currentPhoto.date), 'MMM d, yyyy')}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="text-white hover:bg-white/10"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="text-white hover:bg-white/10"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="text-white hover:bg-white/10"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative flex items-center justify-center min-h-[500px] overflow-hidden">
          {photos.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="absolute left-4 z-10 bg-black/50 hover:bg-black/70 text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}

          <div className="flex items-center justify-center overflow-auto max-h-[600px]">
            <img
              src={currentPhoto.url}
              alt={`Progress photo ${currentIndex + 1}`}
              className="max-w-full max-h-[600px] object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>

          {photos.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setZoom(1);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-[#C5B358] w-8' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}

        <div className="text-center text-sm text-gray-400">
          Photo {currentIndex + 1} of {photos.length}
        </div>
      </DialogContent>
    </Dialog>
  );
}