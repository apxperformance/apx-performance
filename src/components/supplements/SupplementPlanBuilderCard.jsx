import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Users, User } from "lucide-react";

export default function SupplementPlanBuilderCard({ plan, onClick, onAssign, client, isTemplate = true }) {
  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-primary/30 transition-all duration-300 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-foreground text-lg group-hover:text-primary transition-colors">
                {plan.name}
              </CardTitle>
              {client && (
                <div className="flex items-center gap-1 mt-1">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{client.full_name}</span>
                </div>
              )}
            </div>
          </div>
          <Badge variant={isTemplate ? "secondary" : "outline"} className={isTemplate ? "bg-secondary/50 text-foreground border-border" : "border-border text-foreground"}>
            {isTemplate ? "Template" : "Assigned"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4" onClick={onClick}>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {plan.description || "Custom supplement protocol designed for optimal results."}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Pill className="w-4 h-4 text-primary" />
            {plan.supplements?.length || 0} supplements
          </div>
        </div>

        {plan.supplements && plan.supplements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Includes:</h4>
            <div className="space-y-1">
              {plan.supplements.slice(0, 3).map((supplement, idx) => (
                <div key={idx} className="text-xs text-muted-foreground flex justify-between">
                  <span>{supplement.name}</span>
                  <span>{supplement.dosage}</span>
                </div>
              ))}
              {plan.supplements.length > 3 && (
                <div className="text-xs text-muted-foreground">+{plan.supplements.length - 3} more...</div>
              )}
            </div>
          </div>
        )}

        {isTemplate && onAssign && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAssign(plan);
            }}
            variant="outline"
            size="sm"
            className="w-full border-border text-foreground hover:bg-secondary hover:border-primary"
          >
            <Users className="w-4 h-4 mr-2" />
            Assign to Client
          </Button>
        )}
      </CardContent>
    </Card>
  );
}