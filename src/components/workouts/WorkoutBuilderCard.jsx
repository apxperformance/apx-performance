import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Users, UserCheck, Eye } from "lucide-react";
import { WORKOUT_TYPE_COLORS, DIFFICULTY_COLORS } from "./workoutConstants";

export default function WorkoutBuilderCard({ workout, onClick, onAssign, client, isTemplate = true }) {
  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-[#C5B358]/30 transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-foreground text-lg group-hover:text-[#C5B358] transition-colors">
            {workout.name}
          </CardTitle>
          <div className="flex gap-2">
            {isTemplate && (
              <Badge variant="outline" className="border-[#C5B358]/30 text-[#C5B358] bg-[#C5B358]/10">
                Template
              </Badge>
            )}
            <Badge className={WORKOUT_TYPE_COLORS[workout.workout_type] || WORKOUT_TYPE_COLORS.strength}>
              {workout.workout_type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm line-clamp-2">
          {workout.description || "No description provided"}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-[#C5B358]" />
            <span>{workout.estimated_duration || 45} min</span>
          </div>
          <Badge className={DIFFICULTY_COLORS[workout.difficulty_level] || DIFFICULTY_COLORS.intermediate}>
            <TrendingUp className="w-3 h-3 mr-1" />
            {workout.difficulty_level || "intermediate"}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Exercises</span>
            <span className="text-foreground font-medium">{workout.exercises?.length || 0}</span>
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
            className="flex-1 border-border text-foreground hover:bg-secondary hover:border-[#C5B358]"
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
              className="flex-1 bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
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