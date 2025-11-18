import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Play } from "lucide-react";

const difficultyColors = {
  beginner: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  intermediate: "bg-[#C5B358]/20 text-[#C5B358] border-[#C5B358]/30",
  advanced: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
};

const typeColors = {
  strength: "bg-secondary text-foreground border-border",
  cardio: "bg-secondary text-foreground border-border",
  flexibility: "bg-secondary text-foreground border-border",
  sports: "bg-secondary text-foreground border-border",
  recovery: "bg-secondary text-foreground border-border",
};

export default function WorkoutCard({ workout, onSelect }) {
  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-[#C5B358]/30 transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-foreground text-lg group-hover:text-[#C5B358] transition-colors">
            {workout.name}
          </CardTitle>
          <div className="flex gap-2">
            <Badge className={typeColors[workout.workout_type] || typeColors.strength}>
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
            <Clock className="w-4 h-4" />
            <span>{workout.estimated_duration || 45} min</span>
          </div>
          <Badge className={difficultyColors[workout.difficulty_level] || difficultyColors.intermediate}>
            <TrendingUp className="w-3 h-3 mr-1" />
            {workout.difficulty_level || "intermediate"}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Exercises</span>
            <span className="text-foreground font-medium">{workout.exercises?.length || 0}</span>
          </div>
          {workout.exercises && workout.exercises.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {workout.exercises.slice(0, 2).map(ex => ex.exercise_name).join(", ")}
              {workout.exercises.length > 2 && ` +${workout.exercises.length - 2} more`}
            </div>
          )}
        </div>

        <Button 
          onClick={onSelect}
          className="w-full bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold group-hover:scale-105 transition-transform duration-200"
        >
          <Play className="w-4 h-4 mr-2" />
          View Workout
        </Button>
      </CardContent>
    </Card>
  );
}