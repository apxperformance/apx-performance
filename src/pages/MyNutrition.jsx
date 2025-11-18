
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Utensils, Info, TrendingUp, Plus, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useUser } from "../components/contexts/UserContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

import NutritionSummary from "../components/nutrition/NutritionSummary";
import MealCard from "../components/nutrition/MealCard";
import CreateNutritionPlanDialog from "../components/nutrition/CreateNutritionPlanDialog";
import ClientNutritionPlanDetailView from "../components/nutrition/ClientNutritionPlanDetailView";

export default function MyNutrition() {
  const { user, isLoading: userLoading, hasCoach } = useUser();
  const today = format(new Date(), 'yyyy-MM-dd');
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch nutrition plan with react-query
  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ['nutritionPlan', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const planData = await base44.entities.NutritionPlan.filter({ 
        client_id: user.id
      }, "-created_date", 1);
      
      return planData.length > 0 ? planData[0] : null;
    },
    enabled: !userLoading && !!user,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch today's logged meals
  const { data: loggedMeals = [] } = useQuery({
    queryKey: ['loggedMeals', user?.id, today],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.LoggedMeal.filter({ 
        client_id: user.id,
        date: today
      });
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000,
  });

  // Fetch recent logged meals (for streak tracking)
  const { data: recentMeals = [] } = useQuery({
    queryKey: ['recentMeals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.LoggedMeal.list("-date", 30);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const handlePlanCreated = (newPlan) => {
    queryClient.invalidateQueries({ queryKey: ['nutritionPlan', user?.id] });
    setIsCreateDialogOpen(false);
    toast.success("Nutrition plan created successfully!");
  };

  const handlePlanUpdated = (updatedPlan) => {
    queryClient.invalidateQueries({ queryKey: ['nutritionPlan', user?.id] });
    setIsEditMode(false);
    toast.success("Nutrition plan updated successfully!");
  };

  const handlePlanDeleted = async () => {
    // Invalidate all related queries to ensure clean state
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['nutritionPlan', user?.id] }),
      queryClient.invalidateQueries({ queryKey: ['loggedMeals'] }), // Food tracker might reference the plan
      queryClient.invalidateQueries({ queryKey: ['recentMeals'] }), // Recent meals might reference the plan indirectly
    ]);
    
    // Reset UI state
    setIsEditMode(false);
    
    toast.success("Nutrition plan deleted successfully.");
  };

  const showFullPageLoader = userLoading || (planLoading && !plan);

  // Calculate daily totals from logged meals
  const dailyTotals = loggedMeals.reduce((totals, meal) => {
    totals.calories += meal.total_calories || 0;
    totals.protein += meal.total_protein_grams || 0;
    totals.carbs += meal.total_carbs_grams || 0;
    totals.fat += meal.total_fat_grams || 0;
    return totals;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Calculate tracking stats
  const uniqueDaysLogged = new Set(recentMeals.map(m => m.date)).size;
  const currentStreak = calculateStreak(recentMeals);

  function calculateStreak(meals) {
    if (!meals || meals.length === 0) return 0;
    
    const sortedDates = [...new Set(meals.map(m => m.date))].sort().reverse();
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedDates.length; i++) {
      const date = new Date(sortedDates[i]);
      date.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
      
      if (date.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  if (showFullPageLoader) {
    return (
      <div className="p-6 md:p-8 space-y-8 animate-pulse">
        <div className="h-10 bg-secondary rounded w-1/2"></div>
        <div className="h-8 bg-secondary rounded w-3/4"></div>
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6 space-y-4">
            <div className="h-6 bg-secondary rounded w-1/4"></div>
            <div className="h-40 bg-secondary rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If editing and not hasCoach, show detailed editor
  if (isEditMode && plan && !hasCoach) {
    return (
      <div className="p-6 md:p-8">
        <ClientNutritionPlanDetailView
          plan={plan}
          onBack={() => setIsEditMode(false)}
          onPlanUpdated={handlePlanUpdated}
          onPlanDeleted={handlePlanDeleted}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Utensils className="w-8 h-8 text-[#C5B358]" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">My Nutrition Plan</h1>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl("FoodTracker")}>
              <Button className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Log Food
              </Button>
            </Link>
            {!hasCoach && plan && (
              <Button
                onClick={() => setIsEditMode(true)}
                variant="outline"
                className="border-border text-foreground hover:bg-secondary"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Plan
              </Button>
            )}
            {!hasCoach && !plan && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </Button>
            )}
          </div>
        </div>
        <p className="text-muted-foreground">
          {hasCoach 
            ? "Your daily fuel for peak performance, crafted by your coach."
            : "Your personalized nutrition plan for optimal performance."}
        </p>
      </motion.div>

      {plan ? (
        <>
          {/* Tracking Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Days Tracked</p>
                    <p className="text-3xl font-bold text-foreground">{uniqueDaysLogged}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#C5B358]/20">
                    <TrendingUp className="w-6 h-6 text-[#C5B358]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-3xl font-bold text-foreground">{currentStreak} days</p>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-500/20">
                    <span className="text-2xl">🔥</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Meals</p>
                    <p className="text-3xl font-bold text-foreground">{loggedMeals.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/50">
                    <Utensils className="w-6 h-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plan Assignment Info */}
          {plan.created_date && (
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="w-4 h-4 text-[#C5B358]" />
                <span>
                  Plan {hasCoach ? 'assigned' : 'created'} on {new Date(plan.created_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </CardContent>
            </Card>
          )}

          {/* Nutrition Summary with Logged vs Planned */}
          <NutritionSummary 
            plan={plan} 
            loggedTotals={dailyTotals}
            showComparison={loggedMeals.length > 0}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Daily Meal Plan</h2>
              {loggedMeals.length > 0 && (
                <Link to={createPageUrl("FoodTracker")}>
                  <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-secondary">
                    View Full Tracker
                  </Button>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {plan.meals?.map((meal, index) => (
                <MealCard key={index} meal={meal} isEditing={false} />
              ))}
            </div>
          </motion.div>

          {plan.notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-card/50 backdrop-blur-xl border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-[#C5B358]" />
                    <h3 className="font-semibold text-foreground">{hasCoach ? "Coach's Notes" : "My Notes"}</h3>
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">{plan.notes}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      ) : (
        <div className="text-center py-24">
          <Utensils className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-50" />
          <h3 className="text-2xl font-semibold text-foreground mb-3">No Nutrition Plan Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {hasCoach 
              ? "Your coach is crafting the perfect plan for you. Check back soon!"
              : "Create your personalized nutrition plan to start tracking your macros and meals."}
          </p>
          {!hasCoach ? (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your Plan
            </Button>
          ) : (
            <Link to={createPageUrl("FoodTracker")}>
              <Button className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Log Food Anyway
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Create Plan Dialog */}
      <CreateNutritionPlanDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onPlanCreated={handlePlanCreated}
        isClientSelfManaged={!hasCoach}
      />
    </div>
  );
}
