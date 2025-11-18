import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckSquare } from "lucide-react";

export default function BulkReviewDialog({ isOpen, onClose, selectedCount, onSubmit }) {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    await onSubmit(feedback);
    setFeedback("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setFeedback("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#C5B358]" />
            Bulk Review ({selectedCount} check-ins)
          </DialogTitle>
          <DialogDescription>
            This feedback will be applied to all {selectedCount} selected check-ins.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="bulkFeedback">Feedback Message</Label>
            <Textarea
              id="bulkFeedback"
              placeholder="E.g., 'Great progress this week! Keep up the excellent work with your training and nutrition.'"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
              className="bg-input border-border text-foreground resize-none mt-2"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-border"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!feedback.trim() || isSubmitting}
            className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
          >
            {isSubmitting ? "Submitting..." : `Review ${selectedCount} Check-ins`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}