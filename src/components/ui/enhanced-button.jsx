import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Enhanced Button with loading state and micro-interactions
 */
export default function EnhancedButton({ 
  children, 
  isLoading = false, 
  loadingText = 'Loading...',
  icon: Icon,
  ...props 
}) {
  return (
    <Button
      {...props}
      disabled={isLoading || props.disabled}
      className={`relative ${props.className || ''}`}
    >
      <motion.div
        className="flex items-center gap-2"
        animate={isLoading ? { opacity: 0.7 } : { opacity: 1 }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            {Icon && <Icon className="w-4 h-4" />}
            {children}
          </>
        )}
      </motion.div>
    </Button>
  );
}