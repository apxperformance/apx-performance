
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, UtensilsCrossed, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays, addDays, isAfter, startOfDay, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { useUser } from "../components/contexts/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import DailySummary from "../components/foodtracker/DailySummary";
import MealGroup from "../components/foodtracker/MealGroup";
import LogMealDialog from "../components/foodtracker/LogMealDialog";
import EmptyState from "../components/ui/empty-state";
import SkeletonCard from "../components/ui/skeleton-card";

// Define MEAL_TYPES as suggested by the outline's MealGroup mapping
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function FoodTracker() {
  const { user, isLoading: userLoading } = useUser();
  const [loggedMeals, setLoggedMeals] = useState([]); // This will be passed as 'todayMeals' to MealGroup in the outline
  const [nutritionGoals, setNutritionGoals] = useState(null);
  const [date, setDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isLogMealOpen, setIsLogMealOpen] = useState(false);
  const [hasNutritionPlan, setHasNutritionPlan] = useState(false);
  // New state for editing a meal
  const [editingMeal, setEditingMeal] = useState(null);

  // Track the latest request to prevent race conditions
  const latestRequestRef = useRef(0);
  const abortControllerRef = useRef(null);

  const formattedDate = format(date, "yyyy-MM-dd");
  const today = startOfDay(new Date());
  const selectedDate = startOfDay(date); // Date object, as requested by outline for MealGroup prop
  const isToday = selectedDate.getTime() === today.getTime();
  const isFutureDate = isAfter(selectedDate, today);
  const isPastDate = !isToday && !isFutureDate;
  const daysAgo = isPastDate ? differenceInDays(today, selectedDate) : 0;

  // This function now effectively serves as the `refetch()` mentioned in the outline for `handleMealChange`.
  const loadData = useCallback(async () => {
    if (!user) return;
    
    // Abort any pending request from a previous date change
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Increment and track request ID
    const requestId = ++latestRequestRef.current;
    
    setIsLoading(true);
    try {
      const [mealsData, planData] = await Promise.all([
        // Ensure signal is passed correctly
        base44.entities.LoggedMeal.filter({ client_id: user.id, date: formattedDate }, { signal: abortController.signal }),
        user.coach_id ? 
          base44.entities.NutritionPlan.filter({ client_id: user.id, coach_id: user.coach_id }, "-created_date", 1, { signal: abortController.signal }) : 
          Promise.resolve([])
      ]);

      // Only update state if this is still the latest request and not aborted
      if (requestId === latestRequestRef.current && !abortController.signal.aborted) {
        setLoggedMeals(mealsData); // This array now represents `todayMeals` from the outline
        
        if (planData.length > 0) {
          setHasNutritionPlan(true);
          setNutritionGoals({
            calories: planData[0].daily_calories,
            protein: planData[0].macros.protein_grams,
            carbs: planData[0].macros.carbs_grams,
            fat: planData[0].macros.fat_grams
          });
        } else {
          setHasNutritionPlan(false);
          setNutritionGoals(null);
        }
      }
    } catch (error) {
      // Don't show error if request was aborted (expected behavior for race condition handling)
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        console.log("Request aborted (date changed)");
        return;
      }
      
      // Only show error if this was the latest request that failed for other reasons
      if (requestId === latestRequestRef.current) {
        console.error("Error loading food tracker data:", error);
        toast.error("Failed to load food data. Please try again.");
      }
    } finally {
      // Only clear loading state if this is still the latest request (or if it was the one that completed)
      if (requestId === latestRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [formattedDate, user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
    
    // Cleanup: abort any pending request when the component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData, user]);

  const dailyTotals = useMemo(() => {
    return loggedMeals.reduce((totals, meal) => {
      totals.calories += meal.total_calories || 0;
      totals.protein += meal.total_protein_grams || 0;
      totals.carbs += meal.total_carbs_grams || 0;
      totals.fat += meal.total_fat_grams || 0;
      totals.fiber += meal.total_fiber_grams || 0;
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  }, [loggedMeals]);

  // `mealsByType` is no longer directly used for rendering MealGroup
  // because the outline implies `MealGroup` receives all meals and filters internally.
  // However, it's still useful if other components consume meals by type, so we keep it.
  const mealsByType = useMemo(() => {
    return loggedMeals.reduce((acc, meal) => {
      const type = meal.meal_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push({
        ...meal,
        foods: meal.foods || []
      });
      return acc;
    }, {});
  }, [loggedMeals]);

  // This handles both new meal logging and meal editing completion.
  // It corresponds to the `handleMealChange` from the outline.
  const handleMealChange = useCallback(() => {
    setIsLogMealOpen(false);
    setEditingMeal(null); // Clear editing meal state
    loadData(); // Refetch all data after any meal change (add/edit)
  }, [loadData]);

  // This handles deletion and then refreshes data, consistent with `onMealDeleted={handleMealChange}`
  const handleDeleteMeal = useCallback(async (mealId) => {
    try {
      const loadingToast = toast.loading("Deleting meal...");
      
      await base44.entities.LoggedMeal.delete(mealId);
      
      toast.dismiss(loadingToast);
      toast.success("Meal deleted successfully");
      
      handleMealChange(); // Refresh data after deletion
    } catch (error) {
      console.error("Error deleting meal:", error);
      toast.error("Failed to delete meal. Please try again.");
    }
  }, [handleMealChange]);

  const handlePreviousDay = () => {
    setDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    const nextDate = addDays(date, 1);
    if (!isAfter(startOfDay(nextDate), today)) {
      setDate(nextDate);
    } else {
      toast.error("Cannot view future dates");
    }
  };

  const handleToday = () => {
    setDate(new Date());
  };

  const handleLogMealClick = () => {
    // Clear any editing meal data before opening for a new log
    setEditingMeal(null);
    if (isPastDate && daysAgo > 1) {
      toast.warning(`Logging meal for ${daysAgo} days ago`, {
        description: "Make sure to enter the correct date and meal information",
        duration: 4000,
      });
    }
    setIsLogMealOpen(true);
  };

  // New function to handle editing a meal, setting the meal to edit and opening the dialog
  const handleEditMeal = (meal) => {
    setEditingMeal(meal);
    setIsLogMealOpen(true);
  };

  if (userLoading) {
    return (
      <div className="p-6 md:p-8 space-y-8">
        <SkeletonCard />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 md:p-8">
        <EmptyState
          icon={UtensilsCrossed}
          title="Authentication Required"
          description="Please log in to track your meals"
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header with Date Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <UtensilsCrossed className="w-8 h-8 text-[#C5B358]" />
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Food Tracker</h1>
            </div>
            <p className="text-muted-foreground">Log your daily meals to track your nutrition.</p>
          </div>
          <Button
            onClick={handleLogMealClick}
            disabled={isFutureDate}
            className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Meal
          </Button>
        </div>

        {/* Date Selector */}
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousDay}
                className="border-border hover:bg-secondary"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="flex flex-col items-center gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#C5B358]" />
                  <h2 className="text-xl font-bold text-foreground">
                    {format(date, 'EEEE, MMMM d, yyyy')}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {isToday ? (
                    <Badge className="bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">
                      Today
                    </Badge>
                  ) : isFutureDate ? (
                    <Badge className="bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30">
                      Future Date - View Only
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        {daysAgo} day{daysAgo !== 1 ? 's' : ''} ago
                      </Badge>
                      {daysAgo > 1 && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Past Date
                        </Badge>
                      )}
                    </>
                  )}
                  {!isToday && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToday}
                      className="text-[#C5B358] hover:text-[#A4913C] hover:bg-[#C5B358]/10"
                    >
                      Jump to Today
                    </Button>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNextDay}
                disabled={isFutureDate}
                className="border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warning for future dates */}
        {isFutureDate && (
          <Card className="bg-[hsl(var(--warning))]/10 border-[hsl(var(--warning))]/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[hsl(var(--warning))] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--warning))]">
                    Cannot Log Future Meals
                  </p>
                  <p className="text-xs text-[hsl(var(--warning))]/80 mt-1">
                    You can only log meals for today or past dates. Use the date navigation to select a valid date.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning for logging on past dates (more than yesterday) */}
        {isPastDate && daysAgo > 1 && (
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-400">
                    Logging Past Meals
                  </p>
                  <p className="text-xs text-blue-400/80 mt-1">
                    You're logging meals from {daysAgo} days ago ({format(date, 'MMM d, yyyy')}). 
                    Double-check that the date is correct before adding meals. For best tracking accuracy, try to log meals on the same day you eat them.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {isLoading ? (
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          {/* No Nutrition Plan Warning */}
          {!hasNutritionPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Info className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No Nutrition Plan Assigned
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        You don't have a nutrition plan from your coach yet. You can still track your meals, 
                        but you won't see daily goals or macro targets until your coach assigns a plan.
                      </p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#C5B358] rounded-full"></span>
                          Track your meals to build good habits
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#C5B358] rounded-full"></span>
                          Your coach can review your eating patterns
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#C5B358] rounded-full"></span>
                          Goals will appear once a plan is assigned
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Daily Summary */}
          <DailySummary totals={dailyTotals} goals={nutritionGoals} />
          
          {/* Meal Groups */}
          {loggedMeals.length > 0 ? (
            <div className="grid gap-6">
              {MEAL_TYPES.map((mealType) => (
                <MealGroup
                  key={mealType}
                  mealType={mealType} // Changed to mealType prop as per outline
                  meals={loggedMeals} // Passed all loggedMeals as 'todayMeals' from outline
                  date={selectedDate} // Passed Date object as per outline
                  onMealAdded={handleMealChange} // This will trigger data refresh after new meal add from MealGroup
                  onMealDeleted={handleDeleteMeal} // Specific handler for deletion
                  onEditMeal={handleEditMeal} // New prop for triggering meal editing
                  isFutureDate={isFutureDate} // Pass future date status to disable add/edit/delete actions
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-card/50 backdrop-blur-xl border-border">
                <CardContent className="py-16">
                  <EmptyState
                    icon={UtensilsCrossed}
                    title={isFutureDate ? "No Meals to Display" : "No Meals Logged Today"}
                    description={
                      isFutureDate 
                        ? "Select today or a past date to log your meals" 
                        : isToday 
                          ? "Start tracking your nutrition by logging your first meal of the day"
                          : `No meals were logged on ${format(date, 'MMMM d, yyyy')}`
                    }
                    action={!isFutureDate && (
                      <Button
                        onClick={handleLogMealClick}
                        className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold mt-4"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {isPastDate ? `Log Meal for ${format(date, 'MMM d')}` : 'Log Your First Meal'}
                      </Button>
                    )}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}

      {user && (
        <LogMealDialog
          isOpen={isLogMealOpen}
          onClose={() => {
            setIsLogMealOpen(false);
            setEditingMeal(null); // Clear editing meal when dialog closes
          }}
          onMealLogged={handleMealChange} // This handles both new and edited meals completion
          user={user}
          date={formattedDate} // Pass formatted date for new entries (if editingMeal is null)
          isFutureDate={isFutureDate}
          editingMeal={editingMeal} // Pass the meal being edited to the dialog
        />
      )}
    </div>
  );
}
