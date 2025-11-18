
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Dumbbell, Utensils, Pill, Calendar, TrendingUp, Target, MessageCircle, Edit, Plus, Eye, CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import SupplementComplianceHistory from "../components/supplements/SupplementComplianceHistory";
import SkeletonCard from "../components/ui/skeleton-card";
import EmptyState from "../components/ui/empty-state";

// Helper component for displaying client status badge
const StatusBadge = ({ status }) => {
  let className = '';
  let text = status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN';

  switch (status) {
    case 'active':
      className = 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30';
      break;
    case 'paused':
      className = 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      break;
    case 'inactive':
      className = 'bg-red-500/20 text-red-500 border-red-500/30';
      break;
    case 'pending':
      className = 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      break;
    default:
      className = 'bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30';
      break;
  }

  return (
    <Badge className={className}>
      {text}
    </Badge>
  );
};

export default function ClientProfile() {
  const [client, setClient] = useState(null);
  const [clientUser, setClientUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [supplementPlan, setSupplementPlan] = useState(null);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [todaysCompliance, setTodaysCompliance] = useState(null);
  const [complianceHistory, setComplianceHistory] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loggedMeals, setLoggedMeals] = useState([]);
  const [nutritionStats, setNutritionStats] = useState(null);
  
  // Separate loading states for better UX
  const [loadingStates, setLoadingStates] = useState({
    client: true,
    workouts: true,
    nutrition: true,
    supplements: true,
    checkIns: true,
    logs: true,
    meals: true
  });
  
  const [errors, setErrors] = useState({
    client: null,
    workouts: null,
    nutrition: null,
    supplements: null,
    checkIns: null,
    logs: null,
    meals: null
  });

  useEffect(() => {
    loadClientData();
  }, []);

  const updateLoadingState = (key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const updateError = (key, error) => {
    setErrors(prev => ({ ...prev, [key]: error }));
    if (error) {
      console.error(`Error loading ${key}:`, error);
    }
  };

  const loadClientData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const clientId = urlParams.get('clientId');
      
      if (!clientId) {
        updateError('client', 'No client ID provided');
        updateLoadingState('client', false);
        toast.error("No client ID provided");
        return;
      }

      // Load client data first (critical)
      try {
        const clientData = await base44.entities.Client.filter({ id: clientId });
        if (clientData.length === 0) {
          updateError('client', 'Client not found');
          updateLoadingState('client', false);
          toast.error("Client not found");
          return;
        }
        
        const clientRecord = clientData[0];
        setClient(clientRecord);
        updateLoadingState('client', false);

        // Load user data if available
        if (clientRecord.user_id) {
          try {
            const userData = await base44.entities.User.filter({ id: clientRecord.user_id });
            if (userData.length > 0) {
              setClientUser(userData[0]);
            }
          } catch (error) {
            console.log("Client user data not accessible, continuing without it");
          }
        }

        // Load all other data in parallel with individual error handling
        loadWorkouts(clientId);
        loadNutritionData(clientId);
        loadSupplementData(clientId);
        loadCheckIns(clientId);
        loadWorkoutLogs(clientId);
        loadMealData(clientId);

      } catch (error) {
        updateError('client', 'Failed to load client data');
        updateLoadingState('client', false);
        toast.error("Failed to load client profile");
      }

    } catch (error) {
      console.error("Unexpected error in loadClientData:", error);
      updateError('client', 'An unexpected error occurred');
      updateLoadingState('client', false);
    }
  };

  const loadWorkouts = async (clientId) => {
    try {
      const workoutData = await base44.entities.Workout.filter({ client_id: clientId }, "-created_date");
      setWorkouts(workoutData);
      updateLoadingState('workouts', false);
    } catch (error) {
      updateError('workouts', 'Failed to load workouts');
      updateLoadingState('workouts', false);
      setWorkouts([]);
    }
  };

  const loadNutritionData = async (clientId) => {
    try {
      const nutritionData = await base44.entities.NutritionPlan.filter({ client_id: clientId }, "-created_date", 1);
      setNutritionPlan(nutritionData.length > 0 ? nutritionData[0] : null);
      updateLoadingState('nutrition', false);
    } catch (error) {
      updateError('nutrition', 'Failed to load nutrition plan');
      updateLoadingState('nutrition', false);
      setNutritionPlan(null);
    }
  };

  const loadSupplementData = async (clientId) => {
    try {
      const supplementData = await base44.entities.SupplementPlan.filter({ client_id: clientId }, "-created_date", 1);
      const clientSupplementPlan = supplementData.length > 0 ? supplementData[0] : null;
      setSupplementPlan(clientSupplementPlan);
      
      // Load compliance if plan exists
      if (clientSupplementPlan) {
        try {
          const today = format(new Date(), 'yyyy-MM-dd');
          const allCompliance = await base44.entities.SupplementCompliance.filter({
            client_id: clientId,
            supplement_plan_id: clientSupplementPlan.id
          }, "-date");
          
          setComplianceHistory(allCompliance);
          
          const todayCompliance = allCompliance.find(c => c.date === today);
          if (todayCompliance) {
            setTodaysCompliance(todayCompliance);
          }
        } catch (complianceError) {
          console.log("Failed to load supplement compliance, continuing without it");
        }
      }
      
      updateLoadingState('supplements', false);
    } catch (error) {
      updateError('supplements', 'Failed to load supplement plan');
      updateLoadingState('supplements', false);
      setSupplementPlan(null);
    }
  };

  const loadCheckIns = async (clientId) => {
    try {
      const checkInData = await base44.entities.CheckIn.filter({ client_id: clientId }, "-created_date", 5);
      setRecentCheckIns(checkInData);
      updateLoadingState('checkIns', false);
    } catch (error) {
      updateError('checkIns', 'Failed to load check-ins');
      updateLoadingState('checkIns', false);
      setRecentCheckIns([]);
    }
  };

  const loadWorkoutLogs = async (clientId) => {
    try {
      const workoutLogData = await base44.entities.WorkoutLog.filter({ client_id: clientId }, "-completed_date", 10);
      setWorkoutLogs(workoutLogData);
      updateLoadingState('logs', false);
    } catch (error) {
      updateError('logs', 'Failed to load workout logs');
      updateLoadingState('logs', false);
      setWorkoutLogs([]);
    }
  };

  const loadMealData = async (clientId) => {
    try {
      const mealData = await base44.entities.LoggedMeal.filter({ client_id: clientId }, "-date", 30);
      setLoggedMeals(mealData);
      
      // Calculate nutrition stats safely
      calculateNutritionStats(mealData);
      
      updateLoadingState('meals', false);
    } catch (error) {
      updateError('meals', 'Failed to load meal data');
      updateLoadingState('meals', false);
      setLoggedMeals([]);
      setNutritionStats(null);
    }
  };

  const calculateNutritionStats = (mealData) => {
    try {
      if (!mealData || mealData.length === 0) {
        setNutritionStats({
          daysTracked: 0,
          thisWeekMealsCount: 0,
          avgCalories: 0,
          avgProtein: 0,
          avgCarbs: 0,
          avgFat: 0,
        });
        return;
      }

      // Calculate unique days logged
      const uniqueDaysLogged = new Set(
        mealData.map(m => {
          try {
            return format(new Date(m.date), 'yyyy-MM-dd');
          } catch (e) {
            return null;
          }
        }).filter(Boolean)
      ).size;

      // Filter meals from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const thisWeekMeals = mealData.filter(m => {
        try {
          const mealDate = new Date(m.date);
          return mealDate >= sevenDaysAgo && mealDate <= new Date();
        } catch (e) {
          return false;
        }
      });

      // Calculate weekly totals with safe fallbacks
      const weeklyTotals = thisWeekMeals.reduce((acc, meal) => {
        acc.calories += Number(meal.total_calories) || 0;
        acc.protein += Number(meal.total_protein_grams) || 0;
        acc.carbs += Number(meal.total_carbs_grams) || 0;
        acc.fat += Number(meal.total_fat_grams) || 0;
        
        try {
          const dateStr = format(new Date(meal.date), 'yyyy-MM-dd');
          acc.days.add(dateStr);
        } catch (e) {
          // Skip invalid dates
        }
        
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, days: new Set() });

      const daysLoggedThisWeek = weeklyTotals.days.size;
      const effectiveDays = daysLoggedThisWeek > 0 ? daysLoggedThisWeek : 1;

      setNutritionStats({
        daysTracked: uniqueDaysLogged,
        thisWeekMealsCount: thisWeekMeals.length,
        avgCalories: Math.round(weeklyTotals.calories / effectiveDays) || 0,
        avgProtein: Math.round(weeklyTotals.protein / effectiveDays) || 0,
        avgCarbs: Math.round(weeklyTotals.carbs / effectiveDays) || 0,
        avgFat: Math.round(weeklyTotals.fat / effectiveDays) || 0,
      });
    } catch (error) {
      console.error("Error calculating nutrition stats:", error);
      setNutritionStats({
        daysTracked: 0,
        thisWeekMealsCount: 0,
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0,
      });
    }
  };

  // Show error state if client failed to load
  if (errors.client) {
    return (
      <div className="p-6 md:p-8">
        <EmptyState
          icon={AlertTriangle}
          title="Unable to Load Client Profile"
          description={errors.client}
          action={
            <Link to={createPageUrl("ClientManagement")}>
              <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Client Management
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Show loading state for client
  if (loadingStates.client || !client) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-secondary rounded-full"></div>
            <div className="flex-1">
              <div className="h-8 bg-secondary rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-secondary rounded w-1/4"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} variant="stat-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const latestCheckIn = recentCheckIns.length > 0 ? recentCheckIns[0] : null;
  
  // Calculate compliance percentage safely
  const compliancePercentage = todaysCompliance && supplementPlan && supplementPlan.supplements && supplementPlan.supplements.length > 0 ? 
    Math.round((todaysCompliance.supplements_taken.length / supplementPlan.supplements.length) * 100) : 0;

  // Workout stats
  const thisWeekWorkouts = workoutLogs.filter(log => {
    try {
      const logDate = new Date(log.completed_date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return logDate > weekAgo;
    } catch (e) {
      return false;
    }
  });

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Link to={createPageUrl("ClientManagement")}>
          <Button variant="ghost" size="icon" className="hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Button>
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 bg-gradient-to-r from-[#C5B358] to-[#A4913C] rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-xl">
              {client.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{client.full_name}</h1>
            <p className="text-muted-foreground">{client.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={client.status} />
              {/* Show last check-in timestamp */}
              {client.last_checkin && (
                <Badge variant="outline" className="border-border text-muted-foreground">
                  <Calendar className="w-3 h-3 mr-1" />
                  Last check-in: {format(new Date(client.last_checkin), 'MMM d, yyyy')}
                </Badge>
              )}
            </div>
          </div>
          <Link to={`${createPageUrl("ClientChat")}?clientId=${client.id}`}>
            <Button className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {loadingStates.logs ? (
            <SkeletonCard variant="stat-card" />
          ) : (
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardContent className="p-6 text-center">
                <Dumbbell className="w-8 h-8 mx-auto mb-3 text-[#C5B358]" />
                <div className="text-2xl font-bold text-foreground">{thisWeekWorkouts.length}</div>
                <div className="text-sm text-muted-foreground">Workouts This Week</div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loadingStates.checkIns ? (
            <SkeletonCard variant="stat-card" />
          ) : (
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                <div className="text-2xl font-bold text-foreground">{recentCheckIns.length}</div>
                <div className="text-sm text-muted-foreground">Total Check-ins</div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {loadingStates.checkIns ? (
            <SkeletonCard variant="stat-card" />
          ) : (
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-3 text-[hsl(var(--success))]" />
                <div className="text-2xl font-bold text-foreground">
                  {latestCheckIn?.weight || clientUser?.current_weight || '---'}
                </div>
                <div className="text-sm text-muted-foreground">Current Weight (lbs)</div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {loadingStates.logs ? (
            <SkeletonCard variant="stat-card" />
          ) : (
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-foreground" />
                <div className="text-2xl font-bold text-foreground">{workoutLogs.length}</div>
                <div className="text-sm text-muted-foreground">Total Workouts Logged</div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Plans Overview */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Workout Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {loadingStates.workouts ? (
            <SkeletonCard />
          ) : (
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-[#C5B358]" />
                  Workout Plans
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workouts.length > 0 ? (
                  <div className="space-y-3">
                    {workouts.slice(0, 3).map((workout) => (
                      <div key={workout.id} className="p-3 bg-secondary/50 rounded-lg">
                        <div className="font-medium text-foreground">{workout.name}</div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{workout.difficulty_level}</span>
                          <span>{workout.estimated_duration} min</span>
                          <span>{workout.exercises?.length || 0} exercises</span>
                        </div>
                      </div>
                    ))}
                    {workouts.length > 3 && (
                      <div className="text-sm text-muted-foreground text-center">
                        +{workouts.length - 3} more workouts
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    icon={Dumbbell}
                    title="No Workouts"
                    description="No workouts assigned yet"
                    compact
                  />
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Nutrition Plan with Adherence Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {loadingStates.nutrition || loadingStates.meals ? (
            <SkeletonCard />
          ) : (
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[#C5B358]" />
                  Nutrition Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nutritionPlan ? (
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium text-foreground">{nutritionPlan.name}</div>
                      <div className="text-2xl font-bold text-[#C5B358] mt-2">
                        {nutritionPlan.daily_calories} cal/day
                      </div>
                    </div>
                    
                    {nutritionPlan.macros && (
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <div className="font-semibold text-foreground">{nutritionPlan.macros.protein_grams}g</div>
                          <div className="text-muted-foreground">Protein</div>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{nutritionPlan.macros.carbs_grams}g</div>
                          <div className="text-muted-foreground">Carbs</div>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{nutritionPlan.macros.fat_grams}g</div>
                          <div className="text-muted-foreground">Fat</div>
                        </div>
                      </div>
                    )}

                    {/* Nutrition Tracking Stats */}
                    {nutritionStats && nutritionStats.daysTracked > 0 && (
                      <>
                        <div className="pt-3 border-t border-border mt-4">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2">TRACKING ADHERENCE</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-foreground">Days Tracked:</span>
                              <span className="font-semibold text-[#C5B358]">{nutritionStats.daysTracked}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-foreground">This Week (meals):</span>
                              <span className="font-semibold text-foreground">{nutritionStats.thisWeekMealsCount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border mt-4">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2">WEEKLY AVERAGES</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-card/50 p-2 rounded">
                              <div className="text-muted-foreground">Avg Calories</div>
                              <div className="font-semibold text-foreground">{nutritionStats.avgCalories}</div>
                            </div>
                            <div className="bg-card/50 p-2 rounded">
                              <div className="text-muted-foreground">Avg Protein</div>
                              <div className="font-semibold text-foreground">{nutritionStats.avgProtein}g</div>
                            </div>
                            <div className="bg-card/50 p-2 rounded">
                              <div className="text-muted-foreground">Avg Carbs</div>
                              <div className="font-semibold text-foreground">{nutritionStats.avgCarbs}g</div>
                            </div>
                            <div className="bg-card/50 p-2 rounded">
                              <div className="text-muted-foreground">Avg Fat</div>
                              <div className="font-semibold text-foreground">{nutritionStats.avgFat}g</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="text-sm text-muted-foreground mt-4">
                      {nutritionPlan.meals?.length || 0} meals planned
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={Utensils}
                    title="No Nutrition Plan"
                    description="No nutrition plan assigned yet"
                    compact
                  />
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Supplement Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {loadingStates.supplements ? (
            <SkeletonCard />
          ) : (
            <Card className={`backdrop-blur-xl ${supplementPlan ? 'bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30' : 'bg-card/50 border-border'}`}>
              <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-purple-500" />
                    Supplement Plan
                  </div>
                  {supplementPlan && (
                    <div className="flex items-center gap-2">
                      <Link to={`${createPageUrl("SupplementPlanner")}?planId=${supplementPlan.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link to={`${createPageUrl("SupplementPlanner")}?planId=${supplementPlan.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {supplementPlan ? (
                  <div className="space-y-4">
                    {/* Plan Name & Count */}
                    <div>
                      <div className="font-semibold text-lg text-foreground">{supplementPlan.name}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="text-2xl font-bold text-purple-500">
                          {supplementPlan.supplements?.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">supplements</div>
                      </div>
                    </div>
                    
                    {/* Today's Compliance */}
                    {todaysCompliance && (
                      <div className="bg-card/50 rounded-lg p-3 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-muted-foreground">TODAY'S COMPLIANCE</div>
                          {compliancePercentage === 100 && (
                            <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${compliancePercentage === 100 ? 'bg-[hsl(var(--success))]' : 'bg-purple-500'}`}
                              style={{ width: `${compliancePercentage}%` }}
                            />
                          </div>
                          <div className="text-sm font-bold text-foreground">{compliancePercentage}%</div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {todaysCompliance.supplements_taken.length} of {(supplementPlan.supplements && supplementPlan.supplements.length) || 0} taken
                        </div>
                      </div>
                    )}
                    
                    {/* Supplement List */}
                    {supplementPlan.supplements && supplementPlan.supplements.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">Current Stack:</h4>
                        <div className="space-y-2">
                          {supplementPlan.supplements.slice(0, 4).map((supplement, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm p-2 bg-card/30 rounded">
                              <div className="flex items-center gap-2 flex-1">
                                <Pill className="w-3 h-3 text-purple-500 flex-shrink-0" />
                                <span className="text-foreground/90 font-medium truncate">{supplement.name}</span>
                              </div>
                              <span className="text-muted-foreground text-xs ml-2">{supplement.dosage}</span>
                            </div>
                          ))}
                        </div>
                        {supplementPlan.supplements.length > 4 && (
                          <div className="text-xs text-muted-foreground text-center pt-1">
                            +{supplementPlan.supplements.length - 4} more supplements
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Link to={`${createPageUrl("SupplementPlanner")}?planId=${supplementPlan.id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-purple-500/30 text-foreground hover:bg-purple-500/10">
                          <Eye className="w-4 h-4 mr-2" />
                          View Full Plan
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={Pill}
                    title="No Supplement Plan"
                    description="No supplement plan assigned yet"
                    action={
                      <Link to={createPageUrl("SupplementPlanner")}>
                        <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Plan
                        </Button>
                      </Link>
                    }
                    compact
                  />
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Supplement Compliance History Section */}
      {supplementPlan && complianceHistory.length > 0 && !loadingStates.supplements && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Pill className="w-6 h-6 text-purple-500" />
            Supplement Compliance History
          </h2>
          <SupplementComplianceHistory 
            complianceRecords={complianceHistory}
            supplementPlan={supplementPlan}
          />
        </motion.div>
      )}

      {/* Progress & Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Workouts */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
        >
          {loadingStates.logs ? (
            <SkeletonCard />
          ) : (
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-[#C5B358]" />
                  Recent Workouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workoutLogs.length > 0 ? (
                  <div className="space-y-3">
                    {workoutLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="p-3 bg-secondary/50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-foreground">{log.workout_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(log.completed_date), 'MMM d')}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{log.duration_minutes} min</span>
                          <span>RPE: {log.overall_rpe}/10</span>
                          <span>{log.exercises.filter(ex => ex.completed).length}/{log.exercises.length} exercises</span>
                        </div>
                        {log.notes && (
                          <p className="text-xs text-muted-foreground italic mt-2 truncate">"{log.notes}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Dumbbell}
                    title="No Workouts Logged"
                    description="No workouts logged yet"
                    compact
                  />
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Recent Check-Ins */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0 }}
        >
          {loadingStates.checkIns ? (
            <SkeletonCard />
          ) : (
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#C5B358]" />
                  Recent Check-Ins
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentCheckIns.length > 0 ? (
                  <div className="space-y-4">
                    {recentCheckIns.map((checkIn) => (
                      <div key={checkIn.id} className="p-3 bg-secondary/50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-medium text-foreground">
                            {format(new Date(checkIn.created_date), 'MMM d, yyyy')}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-foreground">{checkIn.weight} lbs</div>
                            <div className="text-xs text-muted-foreground">Energy: {checkIn.energy_level}/10</div>
                          </div>
                        </div>
                        {checkIn.notes && (
                          <p className="text-xs text-muted-foreground italic truncate">"{checkIn.notes}"</p>
                        )}
                        {checkIn.coach_feedback ? (
                          <Badge className="bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30 mt-2">
                            Reviewed
                          </Badge>
                        ) : (
                          <Badge className="bg-[hsl(var(--destructive))]/20 text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/30 mt-2">
                            Needs Review
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title="No Check-ins"
                    description="No check-ins logged yet"
                    compact
                  />
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Recent Food Logs */}
      {loggedMeals.length > 0 && !loadingStates.meals && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#C5B358]" />
                Recent Food Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loggedMeals.slice(0, 7).map((meal) => (
                  <div key={meal.id} className="p-3 bg-secondary/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-foreground">{meal.meal_type}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(meal.date), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#C5B358]">{Math.round(meal.total_calories || 0)} cal</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(meal.total_protein_grams || 0)}p / {Math.round(meal.total_carbs_grams || 0)}c / {Math.round(meal.total_fat_grams || 0)}f
                        </div>
                      </div>
                    </div>
                    {meal.foods && meal.foods.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {meal.foods.slice(0, 3).map((food) => food.name).join(', ')}
                        {meal.foods.length > 3 && ` +${meal.foods.length - 3} more`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
