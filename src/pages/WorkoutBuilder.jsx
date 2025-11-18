
import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Workout } from "@/entities/Workout";
import { Client } from "@/entities/Client";
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
      const user = await User.me();
      const [workoutData, clientData] = await Promise.all([
        Workout.filter({ coach_id: user.id }, "-created_date"),
        Client.filter({ coach_id: user.id })
      ]);
      
      setWorkouts(workoutData);
      setClients(clientData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleWorkoutCreated = (newWorkout) => {
    setWorkouts([newWorkout, ...workouts]);
    setIsCreateDialogOpen(false);
  };

  const handleWorkoutUpdated = (updatedWorkout) => {
    setWorkouts(workouts.map(w => w.id === updatedWorkout.id ? updatedWorkout : w));
    setSelectedWorkout(updatedWorkout);
  };

  const handleWorkoutDeleted = (workoutId) => {
    setWorkouts(workouts.filter(w => w.id !== workoutId));
    setSelectedWorkout(null);
  };

  const handleAssignWorkout = (workout) => {
    setWorkoutToAssign(workout);
    setIsAssignDialogOpen(true);
  };

  const handleAssignPlan = async (planId, clientIds) => {
    try {
      const templateWorkout = workouts.find(w => w.id === planId);
      if (!templateWorkout) {
        toast.error("Workout template not found.");
        return;
      }

      const assignPromises = clientIds.map(clientId => {
        const assignedClient = clients.find(c => c.id === clientId);
        return Workout.create({
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
      
      await Promise.all(assignPromises);
      await loadData();
      setIsAssignDialogOpen(false);
      setWorkoutToAssign(null);
      toast.success(`Workout assigned to ${clientIds.length} client${clientIds.length > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error("Error assigning workout:", error);
      toast.error("Failed to assign workout. Please try again.");
    }
  };

  const filteredWorkouts = workouts.filter(workout =>
    workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (workout.description && workout.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const templateWorkouts = filteredWorkouts.filter(w => w.is_template !== false);
  const clientWorkouts = filteredWorkouts.filter(w => w.client_id);

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="w-8 h-8 text-[#C5B358]" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Workout Builder</h1>
          </div>
          <p className="text-muted-foreground">Create, customize, and assign workout programs to your clients.</p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Workout
        </Button>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-md">
        <Input
          placeholder="Search workouts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-input text-slate-900 pr-10 px-3 py-2 text-base rounded-md flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-border focus:border-[#C5B358]"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Workouts</p>
                <p className="text-3xl font-bold text-foreground">{templateWorkouts.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#C5B358] to-[#A4913C] bg-opacity-20 flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-[#C5B358]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Templates</p>
                <p className="text-3xl font-bold text-foreground">{templateWorkouts.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#C5B358] to-[#A4913C] bg-opacity-20 flex items-center justify-center">
                <Plus className="w-6 h-6 text-[#C5B358]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assigned</p>
                <p className="text-3xl font-bold text-foreground">{clientWorkouts.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#C5B358] to-[#A4913C] bg-opacity-20 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#C5B358]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedWorkout ? (
        <WorkoutDetailView
          workout={selectedWorkout}
          clients={clients}
          onBack={() => setSelectedWorkout(null)}
          onWorkoutUpdated={handleWorkoutUpdated}
          onWorkoutDeleted={handleWorkoutDeleted}
          onAssignWorkout={() => handleAssignWorkout(selectedWorkout)}
        />
      ) : (
        <div className="space-y-8">
          {/* Template Workouts */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Workout Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-48 bg-secondary rounded-lg animate-pulse"></div>
                ))
              ) : templateWorkouts.length > 0 ? (
                templateWorkouts.map((workout, index) => (
                  <motion.div
                    key={workout.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <WorkoutCard
                      workout={workout}
                      onClick={() => setSelectedWorkout(workout)}
                      onAssign={() => handleAssignWorkout(workout)}
                      isTemplate={true}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Dumbbell className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-semibold text-foreground">No Templates Yet</h3>
                  <p>Create your first workout template to get started.</p>
                </div>
              )}
            </div>
          </div>

          {/* Client Workouts */}
          {clientWorkouts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Assigned Workouts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientWorkouts.map((workout, index) => (
                  <motion.div
                    key={workout.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <WorkoutCard
                      workout={workout}
                      onClick={() => setSelectedWorkout(workout)}
                      client={clients.find(c => c.id === workout.client_id)}
                      isTemplate={false}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateWorkoutDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onWorkoutCreated={handleWorkoutCreated}
      />

      <AssignWorkoutDialog
        isOpen={isAssignDialogOpen}
        workout={workoutToAssign}
        clients={clients}
        onClose={() => {
          setIsAssignDialogOpen(false);
          setWorkoutToAssign(null);
        }}
        onAssign={handleAssignPlan}
      />
    </div>
  );
}
