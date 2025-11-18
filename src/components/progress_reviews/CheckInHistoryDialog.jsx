import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Calendar, Weight, Battery, Moon, Frown } from "lucide-react";

export default function CheckInHistoryDialog({ isOpen, onClose, clientId, checkIns, clientName }) {
  if (!clientId || checkIns.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card border-border text-card-foreground max-w-4xl">
          <DialogHeader>
            <DialogTitle>Check-In History: {clientName}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No check-in history available for this client.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const sortedCheckIns = [...checkIns].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  ).slice(0, 10); // Show last 10 check-ins

  const getWeightTrend = (index) => {
    if (index === sortedCheckIns.length - 1) return null;
    const current = sortedCheckIns[index].weight;
    const previous = sortedCheckIns[index + 1].weight;
    if (!current || !previous) return null;
    
    const diff = current - previous;
    if (Math.abs(diff) < 0.5) return { icon: Minus, text: "No change", color: "text-gray-400" };
    if (diff > 0) return { icon: TrendingUp, text: `+${diff.toFixed(1)} lbs`, color: "text-red-400" };
    return { icon: TrendingDown, text: `${diff.toFixed(1)} lbs`, color: "text-green-400" };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Check-In History: {clientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {sortedCheckIns.map((checkIn, index) => {
            const trend = getWeightTrend(index);
            const TrendIcon = trend?.icon;

            return (
              <Card key={checkIn.id} className="bg-secondary/30 border-border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-semibold text-foreground">
                        {format(new Date(checkIn.created_date), 'MMMM d, yyyy')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(checkIn.created_date), 'h:mm a')}
                      </div>
                    </div>
                    {checkIn.coach_feedback ? (
                      <Badge className="bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">
                        Reviewed
                      </Badge>
                    ) : (
                      <Badge className="bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30">
                        Pending
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Weight className="w-4 h-4 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Weight</div>
                        <div className="font-semibold text-foreground flex items-center gap-1">
                          {checkIn.weight} lbs
                          {trend && <TrendIcon className={`w-3 h-3 ${trend.color}`} />}
                        </div>
                        {trend && (
                          <div className={`text-xs ${trend.color}`}>{trend.text}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Battery className="w-4 h-4 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Energy</div>
                        <div className="font-semibold text-foreground">{checkIn.energy_level}/10</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Sleep</div>
                        <div className="font-semibold text-foreground">{checkIn.sleep_hours}h</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Frown className="w-4 h-4 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Stress</div>
                        <div className="font-semibold text-foreground">{checkIn.stress_level}/10</div>
                      </div>
                    </div>

                    {checkIn.progress_photos && checkIn.progress_photos.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                          📷 {checkIn.progress_photos.length} photo{checkIn.progress_photos.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>

                  {checkIn.notes && (
                    <div className="mb-3">
                      <div className="text-xs text-muted-foreground mb-1">Client Notes:</div>
                      <div className="text-sm text-foreground italic bg-card p-2 rounded">
                        "{checkIn.notes}"
                      </div>
                    </div>
                  )}

                  {checkIn.coach_feedback && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Coach Feedback:</div>
                      <div className="text-sm text-foreground bg-card p-2 rounded border-l-4 border-[#C5B358]">
                        {checkIn.coach_feedback}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}