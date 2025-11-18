import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';

export default function RecentlyReviewedSection({ checkIns, clients, isLoading }) {
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.full_name : "Unknown Client";
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-4">Recently Reviewed</h2>
      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-card/50 animate-pulse rounded-lg"></div>)
        ) : checkIns.map(checkIn => (
          <Card key={checkIn.id} className="bg-card/50 backdrop-blur-xl border-border">
            <CardContent className="p-4">
              <p className="font-bold text-foreground">{getClientName(checkIn.client_id)}</p>
              <p className="text-sm text-muted-foreground">
                Reviewed {formatDistanceToNow(new Date(checkIn.updated_date), { addSuffix: true })}
              </p>
              <p className="text-sm text-muted-foreground mt-2 italic line-clamp-1">"{checkIn.coach_feedback}"</p>
              <Badge className="mt-2 bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">Reviewed</Badge>
            </CardContent>
          </Card>
        ))}
        {!isLoading && checkIns.length === 0 && (
          <p className="col-span-full text-muted-foreground py-4">No reviewed check-ins yet.</p>
        )}
      </div>
    </div>
  );
}