import { useState } from "react";
import { Search, Plus, Dumbbell, X } from "lucide-react";

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
  { name: "Chest Dips", category: "Chest", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Machine Chest Press", category: "Chest", equipment: "Machine", difficulty: "Beginner" },
  { name: "Pec Deck / Machine Fly", category: "Chest", equipment: "Machine", difficulty: "Beginner" },

  // --- BACK ---
  { name: "Deadlift (Conventional)", category: "Back", equipment: "Barbell", difficulty: "Advanced" },
  { name: "Sumo Deadlift", category: "Back", equipment: "Barbell", difficulty: "Advanced" },
  { name: "Pull-ups", category: "Back", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Chin-ups", category: "Back", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Lat Pulldowns (Wide)", category: "Back", equipment: "Cable", difficulty: "Beginner" },
  { name: "Lat Pulldowns (Neutral)", category: "Back", equipment: "Cable", difficulty: "Beginner" },
  { name: "Seated Cable Rows", category: "Back", equipment: "Cable", difficulty: "Beginner" },
  { name: "Bent-over Barbell Rows", category: "Back", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "T-Bar Rows", category: "Back", equipment: "Machine/Landmine", difficulty: "Intermediate" },
  { name: "One-Arm Dumbbell Rows", category: "Back", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Face Pulls", category: "Back", equipment: "Cable", difficulty: "Beginner" },
  { name: "Hyperextensions", category: "Back", equipment: "Machine", difficulty: "Beginner" },

  // --- SHOULDERS ---
  { name: "Overhead Press (OHP)", category: "Shoulders", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Seated Dumbbell Press", category: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Arnold Press", category: "Shoulders", equipment: "Dumbbells", difficulty: "Intermediate" },
  { name: "Lateral Raises", category: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Cable Lateral Raises", category: "Shoulders", equipment: "Cable", difficulty: "Intermediate" },
  { name: "Front Raises", category: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Rear Delt Flyes", category: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Reverse Pec Deck", category: "Shoulders", equipment: "Machine", difficulty: "Beginner" },
  { name: "Upright Rows", category: "Shoulders", equipment: "Barbell", difficulty: "Intermediate" },

  // --- LEGS (QUADS) ---
  { name: "Barbell Back Squat", category: "Quadriceps", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Front Squat", category: "Quadriceps", equipment: "Barbell", difficulty: "Advanced" },
  { name: "Goblet Squat", category: "Quadriceps", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Leg Press", category: "Quadriceps", equipment: "Machine", difficulty: "Beginner" },
  { name: "Hack Squat", category: "Quadriceps", equipment: "Machine", difficulty: "Intermediate" },
  { name: "Leg Extensions", category: "Quadriceps", equipment: "Machine", difficulty: "Beginner" },
  { name: "Bulgarian Split Squats", category: "Quadriceps", equipment: "Dumbbells", difficulty: "Intermediate" },
  { name: "Walking Lunges", category: "Quadriceps", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Step-ups", category: "Quadriceps", equipment: "Box", difficulty: "Beginner" },

  // --- LEGS (HAMSTRINGS/GLUTES) ---
  { name: "Romanian Deadlift (RDL)", category: "Hamstrings", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Lying Leg Curls", category: "Hamstrings", equipment: "Machine", difficulty: "Beginner" },
  { name: "Seated Leg Curls", category: "Hamstrings", equipment: "Machine", difficulty: "Beginner" },
  { name: "Hip Thrusts", category: "Glutes", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Glute Bridges", category: "Glutes", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Cable Kickbacks", category: "Glutes", equipment: "Cable", difficulty: "Intermediate" },
  { name: "Kettlebell Swings", category: "Hamstrings", equipment: "Kettlebell", difficulty: "Intermediate" },
  { name: "Cable Pull-Throughs", category: "Hamstrings", equipment: "Cable", difficulty: "Beginner" },

  // --- CALVES ---
  { name: "Standing Calf Raises", category: "Calves", equipment: "Machine", difficulty: "Beginner" },
  { name: "Seated Calf Raises", category: "Calves", equipment: "Machine", difficulty: "Beginner" },

  // --- ARMS ---
  { name: "Barbell Curls", category: "Biceps", equipment: "Barbell", difficulty: "Beginner" },
  { name: "Dumbbell Curls", category: "Biceps", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Hammer Curls", category: "Biceps", equipment: "Dumbbells", difficulty: "Beginner" },
  { name: "Preacher Curls", category: "Biceps", equipment: "Machine", difficulty: "Intermediate" },
  { name: "Cable Curls", category: "Biceps", equipment: "Cable", difficulty: "Beginner" },
  { name: "Tricep Pushdowns (Rope)", category: "Triceps", equipment: "Cable", difficulty: "Beginner" },
  { name: "Tricep Pushdowns (Bar)", category: "Triceps", equipment: "Cable", difficulty: "Beginner" },
  { name: "Skull Crushers", category: "Triceps", equipment: "EZ Bar", difficulty: "Intermediate" },
  { name: "Overhead Tricep Ext", category: "Triceps", equipment: "Dumbbell", difficulty: "Beginner" },
  { name: "Tricep Dips", category: "Triceps", equipment: "Bodyweight", difficulty: "Intermediate" },

  // --- CORE ---
  { name: "Plank", category: "Core", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Hanging Leg Raises", category: "Core", equipment: "Bar", difficulty: "Advanced" },
  { name: "Cable Crunches", category: "Core", equipment: "Cable", difficulty: "Intermediate" },
  { name: "Ab Wheel Rollouts", category: "Core", equipment: "Wheel", difficulty: "Advanced" },
  { name: "Russian Twists", category: "Core", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Woodchoppers", category: "Core", equipment: "Cable", difficulty: "Intermediate" },

  // --- CARDIO / MACHINES ---
  { name: "Treadmill (Steady)", category: "Cardio", equipment: "Machine", difficulty: "Beginner" },
  { name: "Treadmill (Sprints)", category: "Cardio", equipment: "Machine", difficulty: "Intermediate" },
  { name: "Stairmaster", category: "Cardio", equipment: "Machine", difficulty: "Intermediate" },
  { name: "Elliptical", category: "Cardio", equipment: "Machine", difficulty: "Beginner" },
  { name: "Stationary Bike", category: "Cardio", equipment: "Machine", difficulty: "Beginner" },
  { name: "Assault Bike", category: "Cardio", equipment: "Machine", difficulty: "Intermediate" },
  { name: "Rowing Machine", category: "Cardio", equipment: "Machine", difficulty: "Intermediate" },
  { name: "SkiErg", category: "Cardio", equipment: "Machine", difficulty: "Intermediate" },
  { name: "Arc Trainer", category: "Cardio", equipment: "Machine", difficulty: "Beginner" },
  { name: "Jump Rope", category: "Cardio", equipment: "Rope", difficulty: "Beginner" },
  { name: "Burpees", category: "Cardio", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Battle Ropes", category: "Cardio", equipment: "Ropes", difficulty: "Intermediate" },

  // --- MOBILITY ---
  { name: "Foam Rolling", category: "Mobility", equipment: "Foam Roller", difficulty: "Beginner" },
  { name: "90/90 Hip Stretch", category: "Mobility", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Cat-Cow", category: "Mobility", equipment: "Bodyweight", difficulty: "Beginner" },
  { name: "Band Pull-Aparts", category: "Mobility", equipment: "Band", difficulty: "Beginner" }
];

const categoryColors = {
  "Chest": "bg-red-500/20 text-red-400 border-red-500/30",
  "Back": "bg-blue-500/20 text-blue-400 border-blue-500/30", 
  "Shoulders": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Biceps": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Triceps": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Quadriceps": "bg-green-500/20 text-green-400 border-green-500/30",
  "Hamstrings": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Glutes": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "Calves": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "Core": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Cardio": "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "Mobility": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
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

  if (!isOpen) return null;

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
    
    // Reset
    setSelectedExercise(null);
    setExerciseForm({ warmup_sets: 1, working_sets: 3, cooldown_sets: 0, reps: "8-12", weight: "", rest_time: "60s", notes: "" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 text-white w-full max-w-4xl max-h-[90vh] rounded-xl flex flex-col shadow-2xl">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-yellow-500" />
            Exercise Library
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden p-6 grid md:grid-cols-2 gap-6">
          
          {/* LEFT: LIST */}
          <div className="flex flex-col gap-4 overflow-hidden h-full">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg text-sm px-3 focus:outline-none focus:border-yellow-500"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All' : cat}</option>)}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {filteredExercises.map((exercise, index) => (
                <div
                  key={index}
                  onClick={() => handleExerciseSelect(exercise)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    selectedExercise?.name === exercise.name
                      ? "border-yellow-500 bg-yellow-500/10"
                      : "border-gray-800 hover:bg-gray-800"
                  }`}
                >
                  <div>
                    <h4 className="font-medium text-gray-200">{exercise.name}</h4>
                    <p className="text-xs text-gray-500">{exercise.equipment}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${categoryColors[exercise.category] || "border-gray-700 bg-gray-800 text-gray-400"}`}>
                    {exercise.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: FORM */}
          <div className="overflow-y-auto pr-2 custom-scrollbar">
            {selectedExercise ? (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h3 className="font-bold text-xl text-white mb-2">{selectedExercise.name}</h3>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded border ${categoryColors[selectedExercise.category]}`}>{selectedExercise.category}</span>
                    <span className="text-xs px-2 py-1 rounded border border-gray-600 text-gray-400">{selectedExercise.equipment}</span>
                    <span className="text-xs px-2 py-1 rounded border border-gray-600 text-gray-400">{selectedExercise.difficulty}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Warmup</label>
                    <input type="number" min="0" value={exerciseForm.warmup_sets} onChange={(e) => setExerciseForm({...exerciseForm, warmup_sets: e.target.value})} className="bg-gray-800 border border-gray-700 rounded p-2 text-sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-yellow-500 font-bold">Working</label>
                    <input type="number" min="1" value={exerciseForm.working_sets} onChange={(e) => setExerciseForm({...exerciseForm, working_sets: e.target.value})} className="bg-gray-800 border border-yellow-500/50 rounded p-2 text-sm focus:border-yellow-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Cool</label>
                    <input type="number" min="0" value={exerciseForm.cooldown_sets} onChange={(e) => setExerciseForm({...exerciseForm, cooldown_sets: e.target.value})} className="bg-gray-800 border border-gray-700 rounded p-2 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Reps</label>
                    <input placeholder="e.g. 8-12" value={exerciseForm.reps} onChange={(e) => setExerciseForm({...exerciseForm, reps: e.target.value})} className="bg-gray-800 border border-gray-700 rounded p-2 text-sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Weight</label>
                    <input placeholder="e.g. 135 lbs" value={exerciseForm.weight} onChange={(e) => setExerciseForm({...exerciseForm, weight: e.target.value})} className="bg-gray-800 border border-gray-700 rounded p-2 text-sm" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Rest Time</label>
                  <input placeholder="e.g. 60s" value={exerciseForm.rest_time} onChange={(e) => setExerciseForm({...exerciseForm, rest_time: e.target.value})} className="bg-gray-800 border border-gray-700 rounded p-2 text-sm" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Notes</label>
                  <textarea placeholder="Instructions..." rows={3} value={exerciseForm.notes} onChange={(e) => setExerciseForm({...exerciseForm, notes: e.target.value})} className="bg-gray-800 border border-gray-700 rounded p-2 text-sm resize-none" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl p-8 opacity-50">
                <Dumbbell className="w-12 h-12 mb-4" />
                <p>Select an exercise</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}