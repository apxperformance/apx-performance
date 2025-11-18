import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Enhanced Form Field Wrapper with consistent styling and error states
 */
export default function FormFieldWrapper({ 
  label, 
  error, 
  success, 
  required = false, 
  helpText,
  children,
  htmlFor
}) {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={htmlFor} className="text-foreground font-medium">
          {label}
          {required && <span className="text-[hsl(var(--destructive))] ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        {children}
        
        {(error || success) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {error && <AlertCircle className="w-4 h-4 text-[hsl(var(--destructive))]" />}
            {success && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />}
          </div>
        )}
      </div>
      
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xs text-[hsl(var(--destructive))] flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.p>
        )}
        
        {!error && helpText && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground"
          >
            {helpText}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}