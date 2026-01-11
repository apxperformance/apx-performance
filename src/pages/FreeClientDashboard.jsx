import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Utensils, Calendar, TrendingUp, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function FreeClientDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    completedWorkouts: 0,
    currentNutritionPlan: null,
    lastCheckIn: null
  });
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const [workouts, nutritionPlans, checkIns] = await Promise.all([
        base44.entities.Workout.filter({ client_id: userData.id }),
        base44.entities.NutritionPlan.filter({ client_id: userData.id }),
        base44.entities.CheckIn.filter({ client_id: userData.id }, "-created_date", 1)
      ]);
      
      const currentPlan = nutritionPlans.length > 0 ? nutritionPlans[0] : null;
      const lastCheckIn = checkIns.length > 0 ? checkIns[0] : null;

      setStats({
        totalWorkouts: workouts.length,
        completedWorkouts: 0, // This currently defaults to 0 and needs logic to calculate actual completed workouts
        currentNutritionPlan: currentPlan,
        lastCheckIn
      });

      setTodaysWorkout(workouts.length > 0 ? workouts[0] : null); // This currently picks the first workout
      
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
    setIsLoading(false);
  };

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
      title: "Last Check-in",
      value: stats.lastCheckIn ? new Date(stats.lastCheckIn.created_date).toLocaleDateString() : "Never",
      icon: Calendar,
      gradient: "from-gray-700 to-gray-800",
      subtitle: "Progress update"
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Upgrade Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gray-100/50 border border-gray-300">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="p-3 bg-gray-200 rounded-full flex-shrink-0">
              <Crown className="w-8 h-8 text-gray-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">Unlock Your Full Potential!</h2>
              <p className="text-muted-foreground">
                You are currently on a free plan. Connect with one of our elite coaches to get personalized workouts, nutrition plans, and expert guidance.
              </p>
            </div>
            <Link to={createPageUrl("BrowseCoaches")}>
              <Button className="bg-gray-800 hover:bg-gray-700 text-white font-semibold mt-2 md:mt-0">
                Find a Coach
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-gray-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Welcome, {user?.full_name?.split(' ')[0]}
            </h1>
          </div>
          <p className="text-muted-foreground">Ready to crush your fitness goals today?</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl("CheckInJournal")}>
            <Button className="bg-gray-800 hover:bg-gray-700 text-white font-semibold">
              <Calendar className="w-4 h-4 mr-2" />
              Check In
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Today's Focus - Shown as empty state */}
      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-card/50 to-secondary/50 backdrop-blur-xl border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-gray-600" />
                Today's Workout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No workout assigned today</p>
                <p className="text-sm">Connect with a coach to get your program</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-card/50 to-secondary/50 backdrop-blur-xl border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Utensils className="w-5 h-5 text-gray-600" />
                Nutrition Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Utensils className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No nutrition plan assigned</p>
                <p className="text-sm">Your coach will create one for you</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}