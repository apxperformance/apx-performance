import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Dumbbell, Clock, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkoutHistoryDialog({ isOpen, onClose, workoutLogs, workouts }) {
  if (!workoutLogs) return null;

  const getWorkoutTypeColor = (type) => {
    const colors = {
      strength: "bg-[#C5B358]/20 text-[#C5B358] border-[#C5B358]/30",
      cardio: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      flexibility: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      sports: "bg-green-500/20 text-green-400 border-green-500/30",
      recovery: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return colors[type] || colors.strength;
  };

  // ✅ Helper function to safely get workout name and type
  const getWorkoutInfo = (log) => {
    // Primary: Use cached workout_name from the log itself
    const workoutName = log.workout_name || "Unknown Workout";
    
    // Try to get workout type from the original workout if it still exists
    const workout = workouts?.find(w => w.id === log.workout_id);
    const workoutType = workout?.workout_type;
    
    // Check if workout was deleted
    const isDeleted = !workout && log.workout_id;
    
    return {
      name: workoutName,
      type: workoutType,
      isDeleted
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Dumbbell className="w-7 h-7 text-[#C5B358]" />
              Workout History
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-secondary">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          {workoutLogs.length > 0 ? (
            <div className="space-y-4">
              {workoutLogs.map((log) => {
                const workoutInfo = getWorkoutInfo(log);
                const completedExercises = log.exercises?.filter(ex => ex.completed).length || 0;
                const totalExercises = log.exercises?.length || 0;

                return (
                  <Card key={log.id} className="bg-card/50 backdrop-blur-xl border-border">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {workoutInfo.name}
                            </h3>
                            {/* ✅ Show deleted indicator */}
                            {workoutInfo.isDeleted && (
                              <Badge 
                                variant="outline" 
                                className="border-muted-foreground/30 text-muted-foreground bg-muted/20"
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Deleted
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {/* ✅ Only show type badge if workout still exists */}
                            {workoutInfo.type && !workoutInfo.isDeleted && (
                              <Badge className={getWorkoutTypeColor(workoutInfo.type)}>
                                {workoutInfo.type}
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-border text-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              {log.duration_minutes || 0} min
                            </Badge>
                            <Badge variant="outline" className="border-border text-foreground">
                              RPE: {log.overall_rpe || 'N/A'}/10
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-foreground">
                            {format(new Date(log.completed_date), 'MMM d, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(log.completed_date), 'h:mm a')}
                          </div>
                        </div>
                      </div>

                      {/* ✅ Show warning if workout was deleted */}
                      {workoutInfo.isDeleted && (
                        <div className="mb-4 p-3 bg-muted/30 border border-muted-foreground/20 rounded-lg flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            The original workout program has been deleted, but your logged data is preserved here.
                          </p>
                        </div>
                      )}

                      {/* Completion Stats */}
                      {totalExercises > 0 && (
                        <div className="bg-secondary/30 rounded-lg p-3 mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">Exercises Completed</span>
                            <span className="text-sm font-semibold text-foreground">
                              {completedExercises}/{totalExercises}
                            </span>
                          </div>
                          <div className="w-full bg-border rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-[#C5B358] to-[#A4913C] h-2 rounded-full transition-all"
                              style={{ width: `${totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Exercise Details */}
                      {log.exercises && log.exercises.length > 0 && (
                        <div className="space-y-2">
                          {log.exercises.map((exercise, idx) => (
                            <div key={idx} className="bg-secondary/20 rounded p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className={`font-medium text-sm ${exercise.completed ? 'text-[hsl(var(--success))]' : 'text-foreground'}`}>
                                    {exercise.exercise_name || `Exercise ${idx + 1}`}
                                  </h4>
                                  {exercise.completed && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />}
                                </div>
                              </div>
                              {exercise.actual_sets && exercise.actual_sets.length > 0 && (
                                <div className="grid grid-cols-1 gap-1 text-xs">
                                  {exercise.actual_sets.map((set, setIdx) => (
                                    <div key={setIdx} className="flex items-center gap-4 text-muted-foreground">
                                      <span>Set {setIdx + 1}:</span>
                                      <span>{set.reps || 0} reps</span>
                                      {set.weight > 0 && <span>@ {set.weight} lbs</span>}
                                      <span>RPE: {set.rpe || 'N/A'}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {log.notes && (
                        <div className="mt-4 p-3 bg-secondary/30 rounded">
                          <p className="text-sm text-muted-foreground italic">"{log.notes}"</p>
                        </div>
                      )}

                      {/* Coach Feedback */}
                      {log.coach_feedback && (
                        <div className="mt-4 p-3 bg-[#C5B358]/10 border border-[#C5B358]/30 rounded">
                          <h5 className="text-xs font-semibold text-[#C5B358] mb-1">Coach Feedback:</h5>
                          <p className="text-sm text-foreground">{log.coach_feedback}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Dumbbell className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Workout History</h3>
              <p>Complete your first workout to see it here!</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}