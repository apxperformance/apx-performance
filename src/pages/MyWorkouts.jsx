
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Calendar, CheckCircle2, History, Loader2, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useUser } from "../components/contexts/UserContext";
import { useInfiniteScroll } from "../components/utils/useInfiniteScroll";

import WorkoutCard from "../components/workouts/WorkoutCard";
import WorkoutDetailModal from "../components/workouts/WorkoutDetailModal";
import WorkoutHistoryDialog from "../components/workouts/WorkoutHistoryDialog";
import CreateWorkoutDialog from "../components/workouts/CreateWorkoutDialog";
import ClientWorkoutDetailView from "../components/workouts/ClientWorkoutDetailView";

export default function MyWorkouts() {
  const { user, isLoading: userLoading, hasCoach } = useUser();
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showHistory, setShowHistory] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch workouts with infinite scroll
  const {
    items: workouts,
    isLoading: workoutsLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    totalLoaded
  } = useInfiniteScroll(
    async (cursor, pageSize) => {
      if (!user) return [];
      
      const items = await base44.entities.Workout.filter(
        { client_id: user.id },
        "-created_date",
        pageSize
      );
      
      return items;
    },
    ['workouts', user?.id],
    15,
    {
      enabled: !!user && !userLoading,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch workout logs
  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workoutLogs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.WorkoutLog.filter({ client_id: user.id }, "-completed_date");
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const handleWorkoutLogged = () => {
    queryClient.invalidateQueries({ queryKey: ['workoutLogs', user?.id] });
  };

  const handleWorkoutCreated = (newWorkout) => {
    queryClient.invalidateQueries({ queryKey: ['workouts', user?.id] });
    setIsCreateDialogOpen(false);
  };

  const handleWorkoutUpdated = (updatedWorkout) => {
    queryClient.invalidateQueries({ queryKey: ['workouts', user?.id] });
    setSelectedWorkout(updatedWorkout);
  };

  const handleWorkoutDeleted = () => {
    // Invalidate both workouts AND workout logs since logs were cascade deleted
    queryClient.invalidateQueries({ queryKey: ['workouts', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['workoutLogs', user?.id] });
    setSelectedWorkout(null);
  };

  const filteredWorkouts = workouts.filter(workout => {
    if (filter === "all") return true;
    return workout.workout_type === filter;
  });

  const workoutTypes = ["all", "strength", "cardio", "flexibility", "sports", "recovery"];

  // Calculate stats
  const thisWeekLogs = workoutLogs.filter(log => {
    const logDate = new Date(log.completed_date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return logDate > weekAgo;
  });

  const showFullPageLoader = userLoading || (workoutsLoading && workouts.length === 0);

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
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">My Workouts</h1>
          </div>
          <p className="text-muted-foreground">
            {hasCoach 
              ? "Your personalized training programs designed by your coach." 
              : "Create and manage your own workout programs."}
          </p>
        </div>
        <div className="flex gap-3">
          {!hasCoach && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Workout
            </Button>
          )}
          <Button
            onClick={() => setShowHistory(true)}
            variant="outline"
            className="border-border text-foreground hover:bg-secondary"
          >
            <History className="w-4 h-4 mr-2" />
            View History
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Programs</p>
                  <p className="text-3xl font-bold text-foreground">{totalLoaded}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#C5B358]/20">
                  <Dumbbell className="w-6 h-6 text-[#C5B358]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-3xl font-bold text-foreground">{thisWeekLogs.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Logged</p>
                  <p className="text-3xl font-bold text-foreground">{workoutLogs.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {workoutTypes.map((type) => (
          <Button
            key={type}
            variant={filter === type ? "default" : "outline"}
            onClick={() => setFilter(type)}
            className={
              filter === type 
                ? "bg-[#C5B358] hover:bg-[#A4913C] text-black" 
                : "border-border text-foreground hover:bg-secondary"
            }
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </div>

      {/* Workout Detail View (if selected and client is self-managing) */}
      {selectedWorkout && !hasCoach ? (
        <ClientWorkoutDetailView
          workout={selectedWorkout}
          onBack={() => setSelectedWorkout(null)}
          onWorkoutUpdated={handleWorkoutUpdated}
          onWorkoutDeleted={handleWorkoutDeleted}
        />
      ) : (
        <>
          {/* Workout Grid */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {showFullPageLoader ? (
                Array(6).fill(0).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Card className="bg-card/50 backdrop-blur-xl border-border">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="h-6 bg-secondary rounded animate-pulse"></div>
                          <div className="h-4 bg-secondary rounded animate-pulse w-3/4"></div>
                          <div className="flex gap-2">
                            <div className="h-6 bg-secondary rounded-full animate-pulse w-16"></div>
                            <div className="h-6 bg-secondary rounded-full animate-pulse w-20"></div>
                          </div>
                          <div className="h-10 bg-secondary rounded animate-pulse"></div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : filteredWorkouts.length > 0 ? (
                filteredWorkouts.map((workout, index) => (
                  <motion.div
                    key={workout.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <WorkoutCard 
                      workout={workout} 
                      onSelect={() => setSelectedWorkout(workout)}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Dumbbell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Workouts Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {filter === "all" 
                      ? hasCoach 
                        ? "Your coach hasn't assigned any workouts yet." 
                        : "You haven't created any workouts yet."
                      : `No ${filter} workouts available.`}
                  </p>
                  {!hasCoach && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Workout
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Load More Button */}
            {hasNextPage && !showFullPageLoader && (
              <div className="flex justify-center">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Load More Workouts
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Workout Detail Modal (for clients with coaches) */}
      {hasCoach && (
        <WorkoutDetailModal
          workout={selectedWorkout}
          isOpen={!!selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
          onWorkoutLogged={handleWorkoutLogged}
        />
      )}

      {/* Workout History Dialog */}
      <WorkoutHistoryDialog
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        workoutLogs={workoutLogs}
        workouts={workouts}
      />

      {/* Create Workout Dialog (for self-managed clients) */}
      {!hasCoach && (
        <CreateWorkoutDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onWorkoutCreated={handleWorkoutCreated}
          isClientSelfManaged={true}
        />
      )}
    </div>
  );
}
