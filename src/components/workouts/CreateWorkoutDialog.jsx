import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell } from "lucide-react";

export default function CreateWorkoutDialog({ isOpen, onClose, onWorkoutCreated, isClientSelfManaged = false }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    workout_type: "strength",
    difficulty_level: "intermediate",
    estimated_duration: 45,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const user = await base44.auth.me();
      const workoutData = {
        ...formData,
        exercises: [],
        estimated_duration: parseInt(formData.estimated_duration)
      };

      if (isClientSelfManaged) {
        // Client creating their own workout
        workoutData.client_id = user.id;
        workoutData.coach_id = user.id; // Self-managed, so client is their own "coach"
        workoutData.is_template = false;
      } else {
        // Coach creating a template
        workoutData.coach_id = user.id;
        workoutData.is_template = true;
      }

      const newWorkout = await base44.entities.Workout.create(workoutData);
      onWorkoutCreated(newWorkout);
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        workout_type: "strength",
        difficulty_level: "intermediate",
        estimated_duration: 45,
      });
    } catch (error) {
      console.error("Error creating workout:", error);
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-md backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-foreground">
            <Dumbbell className="w-6 h-6 text-[#C5B358]" />
            Create New Workout
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Workout Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Upper Body Strength"
              required
              className="bg-input border-border focus:border-[#C5B358] text-slate-900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the workout..."
              rows={3}
              className="bg-input border-border focus:border-[#C5B358] resize-none text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Workout Type</Label>
              <Select value={formData.workout_type} onValueChange={(value) => handleSelectChange("workout_type", value)}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground backdrop-blur-xl">
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="flexibility">Flexibility</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="recovery">Recovery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Difficulty</Label>
              <Select value={formData.difficulty_level} onValueChange={(value) => handleSelectChange("difficulty_level", value)}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground backdrop-blur-xl">
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_duration" className="text-foreground">Duration (minutes)</Label>
            <Input
              id="estimated_duration"
              name="estimated_duration"
              type="number"
              value={formData.estimated_duration}
              onChange={handleInputChange}
              min="15"
              max="180"
              className="bg-input border-border focus:border-[#C5B358] text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-border hover:bg-secondary text-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">
              {isSubmitting ? "Creating..." : "Create Workout"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}