import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Utensils, Calendar, TrendingUp, Zap, Play, Clock, Pill, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { useUser } from "../components/contexts/UserContext";

export default function ClientDashboard() {
  const { user, isLoading: userLoading } = useUser();
  const [todaysWorkout, setTodaysWorkout] = useState(null);

  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.Workout.filter({ client_id: user.id });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: nutritionPlans = [] } = useQuery({
    queryKey: ['nutritionPlans', user?.id],
    queryFn: async () => {
      if (!user || !user.coach_id) return [];
      return base44.entities.NutritionPlan.filter({ 
        client_id: user.id, 
        coach_id: user.coach_id 
      }, "-created_date");
    },
    enabled: !!user && !!user.coach_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: supplementPlans = [] } = useQuery({
    queryKey: ['supplementPlans', user?.id],
    queryFn: async () => {
      if (!user || !user.coach_id) return [];
      return base44.entities.SupplementPlan.filter({ 
        client_id: user.id, 
        coach_id: user.coach_id 
      }, "-created_date");
    },
    enabled: !!user && !!user.coach_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.CheckIn.filter({ client_id: user.id }, "-created_date", 1);
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  // FIX: Get actual completed workouts from WorkoutLog
  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workoutLogs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.WorkoutLog.filter({ client_id: user.id });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const stats = {
    totalWorkouts: workouts.length,
    completedWorkouts: workoutLogs.length, // FIX: Use actual logged workouts
    currentNutritionPlan: nutritionPlans.length > 0 ? nutritionPlans[0] : null,
    currentSupplementPlan: supplementPlans.length > 0 ? supplementPlans[0] : null,
    lastCheckIn: checkIns.length > 0 ? checkIns[0] : null
  };

  useEffect(() => {
    if (workouts.length > 0) {
      setTodaysWorkout(workouts[0]);
    }
  }, [workouts]);

  const statsCards = [
    {
      title: "Total Workouts",
      value: stats.totalWorkouts,
      icon: Dumbbell,
      gradient: "from-gray-600 to-gray-800",
      subtitle: "Programs assigned"
    },
    {
      title: "Completed",
      value: stats.completedWorkouts,
      icon: TrendingUp,
      gradient: "from-gray-600 to-gray-800",
      subtitle: "Workouts finished"
    },
    {
      title: "Nutrition Plan",
      value: stats.currentNutritionPlan ? "Active" : "None",
      icon: Utensils,
      gradient: "from-gray-700 to-gray-800",
      subtitle: stats.currentNutritionPlan?.name || "Not assigned"
    },
    {
      title: "Supplement Plan",
      value: stats.currentSupplementPlan ? "Active" : "None",
      icon: Pill,
      gradient: "from-gray-700 to-gray-800",
      subtitle: stats.currentSupplementPlan?.name || "Not assigned"
    },
    {
      title: "Last Check-in",
      value: stats.lastCheckIn ? new Date(stats.lastCheckIn.created_date).toLocaleDateString() : "Never",
      icon: Calendar,
      gradient: "from-gray-700 to-gray-800",
      subtitle: "Progress update"
    }
  ];

  const isLoading = userLoading;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-8 animate-pulse">
        <div className="h-10 bg-secondary rounded w-1/2"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-secondary rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-gray-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Welcome back, {user?.full_name?.split(' ')[0]}
            </h1>
          </div>
          <p className="text-muted-foreground">Ready to crush your fitness goals today?</p>
        </div>
        <div className="flex gap-3">
          {user?.coach_id && (
            <Link to={createPageUrl("ClientChat")}>
              <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Coach
              </Button>
            </Link>
          )}
          <Link to={createPageUrl("CheckInJournal")}>
            <Button className="bg-gray-800 hover:bg-gray-700 text-white font-semibold">
              <Calendar className="w-4 h-4 mr-2" />
              Check In
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-gray-400 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} bg-opacity-20`}>
                    <stat.icon className={`w-6 h-6 text-gray-200`} />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.subtitle}</div>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-foreground/80">{stat.title}</h3>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-card/50 to-secondary/50 backdrop-blur-xl border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-gray-600" />
                Today's Workout
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysWorkout ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{todaysWorkout.name}</h3>
                    <p className="text-muted-foreground">{todaysWorkout.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-foreground/80">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {todaysWorkout.estimated_duration} min
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {todaysWorkout.difficulty_level}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Exercises ({todaysWorkout.exercises?.length || 0})</h4>
                    {todaysWorkout.exercises?.slice(0, 3).map((exercise, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-foreground/80">{exercise.exercise_name}</span>
                        <span className="text-muted-foreground">{exercise.sets} x {exercise.reps}</span>
                      </div>
                    ))}
                    {(todaysWorkout.exercises?.length || 0) > 3 && (
                      <div className="text-sm text-muted-foreground">+{todaysWorkout.exercises.length - 3} more exercises</div>
                    )}
                  </div>

                  <Link to={createPageUrl("MyWorkouts")}>
                    <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold">
                      <Play className="w-4 h-4 mr-2" />
                      Start Workout
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No workout assigned today</p>
                  <p className="text-sm">Check with your coach for your program</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <Card className="bg-gradient-to-br from-card/50 to-secondary/50 backdrop-blur-xl border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Utensils className="w-5 h-5 text-gray-600" />
                Nutrition Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.currentNutritionPlan ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{stats.currentNutritionPlan.name}</h3>
                    <div className="text-2xl font-bold text-gray-700">
                      {stats.currentNutritionPlan.daily_calories} cal/day
                    </div>
                  </div>
                  
                  {stats.currentNutritionPlan.macros && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{stats.currentNutritionPlan.macros.protein_grams}g</div>
                        <div className="text-xs text-muted-foreground">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{stats.currentNutritionPlan.macros.carbs_grams}g</div>
                        <div className="text-xs text-muted-foreground">Carbs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{stats.currentNutritionPlan.macros.fat_grams}g</div>
                        <div className="text-xs text-muted-foreground">Fat</div>
                      </div>
                    </div>
                  )}

                  <Link to={createPageUrl("MyNutrition")}>
                    <Button variant="outline" className="w-full border-border text-foreground hover:bg-secondary">
                      View Full Plan
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Utensils className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No nutrition plan assigned</p>
                  <p className="text-sm">Your coach will create one for you</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card/50 to-secondary/50 backdrop-blur-xl border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Pill className="w-5 h-5 text-gray-600" />
                Supplement Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.currentSupplementPlan ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{stats.currentSupplementPlan.name}</h3>
                    <div className="text-lg font-semibold text-gray-700">
                      {stats.currentSupplementPlan.supplements?.length || 0} supplements
                    </div>
                  </div>
                  
                  {stats.currentSupplementPlan.supplements && stats.currentSupplementPlan.supplements.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">Includes:</h4>
                      {stats.currentSupplementPlan.supplements.slice(0, 3).map((supplement, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-foreground/80">{supplement.name}</span>
                          <span className="text-muted-foreground">{supplement.dosage}</span>
                        </div>
                      ))}
                      {stats.currentSupplementPlan.supplements.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          +{stats.currentSupplementPlan.supplements.length - 3} more...
                        </div>
                      )}
                    </div>
                  )}

                  <Link to={createPageUrl("MySupplements")}>
                    <Button variant="outline" className="w-full border-border text-foreground hover:bg-secondary">
                      View Full Plan
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No supplement plan assigned</p>
                  <p className="text-sm">Your coach will create one for you</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}