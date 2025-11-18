import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";

const EXERCISE_DATABASE = [
  // Chest Exercises
  { name: "Bench Press", category: "Chest", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Incline Bench Press", category: "Chest", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Decline Bench Press", category: "Chest", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Dumbbell Bench Press", category: "Chest", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Incline Dumbbell Press", category: "Chest", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Dumbbell Flyes", category: "Chest", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Cable Crossovers", category: "Chest", equipment: "Cable", difficulty: "Intermediate" },
  { name: "Push-ups", category: "Chest", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Incline Push-ups", category: "Chest", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Decline Push-ups", category: "Chest", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Diamond Push-ups", category: "Chest", equipment: "Bodyweight", difficulty: "Advanced" },
  { name: "Chest Dips", category: "Chest", equipment: "Bodyweight", difficulty: "Intermediate" },

  // Back Exercises
  { name: "Pull-ups", category: "Back", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Chin-ups", category: "Back", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Lat Pulldowns", category: "Back", equipment: "Cable", difficulty: "Beginner" },
  { name: "Seated Cable Rows", category: "Back", equipment: "Cable", difficulty: "Beginner" },
  { name: "Bent-over Barbell Rows", category: "Back", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "T-Bar Rows", category: "Back", equipment: "Machine", difficulty: "Intermediate" },
  { name: "One-Arm Dumbbell Rows", category: "Back", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Deadlifts", category: "Back", equipment: "Barbell", difficulty: "Advanced" },
  { name: "Romanian Deadlifts", category: "Back", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Hyperextensions", category: "Back", equipment: "Machine", difficulty: "Beginner" },

  // Shoulder Exercises
  { name: "Overhead Press", category: "Shoulders", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Dumbbell Shoulder Press", category: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Lateral Raises", category: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Front Raises", category: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Rear Delt Flyes", category: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Arnold Press", category: "Shoulders", equipment: "Dumbbells", difficulty: "Intermediate" },
  { name: "Upright Rows", category: "Shoulders", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Pike Push-ups", category: "Shoulders", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Handstand Push-ups", category: "Shoulders", equipment: "Bodyweight", difficulty: "Advanced" },

  // Arms - Biceps
  { name: "Barbell Curls", category: "Biceps", equipment: "Barbell", difficulty: "Beginner" },
  { name: "Dumbbell Curls", category: "Biceps", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Hammer Curls", category: "Biceps", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Preacher Curls", category: "Biceps", equipment: "Machine", difficulty: "Intermediate" },
  { name: "Cable Curls", category: "Biceps", equipment: "Cable", difficulty: "Beginner" },
  { name: "21s Curls", category: "Biceps", equipment: "Barbell", difficulty: "Advanced" },

  // Arms - Triceps
  { name: "Close-Grip Bench Press", category: "Triceps", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Tricep Dips", category: "Triceps", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Overhead Tricep Extension", category: "Triceps", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Tricep Pushdowns", category: "Triceps", equipment: "Cable", difficulty: "Beginner" },
  { name: "Diamond Push-ups", category: "Triceps", equipment: "Bodyweight", difficulty: "Advanced" },
  { name: "Skull Crushers", category: "Triceps", equipment: "Barbell", difficulty: "Intermediate" },

  // Legs - Quadriceps
  { name: "Squats", category: "Quadriceps", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Front Squats", category: "Quadriceps", equipment: "Barbell", difficulty: "Advanced" },
  { name: "Goblet Squats", category: "Quadriceps", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Leg Press", category: "Quadriceps", equipment: "Machine", difficulty: "Beginner" },
  { name: "Leg Extensions", category: "Quadriceps", equipment: "Machine", difficulty: "Beginner" },
  { name: "Bulgarian Split Squats", category: "Quadriceps", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Lunges", category: "Quadriceps", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Walking Lunges", category: "Quadriceps", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Jump Squats", category: "Quadriceps", equipment: "Bodyweight", difficulty: "Intermediate" },

  // Legs - Hamstrings
  { name: "Romanian Deadlifts", category: "Hamstrings", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Leg Curls", category: "Hamstrings", equipment: "Machine", difficulty: "Beginner" },
  { name: "Good Mornings", category: "Hamstrings", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Single Leg RDL", category: "Hamstrings", equipment: "Dumbbells", difficulty: "Intermediate" },

  // Legs - Glutes
  { name: "Hip Thrusts", category: "Glutes", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Glute Bridges", category: "Glutes", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Clamshells", category: "Glutes", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Fire Hydrants", category: "Glutes", equipment: "Bodyweight", difficulty: "Beginner" },

  // Legs - Calves
  { name: "Calf Raises", category: "Calves", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Seated Calf Raises", category: "Calves", equipment: "Machine", difficulty: "Beginner" },
  { name: "Standing Calf Raises", category: "Calves", equipment: "Machine", difficulty: "Beginner" },

  // Core
  { name: "Plank", category: "Core", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Side Plank", category: "Core", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Crunches", category: "Core", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Bicycle Crunches", category: "Core", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Russian Twists", category: "Core", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Mountain Climbers", category: "Core", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Dead Bug", category: "Core", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Hanging Leg Raises", category: "Core", equipment: "Bodyweight", difficulty: "Advanced" },
  { name: "Ab Wheel Rollouts", category: "Core", equipment: "Equipment", difficulty: "Advanced" },

  // Cardio
  { name: "Burpees", category: "Cardio", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "High Knees", category: "Cardio", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Jumping Jacks", category: "Cardio", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Jump Rope", category: "Cardio", equipment: "Equipment", difficulty: "Beginner" },
  { name: "Box Jumps", category: "Cardio", equipment: "Equipment", difficulty: "Intermediate" },
  { name: "Battle Ropes", category: "Cardio", equipment: "Equipment", difficulty: "Intermediate" },
];

const categoryColors = {
  "Chest": "bg-red-500/20 text-red-400",
  "Back": "bg-blue-500/20 text-blue-400", 
  "Shoulders": "bg-yellow-500/20 text-yellow-400",
  "Biceps": "bg-purple-500/20 text-purple-400",
  "Triceps": "bg-pink-500/20 text-pink-400",
  "Quadriceps": "bg-green-500/20 text-green-400",
  "Hamstrings": "bg-orange-500/20 text-orange-400",
  "Glutes": "bg-indigo-500/20 text-indigo-400",
  "Calves": "bg-teal-500/20 text-teal-400",
  "Core": "bg-cyan-500/20 text-cyan-400",
  "Cardio": "bg-rose-500/20 text-rose-400",
};

export default function ExerciseLibrary({ isOpen, onClose, onAddExercise }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseForm, setExerciseForm] = useState({
    warmup_sets: 1,
    working_sets: 3,
    cooldown_sets: 0,
    reps: "8-12",
    weight: "",
    rest_time: "60s",
    notes: ""
  });

  const categories = ["all", ...new Set(EXERCISE_DATABASE.map(ex => ex.category))];
  
  const filteredExercises = EXERCISE_DATABASE.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!selectedExercise) return;

    const exerciseData = {
      exercise_name: selectedExercise.name,
      sets: parseInt(exerciseForm.working_sets),
      warmup_sets: parseInt(exerciseForm.warmup_sets),
      cooldown_sets: parseInt(exerciseForm.cooldown_sets),
      reps: exerciseForm.reps,
      weight: exerciseForm.weight,
      rest_time: exerciseForm.rest_time,
      notes: exerciseForm.notes,
      muscle_groups: [selectedExercise.category],
      equipment: selectedExercise.equipment,
      difficulty: selectedExercise.difficulty
    };

    onAddExercise(exerciseData);
    
    // Reset form
    setSelectedExercise(null);
    setExerciseForm({
      warmup_sets: 1,
      working_sets: 3,
      cooldown_sets: 0,
      reps: "8-12",
      weight: "",
      rest_time: "60s",
      notes: ""
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Exercise Library</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Exercise Selection */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredExercises.map((exercise, index) => (
                <div
                  key={index}
                  onClick={() => handleExerciseSelect(exercise)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedExercise?.name === exercise.name
                      ? "border-yellow-500 bg-yellow-500/10"
                      : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-white">{exercise.name}</h4>
                      <p className="text-xs text-gray-400">{exercise.equipment}</p>
                    </div>
                    <Badge className={categoryColors[exercise.category] || "bg-gray-500/20 text-gray-400"}>
                      {exercise.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exercise Configuration */}
          <div className="space-y-4">
            {selectedExercise ? (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="font-bold text-xl text-white mb-2">{selectedExercise.name}</h3>
                  <div className="flex gap-2">
                    <Badge className={categoryColors[selectedExercise.category]}>
                      {selectedExercise.category}
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {selectedExercise.equipment}
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {selectedExercise.difficulty}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Warmup Sets</Label>
                    <Input
                      type="number"
                      min="0"
                      value={exerciseForm.warmup_sets}
                      onChange={(e) => setExerciseForm({...exerciseForm, warmup_sets: e.target.value})}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label>Working Sets</Label>
                    <Input
                      type="number"
                      min="1"
                      value={exerciseForm.working_sets}
                      onChange={(e) => setExerciseForm({...exerciseForm, working_sets: e.target.value})}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label>Cooldown Sets</Label>
                    <Input
                      type="number"
                      min="0"
                      value={exerciseForm.cooldown_sets}
                      onChange={(e) => setExerciseForm({...exerciseForm, cooldown_sets: e.target.value})}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Reps</Label>
                    <Input
                      placeholder="e.g., 8-12, 15, max"
                      value={exerciseForm.reps}
                      onChange={(e) => setExerciseForm({...exerciseForm, reps: e.target.value})}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label>Weight</Label>
                    <Input
                      placeholder="e.g., 135 lbs, bodyweight"
                      value={exerciseForm.weight}
                      onChange={(e) => setExerciseForm({...exerciseForm, weight: e.target.value})}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <Label>Rest Time</Label>
                  <Input
                    placeholder="e.g., 60s, 2 min"
                    value={exerciseForm.rest_time}
                    onChange={(e) => setExerciseForm({...exerciseForm, rest_time: e.target.value})}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Any special instructions..."
                    value={exerciseForm.notes}
                    onChange={(e) => setExerciseForm({...exerciseForm, notes: e.target.value})}
                    className="bg-gray-800 border-gray-700 resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-gray-600 hover:bg-gray-800">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Exercise
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Plus className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Select an exercise to configure its sets, reps, and other details.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}