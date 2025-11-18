import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    badgeColor: 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30',
    icon: CheckCircle2
  },
  pending_invitation: {
    label: 'Pending',
    badgeColor: 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30',
    icon: Clock
  },
  inactive: {
    label: 'Inactive',
    badgeColor: 'bg-muted text-muted-foreground border-border',
    icon: XCircle
  }
};

/**
 * Unified Status Badge Component
 * Ensures consistent status representation across the app
 */
export default function StatusBadge({ status, showIcon = false, className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
  const Icon = config.icon;

  return (
    <Badge className={`${config.badgeColor} ${className} flex items-center gap-1.5`}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </Badge>
  );
}