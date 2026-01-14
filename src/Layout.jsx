import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Dumbbell } from "lucide-react";

// --- THE ROBUST LIBRARY ---
const EXERCISE_DATABASE = [
  // --- CHEST ---
  { name: "Barbell Bench Press", category: "Chest", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Incline Barbell Bench", category: "Chest", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Decline Barbell Bench", category: "Chest", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Dumbbell Bench Press", category: "Chest", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Incline Dumbbell Press", category: "Chest", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Dumbbell Flyes", category: "Chest", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Cable Crossovers (High-to-Low)", category: "Chest", equipment: "Cable", difficulty: "Intermediate" },
  { name: "Cable Flyes (Low-to-High)", category: "Chest", equipment: "Cable", difficulty: "Intermediate" },
  { name: "Push-ups", category: "Chest", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Weighted Push-ups", category: "Chest", equipment: "Bodyweight/Plate", difficulty: "Intermediate" },
  { name: "Deficit Push-ups", category: "Chest", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Chest Dips", category: "Chest", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Machine Chest Press", category: "Chest", equipment: "Machine", difficulty: "Beginner" },
  { name: "Pec Deck / Machine Fly", category: "Chest", equipment: "Machine", difficulty: "Beginner" },
  { name: "Floor Press", category: "Chest", equipment: "Barbell/Dumbbell", difficulty: "Intermediate" },
  { name: "Svend Press", category: "Chest", equipment: "Plate", difficulty: "Beginner" },

  // --- BACK ---
  { name: "Deadlift (Conventional)", category: "Back", equipment: "Barbell", difficulty: "Advanced" },
  { name: "Sumo Deadlift", category: "Back", equipment: "Barbell", difficulty: "Advanced" },
  { name: "Pull-ups (Pronated)", category: "Back", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Chin-ups (Supinated)", category: "Back", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Lat Pulldowns (Wide Grip)", category: "Back", equipment: "Cable", difficulty: "Beginner" },
  { name: "Lat Pulldowns (Neutral Grip)", category: "Back", equipment: "Cable", difficulty: "Beginner" },
  { name: "Seated Cable Rows", category: "Back", equipment: "Cable", difficulty: "Beginner" },
  { name: "Bent-over Barbell Rows", category: "Back", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Pendlay Rows", category: "Back", equipment: "Barbell", difficulty: "Advanced" },
  { name: "T-Bar Rows", category: "Back", equipment: "Machine/Landmine", difficulty: "Intermediate" },
  { name: "One-Arm Dumbbell Rows", category: "Back", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Chest-Supported Row", category: "Back", equipment: "Machine/Incline", difficulty: "Beginner" },
  { name: "Meadows Row", category: "Back", equipment: "Landmine", difficulty: "Intermediate" },
  { name: "Straight Arm Pulldowns", category: "Back", equipment: "Cable", difficulty: "Beginner" },
  { name: "Face Pulls", category: "Back", equipment: "Cable", difficulty: "Beginner" },
  { name: "Hyperextensions (Back Ext)", category: "Back", equipment: "Machine", difficulty: "Beginner" },
  { name: "Rack Pulls", category: "Back", equipment: "Barbell", difficulty: "Advanced" },
  { name: "Inverted Rows", category: "Back", equipment: "Bodyweight", difficulty: "Beginner" },

  // --- SHOULDERS ---
  { name: "Overhead Press (OHP)", category: "Shoulders", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Seated Dumbbell Press", category: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Arnold Press", category: "Shoulders", equipment: "Dumbbells", difficulty: "Intermediate" },
  { name: "Lateral Raises", category: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Cable Lateral Raises", category: "Shoulders", equipment: "Cable", difficulty: "Intermediate" },
  { name: "Front Raises", category: "Shoulders", equipment: "Dumbbells/Plate", difficulty: "Beginner" },
  { name: "Rear Delt Flyes", category: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Reverse Pec Deck", category: "Shoulders", equipment: "Machine", difficulty: "Beginner" },
  { name: "Upright Rows", category: "Shoulders", equipment: "Barbell/Cable", difficulty: "Intermediate" },
  { name: "Egyptian Lateral Raise", category: "Shoulders", equipment: "Cable", difficulty: "Intermediate" },
  { name: "Handstand Push-ups", category: "Shoulders", equipment: "Bodyweight", difficulty: "Advanced" },
  { name: "Landmine Press", category: "Shoulders", equipment: "Landmine", difficulty: "Intermediate" },
  { name: "Push Press", category: "Shoulders", equipment: "Barbell", difficulty: "Advanced" },

  // --- LEGS (QUADS) ---
  { name: "Barbell Back Squat", category: "Quadriceps", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Front Squat", category: "Quadriceps", equipment: "Barbell", difficulty: "Advanced" },
  { name: "Goblet Squat", category: "Quadriceps", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Leg Press", category: "Quadriceps", equipment: "Machine", difficulty: "Beginner" },
  { name: "Hack Squat", category: "Quadriceps", equipment: "Machine", difficulty: "Intermediate" },
  { name: "Leg Extensions", category: "Quadriceps", equipment: "Machine", difficulty: "Beginner" },
  { name: "Bulgarian Split Squats", category: "Quadriceps", equipment: "Dumbbells", difficulty: "Intermediate" },
  { name: "Walking Lunges", category: "Quadriceps", equipment: "Bodyweight/DB", difficulty: "Beginner" },
  { name: "Step-ups", category: "Quadriceps", equipment: "Box", difficulty: "Beginner" },
  { name: "Sissy Squats", category: "Quadriceps", equipment: "Bodyweight", difficulty: "Advanced" },
  { name: "Pistol Squats", category: "Quadriceps", equipment: "Bodyweight", difficulty: "Advanced" },

  // --- LEGS (HAMSTRINGS/GLUTES) ---
  { name: "Romanian Deadlift (RDL)", category: "Hamstrings", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Dumbbell RDL", category: "Hamstrings", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Lying Leg Curls", category: "Hamstrings", equipment: "Machine", difficulty: "Beginner" },
  { name: "Seated Leg Curls", category: "Hamstrings", equipment: "Machine", difficulty: "Beginner" },
  { name: "Nordic Hamstring Curl", category: "Hamstrings", equipment: "Bodyweight", difficulty: "Advanced" },
  { name: "Good Mornings", category: "Hamstrings", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Hip Thrusts", category: "Glutes", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Glute Bridges", category: "Glutes", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Cable Kickbacks", category: "Glutes", equipment: "Cable", difficulty: "Intermediate" },
  { name: "Kettlebell Swings", category: "Hamstrings", equipment: "Kettlebell", difficulty: "Intermediate" },
  { name: "Cable Pull-Throughs", category: "Hamstrings", equipment: "Cable", difficulty: "Beginner" },
  { name: "Clamshells", category: "Glutes", equipment: "Band", difficulty: "Beginner" },

  // --- CALVES ---
  { name: "Standing Calf Raises", category: "Calves", equipment: "Machine", difficulty: "Beginner" },
  { name: "Seated Calf Raises", category: "Calves", equipment: "Machine", difficulty: "Beginner" },
  { name: "Donkey Calf Raises", category: "Calves", equipment: "Machine", difficulty: "Beginner" },

  // --- ARMS (BICEPS) ---
  { name: "Barbell Curls", category: "Biceps", equipment: "Barbell", difficulty: "Beginner" },
  { name: "Dumbbell Curls", category: "Biceps", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Hammer Curls", category: "Biceps", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Preacher Curls", category: "Biceps", equipment: "Machine/EZ Bar", difficulty: "Intermediate" },
  { name: "Cable Curls", category: "Biceps", equipment: "Cable", difficulty: "Beginner" },
  { name: "Incline Dumbbell Curls", category: "Biceps", equipment: "Dumbbells", difficulty: "Intermediate" },
  { name: "Concentration Curls", category: "Biceps", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Spider Curls", category: "Biceps", equipment: "Dumbbells", difficulty: "Intermediate" },
  { name: "Zottman Curls", category: "Biceps", equipment: "Dumbbells", difficulty: "Intermediate" },

  // --- ARMS (TRICEPS) ---
  { name: "Close-Grip Bench Press", category: "Triceps", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Tricep Dips", category: "Triceps", equipment: "Bodyweight/Machine", difficulty: "Intermediate" },
  { name: "Cable Pushdowns (Rope)", category: "Triceps", equipment: "Cable", difficulty: "Beginner" },
  { name: "Cable Pushdowns (Bar)", category: "Triceps", equipment: "Cable", difficulty: "Beginner" },
  { name: "Skull Crushers", category: "Triceps", equipment: "EZ Bar", difficulty: "Intermediate" },
  { name: "Overhead Tricep Ext", category: "Triceps", equipment: "Dumbbell/Cable", difficulty: "Beginner" },
  { name: "Diamond Push-ups", category: "Triceps", equipment: "Bodyweight", difficulty: "Advanced" },
  { name: "Kickbacks", category: "Triceps", equipment: "Dumbbells", difficulty: "Beginner" },

  // --- CORE ---
  { name: "Plank", category: "Core", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Hanging Leg Raises", category: "Core", equipment: "Bar", difficulty: "Advanced" },
  { name: "Captain's Chair Leg Raise", category: "Core", equipment: "Machine", difficulty: "Beginner" },
  { name: "Cable Crunches", category: "Core", equipment: "Cable", difficulty: "Intermediate" },
  { name: "Ab Wheel Rollouts", category: "Core", equipment: "Wheel", difficulty: "Advanced" },
  { name: "Russian Twists", category: "Core", equipment: "Bodyweight/Plate", difficulty: "Beginner" },
  { name: "Woodchoppers", category: "Core", equipment: "Cable", difficulty: "Intermediate" },
  { name: "Dead Bug", category: "Core", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Pallof Press", category: "Core", equipment: "Cable/Band", difficulty: "Intermediate" },
  { name: "Dragon Flags", category: "Core", equipment: "Bodyweight", difficulty: "Advanced" },

  // --- CARDIO / MACHINES ---
  { name: "Treadmill (Steady State)", category: "Cardio", equipment: "Machine", difficulty: "Beginner" },
  { name: "Treadmill (Incline Walk)", category: "Cardio", equipment: "Machine", difficulty: "Beginner" },
  { name: "Treadmill (Sprints)", category: "Cardio", equipment: "Machine", difficulty: "Intermediate" },
  { name: "Stairmaster / Step Mill", category: "Cardio", equipment: "Machine", difficulty: "Intermediate" },
  { name: "Elliptical", category: "Cardio", equipment: "Machine", difficulty: "Beginner" },
  { name: "Stationary Bike", category: "Cardio", equipment: "Machine", difficulty: "Beginner" },
  { name: "Recumbent Bike", category: "Cardio", equipment: "Machine", difficulty: "Beginner" },
  { name: "Assault Bike / Air Bike", category: "Cardio", equipment: "Machine", difficulty: "Intermediate" },
  { name: "Rowing Machine (Erg)", category: "Cardio", equipment: "Machine", difficulty: "Intermediate" },
  { name: "SkiErg", category: "Cardio", equipment: "Machine", difficulty: "Intermediate" },
  { name: "Arc Trainer", category: "Cardio", equipment: "Machine", difficulty: "Beginner" },
  { name: "Jacobs Ladder", category: "Cardio", equipment: "Machine", difficulty: "Advanced" },
  { name: "VersaClimber", category: "Cardio", equipment: "Machine", difficulty: "Advanced" },
  { name: "Jump Rope", category: "Cardio", equipment: "Rope", difficulty: "Beginner" },
  { name: "Burpees", category: "Cardio", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Battle Ropes", category: "Cardio", equipment: "Ropes", difficulty: "Intermediate" },
  { name: "Sled Push", category: "Cardio", equipment: "Sled", difficulty: "Intermediate" },
  { name: "Sled Pull", category: "Cardio", equipment: "Sled", difficulty: "Intermediate" },
  { name: "Box Jumps", category: "Cardio", equipment: "Box", difficulty: "Intermediate" },

  // --- OLYMPIC / EXPLOSIVE ---
  { name: "Power Clean", category: "Olympic", equipment: "Barbell", difficulty: "Advanced" },
  { name: "Hang Clean", category: "Olympic", equipment: "Barbell", difficulty: "Advanced" },
  { name: "Snatch", category: "Olympic", equipment: "Barbell", difficulty: "Advanced" },
  { name: "Push Jerk", category: "Olympic", equipment: "Barbell", difficulty: "Advanced" },
  { name: "Medicine Ball Slams", category: "Olympic", equipment: "Med Ball", difficulty: "Beginner" },
  { name: "Kettlebell Snatch", category: "Olympic", equipment: "Kettlebell", difficulty: "Advanced" },

  // --- MOBILITY / WARMUP ---
  { name: "Foam Rolling", category: "Mobility", equipment: "Foam Roller", difficulty: "Beginner" },
  { name: "90/90 Hip Stretch", category: "Mobility", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Cat-Cow", category: "Mobility", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Thoracic Rotation", category: "Mobility", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Couch Stretch", category: "Mobility", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Band Pull-Aparts", category: "Mobility", equipment: "Band", difficulty: "Beginner" },
  { name: "Shoulder Dislocations", category: "Mobility", equipment: "PVC Pipe", difficulty: "Beginner" }
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
  "Olympic": "bg-slate-500/20 text-slate-300",
  "Mobility": "bg-emerald-500/20 text-emerald-300",
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

  const categories = ["all", ...new Set(EXERCISE_DATABASE.map(ex => ex.category))].sort();
  
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
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-yellow-500" />
            Exercise Library
          </DialogTitle>
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
                  className="pl-10 bg-gray-800 border-gray-700 focus:border-yellow-500"
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

            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2">
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
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h3 className="font-bold text-xl text-white mb-2">{selectedExercise.name}</h3>
                  <div className="flex gap-2 flex-wrap">
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
                    <Label className="text-xs text-gray-400">Warmup Sets</Label>
                    <Input
                      type="number"
                      min="0"
                      value={exerciseForm.warmup_sets}
                      onChange={(e) => setExerciseForm({...exerciseForm, warmup_sets: e.target.value})}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-yellow-500 font-bold">Working Sets</Label>
                    <Input
                      type="number"
                      min="1"
                      value={exerciseForm.working_sets}
                      onChange={(e) => setExerciseForm({...exerciseForm, working_sets: e.target.value})}
                      className="bg-gray-800 border-yellow-500/50 focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Cooldown Sets</Label>
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
                      placeholder="e.g. 8-12"
                      value={exerciseForm.reps}
                      onChange={(e) => setExerciseForm({...exerciseForm, reps: e.target.value})}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label>Weight</Label>
                    <Input
                      placeholder="e.g. 135 lbs"
                      value={exerciseForm.weight}
                      onChange={(e) => setExerciseForm({...exerciseForm, weight: e.target.value})}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <Label>Rest Time</Label>
                  <Input
                    placeholder="e.g. 60s"
                    value={exerciseForm.rest_time}
                    onChange={(e) => setExerciseForm({...exerciseForm, rest_time: e.target.value})}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Instructions (e.g. Drop set on last set)"
                    value={exerciseForm.notes}
                    onChange={(e) => setExerciseForm({...exerciseForm, notes: e.target.value})}
                    className="bg-gray-800 border-gray-700 resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-gray-600 hover:bg-gray-800 text-gray-300">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Workout
                  </Button>
                </div>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl p-8">
                <div className="bg-gray-800/50 p-4 rounded-full mb-4">
                  <Dumbbell className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-gray-400">No Exercise Selected</h3>
                <p className="text-sm mt-2 max-w-xs">Select an exercise from the list on the left to configure sets, reps, and weights.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}