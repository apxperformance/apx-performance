import { Badge } from '@/components/ui/badge';
import { Crown, Award, Shield } from 'lucide-react';

const TIER_CONFIG = {
  associate: {
    label: 'Associate Coach',
    icon: Shield,
    className: 'bg-amber-500/20 text-amber-600 border-amber-500/30'
  },
  pro: {
    label: 'Pro Coach',
    icon: Award,
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  elite: {
    label: 'Elite Coach',
    icon: Crown,
    className: 'bg-[#C5B358]/20 text-[#C5B358] border-[#C5B358]/30'
  }
};

export default function CoachTierBadge({ tier, showIcon = true, className = '' }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.associate;
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} ${className} flex items-center gap-1.5`}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </Badge>
  );
}