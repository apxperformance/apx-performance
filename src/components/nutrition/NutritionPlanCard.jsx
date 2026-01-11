import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Eye } from "lucide-react";

export default function NutritionPlanCard({ plan, onClick, onAssign, client, isTemplate = true }) {
  // Null check for macros
  const hasMacros = plan.macros && 
                    typeof plan.macros.protein_grams !== 'undefined' && 
                    typeof plan.macros.carbs_grams !== 'undefined' && 
                    typeof plan.macros.fat_grams !== 'undefined';

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-[#C5B358]/30 transition-all duration-300 group hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-foreground text-lg group-hover:text-gray-600 transition-colors">
            {plan.name}
          </CardTitle>
          {isTemplate && (
            <Badge variant="outline" className="border-gray-400/30 text-gray-600 bg-gray-400/10">
              Template
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#C5B358]">{plan.daily_calories}</div>
          <div className="text-sm text-muted-foreground">calories/day</div>
        </div>
        
        {hasMacros && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="font-semibold text-foreground">{plan.macros.protein_grams}g</div>
              <div className="text-muted-foreground">Protein</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">{plan.macros.carbs_grams}g</div>
              <div className="text-muted-foreground">Carbs</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">{plan.macros.fat_grams}g</div>
              <div className="text-muted-foreground">Fat</div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Meals</span>
            <span className="text-foreground font-medium">{plan.meals?.length || 0}</span>
          </div>
          {client && (
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[hsl(var(--success))]" />
              <span className="text-sm text-[hsl(var(--success))]">{client.full_name}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={onClick}
            variant="outline"
            size="sm"
            className="flex-1 border-border hover:bg-secondary hover:border-[#C5B358] text-foreground"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          {isTemplate && onAssign && (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onAssign();
              }}
              size="sm"
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold"
            >
              <Users className="w-4 h-4 mr-2" />
              Assign
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}