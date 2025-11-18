
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit, Save, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DIFFICULTY_COLORS } from "./workoutConstants";

import ConfirmDialog from "../ui/ConfirmDialog";
import ExerciseLibrary from "./ExerciseLibrary";
import ExerciseCard from "./ExerciseCard";

export default function ClientWorkoutDetailView({ workout, onBack, onWorkoutUpdated, onWorkoutDeleted }) {
  const [exercises, setExercises] = useState(
    (workout.exercises || []).map(ex => ({ ...ex, id: ex.id || Date.now() + Math.random() }))
  );
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddExercise = (exerciseData) => {
    const newExercise = {
      ...exerciseData,
      id: Date.now() + Math.random(),
    };
    setExercises([...exercises, newExercise]);
    setShowExerciseLibrary(false);
  };

  const handleUpdateExercise = (index, updatedExercise) => {
    const newExercises = [...exercises];
    newExercises[index] = updatedExercise;
    setExercises(newExercises);
  };

  const handleRemoveExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSaveWorkout = async () => {
    setIsSaving(true);
    try {
      const exercisesWithoutIds = exercises.map(({ id, ...rest }) => rest);
      
      const updatedWorkout = await base44.entities.Workout.update(workout.id, {
        exercises: exercisesWithoutIds
      });
      onWorkoutUpdated({ ...workout, exercises: exercisesWithoutIds });
      setIsEditing(false);
      toast.success("Workout saved successfully!");
    } catch (error) {
      console.error("Error saving workout:", error);
      toast.error("Failed to save workout. Please try again.");
    }
    setIsSaving(false);
  };

  const handleDeleteWorkout = async () => {
    setIsDeleting(true);
    try {
      // ✅ Step 1: Find all WorkoutLog records that reference this workout
      const relatedLogs = await base44.entities.WorkoutLog.filter({ 
        workout_id: workout.id 
      });

      // ✅ Step 2: Delete all related WorkoutLog records first (cascade delete)
      if (relatedLogs.length > 0) {
        console.log(`Found ${relatedLogs.length} workout log(s) to delete`);
        
        await Promise.all(
          relatedLogs.map(log => base44.entities.WorkoutLog.delete(log.id))
        );
        
        console.log(`Successfully deleted ${relatedLogs.length} related workout log(s)`);
        
        toast.success(
          `Deleted workout and ${relatedLogs.length} related log${relatedLogs.length > 1 ? 's' : ''}`,
          { duration: 3000 }
        );
      } else {
        toast.success("Workout deleted successfully");
      }

      // ✅ Step 3: Delete the workout itself
      await base44.entities.Workout.delete(workout.id);

      // ✅ Step 4: Notify parent to refresh data
      onWorkoutDeleted(workout.id);
      setShowDeleteConfirm(false);
      
    } catch (error) {
      console.error("Error deleting workout:", error);
      
      // ✅ Provide specific error message
      if (error.message?.includes("WorkoutLog")) {
        toast.error("Failed to delete workout logs. Please try again.");
      } else {
        toast.error("Failed to delete workout. Please try again.");
      }
      
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="border-border text-foreground hover:bg-secondary">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{workout.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={DIFFICULTY_COLORS[workout.difficulty_level] || DIFFICULTY_COLORS.intermediate}>
                {workout.difficulty_level}
              </Badge>
              <span className="text-muted-foreground">{workout.estimated_duration} minutes</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setExercises((workout.exercises || []).map(ex => ({ ...ex, id: ex.id || Date.now() + Math.random() })));
                }}
                className="border-border text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveWorkout}
                disabled={isSaving || exercises.length === 0}
                className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Workout
            </Button>
          )}
        </div>
      </div>

      {/* Description and Delete Button */}
      <div className="flex gap-4 items-start">
        {workout.description && (
          <Card className="flex-1 bg-card/50 backdrop-blur-xl border-border">
            <CardContent className="p-4">
              <p className="text-muted-foreground">{workout.description}</p>
            </CardContent>
          </Card>
        )}
        {isEditing && (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Exercises */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">Exercises ({exercises.length})</h2>
          {isEditing && (
            <Button
              onClick={() => setShowExerciseLibrary(true)}
              className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {exercises.length > 0 ? (
            exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={index}
                isEditing={isEditing}
                onUpdate={(updatedExercise) => handleUpdateExercise(index, updatedExercise)}
                onRemove={() => handleRemoveExercise(index)}
              />
            ))
          ) : (
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Plus className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Exercises Added</h3>
                  <p>Start building your workout by adding exercises.</p>
                  {isEditing && (
                    <Button
                      onClick={() => setShowExerciseLibrary(true)}
                      className="mt-4 bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
                    >
                      Add First Exercise
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ExerciseLibrary
        isOpen={showExerciseLibrary}
        onClose={() => setShowExerciseLibrary(false)}
        onAddExercise={handleAddExercise}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteWorkout}
        title="Delete Workout?"
        description={
          <>
            <p className="mb-2">This workout will be permanently deleted. This action cannot be undone.</p>
            <p className="text-sm text-yellow-400">
              ⚠️ Warning: All your workout history logs for this program will also be deleted.
            </p>
          </>
        }
        confirmText="Delete Workout"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
