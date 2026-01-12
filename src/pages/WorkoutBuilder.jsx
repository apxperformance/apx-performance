import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, Plus, Search, Users } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import WorkoutCard from "../components/workouts/WorkoutBuilderCard";
import CreateWorkoutDialog from "../components/workouts/CreateWorkoutDialog";
import WorkoutDetailView from "../components/workouts/WorkoutDetailView";
import AssignWorkoutDialog from "../components/workouts/AssignWorkoutDialog";

export default function WorkoutBuilder() {
  const [workouts, setWorkouts] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [workoutToAssign, setWorkoutToAssign] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const [workoutData, clientData] = await Promise.all([
      base44.entities.Workout.filter({ coach_id: user.id }, "-created_date"),
      base44.entities.Client.filter({ coach_id: user.id })]
      );

      setWorkouts(workoutData);
      setClients(clientData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load workout data.");
    }
    setIsLoading(false);
  };

  const handleWorkoutCreated = (newWorkout) => {
    setWorkouts([newWorkout, ...workouts]);
    setIsCreateDialogOpen(false);
  };

  const handleWorkoutUpdated = (updatedWorkout) => {
    setWorkouts(workouts.map((w) => w.id === updatedWorkout.id ? updatedWorkout : w));
    setSelectedWorkout(updatedWorkout);
  };

  const handleWorkoutDeleted = (workoutId) => {
    setWorkouts(workouts.filter((w) => w.id !== workoutId));
    setSelectedWorkout(null);
  };

  const handleAssignWorkout = (workout) => {
    setWorkoutToAssign(workout);
    setIsAssignDialogOpen(true);
  };

  const handleAssignPlan = async (planId, clientIds) => {
    try {
      const templateWorkout = workouts.find((w) => w.id === planId);
      if (!templateWorkout) return;

      const assignPromises = clientIds.map((clientId) => {
        const assignedClient = clients.find((c) => c.id === clientId);
        return base44.entities.Workout.create({
          name: `${templateWorkout.name} - ${assignedClient?.full_name || 'Client'}`,
          description: templateWorkout.description,
          workout_type: templateWorkout.workout_type,
          difficulty_level: templateWorkout.difficulty_level,
          estimated_duration: templateWorkout.estimated_duration,
          exercises: JSON.parse(JSON.stringify(templateWorkout.exercises || [])),
          coach_id: templateWorkout.coach_id,
          client_id: clientId,
          is_template: false
        });
      });

      await Promise.allSettled(assignPromises);
      await loadData();
      setIsAssignDialogOpen(false);
      setWorkoutToAssign(null);
      toast.success("Workouts assigned successfully!");
    } catch (error) {
      toast.error("Failed to assign workouts.");
    }
  };

  const filteredWorkouts = workouts.filter((workout) =>
  workout.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const templateWorkouts = filteredWorkouts.filter((w) => w.is_template !== false);
  const clientWorkouts = filteredWorkouts.filter((w) => w.client_id);

  return (
    <div className="p-6 md:p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

        <div>
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="text-gray-600 lucide lucide-dumbbell w-8 h-8" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Workout Builder</h1>
          </div>
          <p className="text-muted-foreground">Create and manage workout programs for your clients.</p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">

          <Plus className="w-4 h-4 mr-2" />
          Create Workout
        </Button>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-md">
        <Input
          placeholder="Search workouts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-input border-border text-foreground focus:border-primary" />

        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
        { label: "Total Workouts", val: templateWorkouts.length, icon: Dumbbell },
        { label: "Templates", val: templateWorkouts.length, icon: Plus },
        { label: "Assigned", val: clientWorkouts.length, icon: Users }].
        map((stat, i) =>
        <Card key={i} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.val}</p>
                </div>
                <div className="bg-gray-600 text-gray-50 p-3 rounded-xl flex items-center justify-center">
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Workout Lists */}
      {selectedWorkout ?
      <WorkoutDetailView
        workout={selectedWorkout}
        clients={clients}
        onBack={() => setSelectedWorkout(null)}
        onWorkoutUpdated={handleWorkoutUpdated}
        onWorkoutDeleted={handleWorkoutDeleted}
        onAssignWorkout={() => handleAssignWorkout(selectedWorkout)} /> :


      <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templateWorkouts.map((workout) =>
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onClick={() => setSelectedWorkout(workout)}
              onAssign={() => handleAssignWorkout(workout)}
              isTemplate={true} />

            )}
            </div>
          </div>
        </div>
      }

      {/* Dialogs */}
      <CreateWorkoutDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onWorkoutCreated={handleWorkoutCreated} />

      <AssignWorkoutDialog
        isOpen={isAssignDialogOpen}
        workout={workoutToAssign}
        clients={clients}
        onClose={() => {
          setIsAssignDialogOpen(false);
          setWorkoutToAssign(null);
        }}
        onAssign={handleAssignPlan} />

    </div>);

}