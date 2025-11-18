import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Reusable Loading Spinner Component
 */
export default function LoadingSpinner({ size = 'default', text = null }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-3"
    >
      <Loader2 className={`${sizeClasses[size]} text-[#C5B358] animate-spin`} />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </motion.div>
  );
}