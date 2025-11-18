import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, AlertCircle } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive", // "destructive", "warning", "default"
  icon: CustomIcon,
  isLoading = false
}) {
  const getIcon = () => {
    if (CustomIcon) return <CustomIcon className="w-6 h-6" />;
    
    switch (variant) {
      case "destructive":
        return <Trash2 className="w-6 h-6 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      default:
        return <AlertCircle className="w-6 h-6 text-blue-400" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case "destructive":
        return "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30";
      case "warning":
        return "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/30";
      default:
        return "bg-primary hover:bg-primary/90 text-primary-foreground";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getIcon()}
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-border hover:bg-secondary"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={getConfirmButtonClass()}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}