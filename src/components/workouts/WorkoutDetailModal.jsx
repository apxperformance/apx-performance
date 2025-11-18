
import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Dumbbell, Play, CheckCircle2, X, Save, Plus, Minus, AlertTriangle, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useUser } from "../contexts/UserContext";
import { format, isToday } from "date-fns";
import ConfirmDialog from "../ui/ConfirmDialog";

const difficultyColors = {
  beginner: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  intermediate: "bg-[#C5B358]/20 text-[#C5B358] border-[#C5B358]/30",
  advanced: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[#C5B358]/30",
};

const RPE_SCALE = [
  { value: 1, label: "Very Easy", color: "bg-green-500", description: "Could do much more" },
  { value: 2, label: "Easy", color: "bg-green-400", description: "Comfortable effort" },
  { value: 3, label: "Moderate", color: "bg-green-300", description: "Getting challenging" },
  { value: 4, label: "Somewhat Hard", color: "bg-yellow-400", description: "Breathing harder" },
  { value: 5, label: "Hard", color: "bg-yellow-500", description: "Tough but sustainable" },
  { value: 6, label: "Harder", color: "bg-orange-400", description: "Really challenging" },
  { value: 7, label: "Very Hard", color: "bg-orange-500", description: "Very tough" },
  { value: 8, label: "Extremely Hard", color: "bg-red-400", description: "Near maximum effort" },
  { value: 9, label: "Nearly Maximal", color: "bg-red-500", description: "All-out effort" },
  { value: 10, label: "Maximal", color: "bg-red-600", description: "Absolute maximum" },
];

const RPEIndicator = ({ value, onChange, showScale = false, disabled = false }) => {
  const currentRPE = RPE_SCALE.find(r => r.value === value) || RPE_SCALE[4];
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">RPE (Rate of Perceived Exertion)</Label>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${currentRPE.color}`}></div>
          <span className="font-bold text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">/ 10</span>
        </div>
      </div>
      
      <Slider
        value={[value]}
        onValueChange={(val) => onChange(val[0])}
        min={1}
        max={10}
        step={1}
        disabled={disabled}
        className="my-4"
      />
      
      <div className="bg-secondary/30 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm text-foreground">{currentRPE.label}</span>
          <Badge variant="outline" className={`${currentRPE.color} text-white border-0`}>
            {value}/10
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{currentRPE.description}</p>
      </div>
      
      {showScale && (
        <details className="text-xs">
          <summary className="cursor-pointer text-[#C5B358] hover:text-[#D8C67B] font-medium mb-2">
            View Full RPE Scale
          </summary>
          <div className="space-y-1 mt-2 max-h-48 overflow-y-auto pr-2">
            {RPE_SCALE.map((rpe) => (
              <div 
                key={rpe.value} 
                className={`flex items-center gap-2 p-2 rounded ${rpe.value === value ? 'bg-secondary/50' : 'bg-secondary/20'}`}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center ${rpe.color} text-white font-bold text-xs`}>
                  {rpe.value}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">{rpe.label}</div>
                  <div className="text-muted-foreground text-[10px]">{rpe.description}</div>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default function WorkoutDetailModal({ workout, isOpen, onClose, onWorkoutLogged }) {
  const { user } = useUser();
  const [isLoggingMode, setIsLoggingMode] = useState(false);
  const [workoutLog, setWorkoutLog] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showStaleWarning, setShowStaleWarning] = useState(false);
  const [staleDraftData, setStaleDraftData] = useState(null);

  const DRAFT_KEY = workout ? `workout_draft_${workout.id}_${user?.id}` : null;
  const AUTO_SAVE_INTERVAL = 30000;
  const DEBOUNCE_DELAY = 2000;

  const debouncedSaveTimeoutRef = useRef(null);
  const lastSaveVersionRef = useRef(0);

  // ✅ All useCallback hooks at the top level
  const saveDraft = useCallback(() => {
    if (!DRAFT_KEY || !workoutLog || !startTime) return;

    const version = ++lastSaveVersionRef.current;
    
    const draft = {
      workoutLog,
      startTime: startTime.toISOString(),
      savedAt: Date.now(),
      version
    };

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      console.log(`Draft saved (v${version})`);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error("localStorage quota exceeded - cannot save draft");
        toast.error("Storage full - draft auto-save disabled", {
          description: "Please finish and save your workout soon",
          duration: 5000
        });
        setAutoSaveEnabled(false);
      } else {
        console.error("Error saving draft:", error);
      }
    }
  }, [DRAFT_KEY, workoutLog, startTime]);

  const debouncedSave = useCallback(() => {
    if (debouncedSaveTimeoutRef.current) {
      clearTimeout(debouncedSaveTimeoutRef.current);
    }
    
    debouncedSaveTimeoutRef.current = setTimeout(() => {
      saveDraft();
      toast.success("Progress saved", { duration: 1500 });
    }, DEBOUNCE_DELAY);
  }, [saveDraft]);

  const immediateSave = useCallback(() => {
    if (debouncedSaveTimeoutRef.current) {
      clearTimeout(debouncedSaveTimeoutRef.current);
    }
    saveDraft();
  }, [saveDraft]);

  // Check for recent logs and draft on mount
  useEffect(() => {
    if (!workout || !user || !isOpen) return;

    checkRecentLogs();
    checkForDraft();
  }, [workout, user, isOpen]);

  // Auto-disable auto-save when workout is 100% complete
  const completedExercisesCount = workoutLog?.exercises.filter(ex => ex.completed).length || 0;
  const totalExercises = (workout?.exercises || []).length;
  const completionPercentage = totalExercises > 0 ? Math.round((completedExercisesCount / totalExercises) * 100) : 0;

  useEffect(() => {
    if (completionPercentage === 100 && autoSaveEnabled) {
      setAutoSaveEnabled(false);
      toast.info("All exercises complete! Auto-save disabled.", { duration: 2000 });
    }
  }, [completionPercentage, autoSaveEnabled]);

  // Auto-save functionality (interval for backup)
  useEffect(() => {
    if (!isLoggingMode || !workoutLog || !autoSaveEnabled || !DRAFT_KEY) return;

    const autoSaveInterval = setInterval(() => {
      saveDraft();
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(autoSaveInterval);
  }, [isLoggingMode, workoutLog, autoSaveEnabled, DRAFT_KEY, saveDraft]);

  // Warn before leaving with unsaved progress
  useEffect(() => {
    if (!isLoggingMode || !workoutLog) return;

    const handleBeforeUnload = (e) => {
      saveDraft();
      e.preventDefault();
      e.returnValue = "You have unsaved workout progress. Are you sure you want to leave?";
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLoggingMode, workoutLog, saveDraft]);

  if (!workout) return null;

  const checkRecentLogs = async () => {
    try {
      const logs = await base44.entities.WorkoutLog.filter({ 
        workout_id: workout.id, 
        client_id: user.id 
      }, "-completed_date", 5);
      
      setRecentLogs(logs);
    } catch (error) {
      console.error("Error checking recent logs:", error);
    }
  };

  const checkForDraft = async () => {
    if (!DRAFT_KEY) return;
    
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        const draftAge = Date.now() - parsedDraft.savedAt;
        
        if (draftAge < 24 * 60 * 60 * 1000) {
          const newerLogs = await base44.entities.WorkoutLog.filter({
            workout_id: workout.id,
            client_id: user.id
          }, "-completed_date", 1);
          
          if (newerLogs.length > 0) {
            const latestLogTime = new Date(newerLogs[0].completed_date).getTime();
            const draftStartTime = new Date(parsedDraft.startTime).getTime();
            
            if (latestLogTime > draftStartTime) {
              console.warn("Draft is stale - newer workout log exists");
              setStaleDraftData(parsedDraft);
              setShowStaleWarning(true);
              return;
            }
          }
          
          setHasDraft(true);
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      } catch (error) {
        console.error("Error parsing draft:", error);
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  };

  const loadDraft = () => {
    if (!DRAFT_KEY) return;

    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setWorkoutLog(parsedDraft.workoutLog);
        setStartTime(new Date(parsedDraft.startTime));
        lastSaveVersionRef.current = parsedDraft.version || 0;
        setIsLoggingMode(true);
        setShowDraftDialog(false);
        setHasDraft(false);
        toast.success("Draft loaded successfully");
      } catch (error) {
        console.error("Error loading draft:", error);
        toast.error("Failed to load draft");
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  };

  const clearDraft = () => {
    if (DRAFT_KEY) {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
      lastSaveVersionRef.current = 0;
    }
    if (debouncedSaveTimeoutRef.current) {
      clearTimeout(debouncedSaveTimeoutRef.current);
    }
  };

  const discardStaleDraft = () => {
    clearDraft();
    setShowStaleWarning(false);
    setStaleDraftData(null);
  };

  const loadStaleDraft = () => {
    if (staleDraftData) {
      setWorkoutLog(staleDraftData.workoutLog);
      setStartTime(new Date(staleDraftData.startTime));
      lastSaveVersionRef.current = staleDraftData.version || 0;
      setIsLoggingMode(true);
      setShowStaleWarning(false);
      setStaleDraftData(null);
      setHasDraft(false);
      toast.warning("Loaded old draft - verify data before saving", { duration: 4000 });
    }
  };

  const startWorkout = () => {
    const recentLog = recentLogs.find(log => {
      const logTime = new Date(log.completed_date);
      const hoursSince = (Date.now() - logTime.getTime()) / (1000 * 60 * 60);
      return hoursSince < 6;
    });

    if (recentLog) {
      setShowDuplicateWarning(true);
      return;
    }

    if (hasDraft) {
      setShowDraftDialog(true);
      return;
    }

    initiateNewWorkout();
  };

  const initiateNewWorkout = () => {
    setStartTime(new Date());
    setIsLoggingMode(true);
    
    const exercises = workout.exercises || [];
    const initialLog = {
      exercises: exercises.map((ex) => ({
        exercise_name: ex.exercise_name,
        planned_sets: ex.sets || 3,
        planned_reps: ex.reps || "10",
        planned_weight: ex.weight || "Bodyweight",
        actual_sets: Array(ex.sets || 3).fill(null).map(() => ({
          reps: 0,
          weight: 0,
          rpe: 5,
          notes: ""
        })),
        completed: false
      })),
      overall_rpe: [5],
      notes: ""
    };
    setWorkoutLog(initialLog);
    setShowDuplicateWarning(false);
    setShowDraftDialog(false);
    clearDraft();
  };

  const updateSetData = (exerciseIdx, setIdx, field, value) => {
    setWorkoutLog(prev => {
      const newLog = { ...prev };
      
      // Enhanced validation for different field types
      if (field === 'reps') {
        const numValue = parseInt(value);
        if (isNaN(numValue)) { // Allow empty string for temporary editing
          newLog.exercises[exerciseIdx].actual_sets[setIdx][field] = value;
        } else if (numValue < 0) {
          toast.error("Reps cannot be negative");
          newLog.exercises[exerciseIdx].actual_sets[setIdx][field] = 0;
        } else if (numValue > 1000) {
          toast.error("Reps cannot exceed 1000");
          newLog.exercises[exerciseIdx].actual_sets[setIdx][field] = 1000;
        } else {
          newLog.exercises[exerciseIdx].actual_sets[setIdx][field] = numValue;
        }
      } else if (field === 'weight') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) { // Allow empty string for temporary editing
          newLog.exercises[exerciseIdx].actual_sets[setIdx][field] = value;
        } else if (numValue < 0) {
          toast.error("Weight cannot be negative");
          newLog.exercises[exerciseIdx].actual_sets[setIdx][field] = 0;
        } else if (numValue > 10000) {
          toast.error("Weight cannot exceed 10,000 lbs");
          newLog.exercises[exerciseIdx].actual_sets[setIdx][field] = 10000;
        } else {
          newLog.exercises[exerciseIdx].actual_sets[setIdx][field] = numValue;
        }
      } else if (field === 'rpe') {
        const rpeValue = parseInt(value);
        
        if (isNaN(rpeValue)) { // Allow empty string for temporary editing
          newLog.exercises[exerciseIdx].actual_sets[setIdx][field] = value;
        } else if (rpeValue < 1) {
          toast.error("RPE must be at least 1");
          newLog.exercises[exerciseIdx].actual_sets[setIdx][field] = 1;
        } else if (rpeValue > 10) {
          toast.error("RPE cannot exceed 10");
          newLog.exercises[exerciseIdx].actual_sets[setIdx][field] = 10;
        } else {
          newLog.exercises[exerciseIdx].actual_sets[setIdx][field] = rpeValue;
        }
      } else {
        // Notes field - no validation needed
        newLog.exercises[exerciseIdx].actual_sets[setIdx][field] = value;
      }
      
      debouncedSave();
      
      return newLog;
    });
  };

  const addSet = (exerciseIdx) => {
    setWorkoutLog(prev => {
      const newLog = { ...prev };
      const exercise = newLog.exercises[exerciseIdx];
      const lastSet = exercise.actual_sets[exercise.actual_sets.length - 1];
      
      const newSet = {
        reps: lastSet?.reps || 0,
        weight: lastSet?.weight || 0,
        rpe: lastSet?.rpe || 5,
        notes: ""
      };
      
      exercise.actual_sets.push(newSet);
      
      toast.success(`Set ${exercise.actual_sets.length} added`, { 
        duration: 1500,
        description: `Starting with ${newSet.reps} reps at ${newSet.weight}lbs`
      });
      
      setTimeout(() => immediateSave(), 100);
      
      return newLog;
    });
  };

  const removeSet = (exerciseIdx, setIdx) => {
    setWorkoutLog(prev => {
      const newLog = { ...prev };
      const exercise = newLog.exercises[exerciseIdx];
      
      if (exercise.actual_sets.length <= 1) {
        toast.error("Cannot remove the last set", {
          description: "Each exercise must have at least one set"
        });
        return prev;
      }
      
      exercise.actual_sets.splice(setIdx, 1);
      toast.success(`Set ${setIdx + 1} removed`);
      setTimeout(() => immediateSave(), 100);
      
      return newLog;
    });
  };

  const toggleExerciseComplete = (exerciseIdx) => {
    setWorkoutLog(prev => {
      const newLog = { ...prev };
      newLog.exercises[exerciseIdx].completed = !newLog.exercises[exerciseIdx].completed;
      setTimeout(() => immediateSave(), 100);
      return newLog;
    });
  };

  const saveWorkoutLog = async () => {
    if (!user || !startTime) return;
    
    setIsSaving(true);
    try {
      const endTime = new Date();
      const durationMinutes = Math.round((endTime - startTime) / 60000);

      const logData = {
        workout_id: workout.id,
        client_id: user.id,
        coach_id: user.coach_id || workout.coach_id,
        workout_name: workout.name,
        completed_date: endTime.toISOString(),
        duration_minutes: durationMinutes,
        exercises: workoutLog.exercises,
        overall_rpe: workoutLog.overall_rpe[0],
        notes: workoutLog.notes
      };

      await base44.entities.WorkoutLog.create(logData);
      clearDraft();
      toast.success("Workout logged successfully! 💪");
      
      setIsLoggingMode(false);
      setWorkoutLog(null);
      setStartTime(null);
      setAutoSaveEnabled(true);
      
      if (onWorkoutLogged) {
        onWorkoutLogged();
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving workout log:", error);
      toast.error("Failed to save workout log");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelWorkout = () => {
    if (workoutLog && startTime) {
      const hasProgress = workoutLog.exercises.some(ex => 
        ex.completed || ex.actual_sets.some(set => set.reps > 0 || set.weight > 0 || set.notes !== "")
      );

      if (hasProgress) {
        const saveAsDraft = window.confirm(
          "You have unsaved progress. Would you like to save it as a draft?\n\nClick OK to save draft, or Cancel to discard progress."
        );

        if (saveAsDraft) {
          saveDraft();
          toast.success("Progress saved as draft");
        } else {
          clearDraft();
          toast.info("Progress discarded");
        }
      } else {
        clearDraft();
      }
    }

    setIsLoggingMode(false);
    setWorkoutLog(null);
    setStartTime(null);
    setAutoSaveEnabled(true);
  };

  const elapsedTime = startTime ? Math.round((Date.now() - startTime.getTime()) / 60000) : 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card border-border text-card-foreground max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-4">
            <div className="flex justify-between items-start">
              <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Dumbbell className="w-7 h-7 mr-1 text-[#C5B358]" />
                {workout.name}
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-secondary">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Badge className={difficultyColors[workout.difficulty_level] || difficultyColors.intermediate}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {workout.difficulty_level || "intermediate"}
              </Badge>
              <Badge variant="outline" className="border-border text-foreground">
                <Clock className="w-3 h-3 mr-1" />
                {workout.estimated_duration || 45} minutes
              </Badge>
              <Badge variant="outline" className="border-border text-foreground">
                {totalExercises} exercises
              </Badge>
              {recentLogs.length > 0 && !isLoggingMode && (
                <Badge variant="outline" className="border-[#C5B358] text-[#C5B358]">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Logged {recentLogs.length} time{recentLogs.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {workout.description && !isLoggingMode && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Description</h3>
                <p className="text-muted-foreground">{workout.description}</p>
              </div>
            )}

            {isLoggingMode && (
              <>
                <div className="bg-gradient-to-r from-[#C5B358]/20 to-[#A4913C]/20 border border-[#C5B358]/30 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Workout Progress
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{elapsedTime} min elapsed</span>
                      <span className="text-sm text-[#C5B358] font-semibold">{completionPercentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-[#C5B358] to-[#A4913C] h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">
                      {completedExercisesCount} of {totalExercises} exercises completed
                    </span>
                    {autoSaveEnabled && (
                      <span className="text-[#C5B358] flex items-center gap-1">
                        <Save className="w-3 h-3" />
                        Auto-saving every 30s
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-foreground">Exercises</h3>
                {!isLoggingMode ? (
                  <div className="flex gap-2">
                    {hasDraft && (
                      <Button
                        onClick={() => setShowDraftDialog(true)}
                        variant="outline"
                        className="border-[#C5B358] text-[#C5B358] hover:bg-[#C5B358]/10"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Resume Draft
                      </Button>
                    )}
                    <Button 
                      onClick={startWorkout}
                      className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Workout
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      onClick={cancelWorkout}
                      variant="outline"
                      className="border-border text-foreground hover:bg-secondary"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={saveWorkoutLog}
                      disabled={isSaving}
                      className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Workout"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {(workout.exercises || []).map((exercise, exerciseIdx) => {
                    const logData = workoutLog?.exercises[exerciseIdx];
                    const isCompleted = logData?.completed;

                    return (
                      <motion.div
                        key={exerciseIdx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: exerciseIdx * 0.05 }}
                        className={`p-4 rounded-lg border transition-all duration-200 ${
                          isCompleted
                            ? "bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/30"
                            : "bg-secondary/50 border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className={`font-medium text-lg ${
                                isCompleted ? "text-[hsl(var(--success))] line-through" : "text-foreground"
                              }`}>
                                {exercise.exercise_name}
                              </h4>
                            </div>
                            
                            {!isLoggingMode && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Sets:</span>
                                  <span className="ml-2 text-foreground font-medium">{exercise.sets || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Reps:</span>
                                  <span className="ml-2 text-foreground font-medium">{exercise.reps || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Weight:</span>
                                  <span className="ml-2 text-foreground font-medium">{exercise.weight || "Bodyweight"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Rest:</span>
                                  <span className="ml-2 text-foreground font-medium">{exercise.rest_time || "60s"}</span>
                                </div>
                              </div>
                            )}

                            {exercise.notes && !isLoggingMode && (
                              <p className="text-muted-foreground text-sm mt-2 italic">{exercise.notes}</p>
                            )}
                          </div>

                          {isLoggingMode && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleExerciseComplete(exerciseIdx)}
                              className={`ml-4 ${
                                isCompleted
                                  ? "text-[hsl(var(--success))] hover:text-[hsl(var(--success))]"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <CheckCircle2 className="w-6 h-6" />
                            </Button>
                          )}
                        </div>

                        {isLoggingMode && logData && (
                          <div className="space-y-3 mt-4 pt-4 border-t border-border">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm font-semibold text-foreground">Log Your Sets</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addSet(exerciseIdx)}
                                className="h-7 text-xs border-[#C5B358] text-[#C5B358] hover:bg-[#C5B358]/10"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Set
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              {logData.actual_sets.map((set, setIdx) => (
                                <div key={setIdx} className="bg-card/50 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-[#C5B358]">Set {setIdx + 1}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeSet(exerciseIdx, setIdx)}
                                      className="h-6 w-6 text-muted-foreground hover:text-[hsl(var(--destructive))]"
                                      disabled={logData.actual_sets.length === 1}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Reps</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="1000"
                                        placeholder="0"
                                        value={set.reps || ""}
                                        onChange={(e) => updateSetData(exerciseIdx, setIdx, 'reps', e.target.value)}
                                        className="h-9 text-sm bg-input border-border mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Weight (lbs)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="10000"
                                        step="0.5"
                                        placeholder="0"
                                        value={set.weight || ""}
                                        onChange={(e) => updateSetData(exerciseIdx, setIdx, 'weight', e.target.value)}
                                        className="h-9 text-sm bg-input border-border mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                        RPE (1-10)
                                        <span className={`w-2 h-2 rounded-full ${RPE_SCALE.find(r => r.value === set.rpe)?.color || 'bg-gray-400'}`}></span>
                                      </Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        step="1"
                                        placeholder="5"
                                        value={set.rpe || ""}
                                        onChange={(e) => updateSetData(exerciseIdx, setIdx, 'rpe', e.target.value)}
                                        onBlur={(e) => {
                                          const value = parseInt(e.target.value);
                                          if (isNaN(value) || value < 1) {
                                            updateSetData(exerciseIdx, setIdx, 'rpe', '1');
                                          } else if (value > 10) {
                                            updateSetData(exerciseIdx, setIdx, 'rpe', '10');
                                          }
                                        }}
                                        className={`h-9 text-sm bg-input border-border mt-1 ${
                                          set.rpe && (parseInt(set.rpe) < 1 || parseInt(set.rpe) > 10) 
                                            ? 'border-[hsl(var(--destructive))] focus-visible:ring-[hsl(var(--destructive))]' 
                                            : ''
                                        }`}
                                      />
                                      {set.rpe && (parseInt(set.rpe) < 1 || parseInt(set.rpe) > 10) && (
                                        <span className="text-[10px] text-[hsl(var(--destructive))] mt-0.5">
                                          Must be 1-10
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {set.notes !== undefined && (
                                    <Input
                                      placeholder="Notes (optional)"
                                      value={set.notes}
                                      onChange={(e) => updateSetData(exerciseIdx, setIdx, 'notes', e.target.value)}
                                      className="h-8 text-xs bg-input border-border"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                  
                  {totalExercises === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No exercises defined for this workout</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {isLoggingMode && workoutLog && (
              <div className="space-y-4 pt-4 border-t border-border">
                <RPEIndicator
                  value={workoutLog.overall_rpe[0]}
                  onChange={(val) => {
                    // Clamp value to 1-10 range
                    const clampedValue = Math.max(1, Math.min(10, parseInt(val) || 5));
                    if (val !== clampedValue) {
                      toast.error(`RPE must be between 1-10. Value adjusted to ${clampedValue}.`, { duration: 2000 });
                    }
                    setWorkoutLog(prev => ({ ...prev, overall_rpe: [clampedValue] }));
                    debouncedSave();
                  }}
                  showScale={true}
                />

                <div>
                  <Label className="text-foreground mb-2 block">Workout Notes</Label>
                  <Textarea
                    value={workoutLog.notes}
                    onChange={(e) => {
                      setWorkoutLog(prev => ({ ...prev, notes: e.target.value }));
                      debouncedSave();
                    }}
                    placeholder="How did this workout feel? Any modifications or observations?"
                    className="bg-input border-border resize-none"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {isLoggingMode && completionPercentage === 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-[#C5B358]/20 to-[#A4913C]/20 border border-[#C5B358]/30 rounded-lg p-6 text-center"
              >
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-[#C5B358]" />
                <h3 className="text-xl font-bold text-foreground mb-2">All Exercises Complete!</h3>
                <p className="text-muted-foreground mb-4">Great work! Don't forget to save your workout.</p>
                <Button 
                  onClick={saveWorkoutLog}
                  disabled={isSaving}
                  className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Workout Log"}
                </Button>
              </motion.div>
            )}

            {!isLoggingMode && recentLogs.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold text-foreground mb-3">Recent Logs</h3>
                <div className="space-y-2">
                  {recentLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="bg-secondary/30 rounded-lg p-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-foreground font-medium">
                          {format(new Date(log.completed_date), 'MMM d, yyyy')}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{log.duration_minutes} min</span>
                          <span>RPE: {log.overall_rpe}/10</span>
                        </div>
                      </div>
                      {isToday(new Date(log.completed_date)) && (
                        <Badge className="mt-1 bg-[#C5B358]/20 text-[#C5B358] text-xs">
                          Logged today
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={showDuplicateWarning}
        onClose={() => setShowDuplicateWarning(false)}
        onConfirm={initiateNewWorkout}
        title="Workout Already Logged Recently"
        description={`You logged this workout ${recentLogs[0] ? format(new Date(recentLogs[0].completed_date), 'MMM d') : 'recently'}${recentLogs[0] ? ` at ${format(new Date(recentLogs[0].completed_date), 'h:mm a')}` : ''}. Are you sure you want to log it again?`}
        confirmText="Log Again"
        cancelText="Cancel"
        variant="warning"
        icon={AlertTriangle}
      />

      <ConfirmDialog
        isOpen={showDraftDialog}
        onClose={() => setShowDraftDialog(false)}
        onConfirm={loadDraft}
        title="Resume Previous Workout?"
        description="You have an unfinished workout saved as a draft. Would you like to resume where you left off, or start fresh?"
        confirmText="Resume Draft"
        cancelText="Start Fresh"
        variant="default"
        icon={RotateCcw}
        onCancel={initiateNewWorkout}
      />

      <ConfirmDialog
        isOpen={showStaleWarning}
        onClose={discardStaleDraft}
        onConfirm={loadStaleDraft}
        title="Old Draft Found"
        description={
          <>
            <p className="mb-2">You have an old workout draft saved, but you've completed this workout more recently.</p>
            <p className="text-sm text-yellow-400">
              ⚠️ Loading the old draft may contain outdated information. It's recommended to start fresh.
            </p>
          </>
        }
        confirmText="Load Old Draft Anyway"
        cancelText="Discard Old Draft"
        variant="warning"
        icon={AlertTriangle}
      />
    </>
  );
}
