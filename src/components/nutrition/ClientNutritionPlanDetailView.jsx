
import { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Save, Trash2, Calculator, AlertTriangle, Info, Edit } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

import MealCard from "./MealCard";
import ConfirmDialog from "../ui/ConfirmDialog";

export default function ClientNutritionPlanDetailView({ plan, onBack, onPlanUpdated, onPlanDeleted }) {
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(true); // Control edit mode: true for editable inputs, false for plain text

  // Initialize react-hook-form
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: {
      name: plan.name,
      description: plan.description,
      daily_calories: plan.daily_calories,
      macros: {
        protein_percentage: plan.macros?.protein_percentage || 0,
        carbs_percentage: plan.macros?.carbs_percentage || 0,
        fat_percentage: plan.macros?.fat_percentage || 0,
      },
      meals: plan.meals || [],
      notes: plan.notes || "",
    }
  });

  // Effect to reset form with new plan data if the plan prop changes
  useEffect(() => {
    reset({
      name: plan.name,
      description: plan.description,
      daily_calories: plan.daily_calories,
      macros: {
        protein_percentage: plan.macros?.protein_percentage || 0,
        carbs_percentage: plan.macros?.carbs_percentage || 0,
        fat_percentage: plan.macros?.fat_percentage || 0,
      },
      meals: plan.meals || [],
      notes: plan.notes || "",
    });
    setIsEditing(true); // Re-enable editing when a new plan is loaded or reset
  }, [plan, reset]);


  // Watch values for real-time calculation
  const dailyCalories = watch('daily_calories');
  const proteinPercentage = watch('macros.protein_percentage');
  const carbsPercentage = watch('macros.carbs_percentage');
  const fatPercentage = watch('macros.fat_percentage');
  const meals = watch('meals'); // Watch meals for adding/removing

  // Calculate macro grams in real-time
  const calculatedMacros = useMemo(() => {
    const calories = parseFloat(dailyCalories) || 0;
    const protein = parseFloat(proteinPercentage) || 0;
    const carbs = parseFloat(carbsPercentage) || 0;
    const fat = parseFloat(fatPercentage) || 0;

    return {
      protein_grams: Math.round((calories * protein / 100) / 4),
      carbs_grams: Math.round((calories * carbs / 100) / 4),
      fat_grams: Math.round((calories * fat / 100) / 9),
    };
  }, [dailyCalories, proteinPercentage, carbsPercentage, fatPercentage]);

  // Validate percentages add up to 100
  const percentageTotal = useMemo(() => {
    return (parseFloat(proteinPercentage) || 0) +
           (parseFloat(carbsPercentage) || 0) +
           (parseFloat(fatPercentage) || 0);
  }, [proteinPercentage, carbsPercentage, fatPercentage]);

  // Use a small epsilon for float comparison, as percentages can be decimals
  const isPercentageValid = Math.abs(percentageTotal - 100) < 0.1;

  // Meal management functions - adapted to work with react-hook-form's watch/setValue (using reset to trigger re-render and update form state)
  const addMeal = () => {
    const newMeal = {
      meal_name: "New Meal",
      time: "12:00",
      foods: []
    };
    reset((prev) => ({
      ...prev,
      meals: [...(prev.meals || []), newMeal]
    }));
  };

  const updateMeal = (index, updatedMeal) => {
    const currentMeals = meals ? [...meals] : [];
    currentMeals[index] = updatedMeal;
    reset((prev) => ({ ...prev, meals: currentMeals }));
  };

  const removeMeal = (index) => {
    reset((prev) => ({
      ...prev,
      meals: (prev.meals || []).filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (data) => {
    // Validate percentages
    if (!isPercentageValid) {
      toast.error("Macro percentages must add up to 100%");
      return;
    }

    // Basic validation for plan name (required)
    if (!data.name.trim()) {
      toast.error("Plan name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const updatedPlanPayload = {
        name: data.name,
        description: data.description,
        daily_calories: parseInt(data.daily_calories),
        macros: {
          protein_percentage: parseFloat(data.macros.protein_percentage),
          carbs_percentage: parseFloat(data.macros.carbs_percentage),
          fat_percentage: parseFloat(data.macros.fat_percentage),
          protein_grams: calculatedMacros.protein_grams,
          carbs_grams: calculatedMacros.carbs_grams,
          fat_grams: calculatedMacros.fat_grams,
        },
        meals: data.meals,
        notes: data.notes
      };

      const result = await base44.entities.NutritionPlan.update(plan.id, updatedPlanPayload);
      onPlanUpdated(result); // Pass the updated plan from the API response
      toast.success("Nutrition plan updated successfully!");
      setIsEditing(false); // After successful save, switch to view mode
    } catch (error) {
      console.error("Error updating nutrition plan:", error);
      toast.error("Failed to update nutrition plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const user = await base44.auth.me();

      if (user.coach_id) {
        try {
          const clientRecords = await base44.entities.Client.filter({
            user_id: user.id,
            coach_id: user.coach_id
          });

          // Check if this plan is assigned to any client and unassign it
          const clientPromises = clientRecords.map(async (client) => {
            if (client.nutrition_plan_id === plan.id) {
              await base44.entities.Client.update(client.id, {
                nutrition_plan_id: null
              });
            }
          });
          await Promise.all(clientPromises);

        } catch (error) {
          console.warn("Could not update client record(s) (non-critical):", error);
        }
      }

      await base44.entities.NutritionPlan.delete(plan.id);

      onPlanDeleted();
      setShowDeleteConfirm(false);
      toast.success("Nutrition plan deleted successfully.");
    } catch (error) {
      console.error("Error deleting nutrition plan:", error);
      toast.error("Failed to delete nutrition plan. Please try again.");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="border-border text-foreground hover:bg-secondary">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{isEditing ? "Edit" : "View"} Nutrition Plan</h1>
            <p className="text-muted-foreground">{isEditing ? "Customize your nutrition strategy" : "Review nutrition strategy"}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/20"
            disabled={isSaving || isDeleting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold"
              disabled={isSaving || isDeleting}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Plan
            </Button>
          )}
          {isEditing && (
            <Button
              onClick={handleSubmit(handleSave)}
              disabled={isSaving || !isPercentageValid || isDeleting || Object.keys(errors).length > 0}
              className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
        {/* Basic Info */}
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              {isEditing ? (
                <>
                  <Input
                    id="name"
                    {...register("name", { required: "Plan name is required." })}
                    className="bg-input border-border text-slate-900"
                  />
                  {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
                </>
              ) : (
                <p className="text-foreground">{plan.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              {isEditing ? (
                <Textarea
                  id="description"
                  {...register("description")}
                  rows={3}
                  className="bg-input border-border resize-none text-slate-900"
                />
              ) : (
                <p className="text-foreground whitespace-pre-wrap">{plan.description || "N/A"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily_calories">Target Daily Calories</Label>
              {isEditing ? (
                <>
                  <Input
                    id="daily_calories"
                    type="number"
                    min="1"
                    {...register("daily_calories", {
                      required: "Daily calories is required.",
                      min: { value: 1, message: "Calories must be at least 1." },
                      valueAsNumber: true,
                    })}
                    className="bg-input border-border text-slate-900"
                  />
                  {errors.daily_calories && <p className="text-destructive text-sm mt-1">{errors.daily_calories.message}</p>}
                </>
              ) : (
                <p className="text-foreground">{plan.daily_calories}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Macros */}
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Calculator className="w-5 h-5" />
              Macro Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Percentage validation indicator */}
            {isEditing && (
              <div className={`mb-4 p-3 rounded-lg border ${isPercentageValid ? 'border-border bg-secondary/30' : 'border-destructive/30 bg-destructive/20'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Total Percentage:</span>
                  <span className={`text-sm font-bold ${
                    isPercentageValid
                      ? 'text-green-500' // Using a direct green for success
                      : 'text-[hsl(var(--destructive))]'
                  }`}>
                    {percentageTotal.toFixed(1)}%
                  </span>
                </div>
                {!isPercentageValid && (
                  <p className="text-xs text-[hsl(var(--destructive))] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Percentages must add up to 100%
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Protein */}
              <div className="space-y-2">
                <Label className="text-blue-400">Protein %</Label>
                {isEditing ? (
                  <>
                    <Input
                      type="number"
                      step="0.1"
                      {...register("macros.protein_percentage", {
                        required: "Protein percentage is required.",
                        min: { value: 0, message: "Min 0%" },
                        max: { value: 100, message: "Max 100%" },
                        valueAsNumber: true,
                      })}
                      className="bg-input border-blue-500 text-slate-900"
                    />
                    {errors.macros?.protein_percentage && <p className="text-destructive text-xs mt-1">{errors.macros.protein_percentage.message}</p>}
                    <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                      = <span className="font-semibold text-[#C5B358]">{calculatedMacros.protein_grams}g</span> protein
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-foreground">{plan.macros?.protein_percentage || 0}%</p>
                    <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                      = <span className="font-semibold text-[#C5B358]">{plan.macros?.protein_grams || 0}g</span> protein
                    </div>
                  </>
                )}
              </div>

              {/* Carbs */}
              <div className="space-y-2">
                <Label className="text-orange-400">Carbs %</Label>
                {isEditing ? (
                  <>
                    <Input
                      type="number"
                      step="0.1"
                      {...register("macros.carbs_percentage", {
                        required: "Carbs percentage is required.",
                        min: { value: 0, message: "Min 0%" },
                        max: { value: 100, message: "Max 100%" },
                        valueAsNumber: true,
                      })}
                      className="bg-input border-orange-500 text-slate-900"
                    />
                    {errors.macros?.carbs_percentage && <p className="text-destructive text-xs mt-1">{errors.macros.carbs_percentage.message}</p>}
                    <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                      = <span className="font-semibold text-[#C5B358]">{calculatedMacros.carbs_grams}g</span> carbs
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-foreground">{plan.macros?.carbs_percentage || 0}%</p>
                    <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                      = <span className="font-semibold text-[#C5B358]">{plan.macros?.carbs_grams || 0}g</span> carbs
                    </div>
                  </>
                )}
              </div>

              {/* Fat */}
              <div className="space-y-2">
                <Label className="text-purple-400">Fat %</Label>
                {isEditing ? (
                  <>
                    <Input
                      type="number"
                      step="0.1"
                      {...register("macros.fat_percentage", {
                        required: "Fat percentage is required.",
                        min: { value: 0, message: "Min 0%" },
                        max: { value: 100, message: "Max 100%" },
                        valueAsNumber: true,
                      })}
                      className="bg-input border-purple-500 text-slate-900"
                    />
                    {errors.macros?.fat_percentage && <p className="text-destructive text-xs mt-1">{errors.macros.fat_percentage.message}</p>}
                    <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                      = <span className="font-semibold text-[#C5B358]">{calculatedMacros.fat_grams}g</span> fat
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-foreground">{plan.macros?.fat_percentage || 0}%</p>
                    <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                      = <span className="font-semibold text-[#C5B358]">{plan.macros?.fat_grams || 0}g</span> fat
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Summary of calculated macros */}
            {isEditing && (
              <div className="mt-4 p-3 bg-[#C5B358]/10 border border-[#C5B358]/30 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#C5B358]" />
                  Daily Macro Targets (auto-calculated)
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[#C5B358]">{calculatedMacros.protein_grams}g</p>
                    <p className="text-xs text-muted-foreground">Protein</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#C5B358]">{calculatedMacros.carbs_grams}g</p>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#C5B358]">{calculatedMacros.fat_grams}g</p>
                    <p className="text-xs text-muted-foreground">Fat</p>
                  </div>
                </div>
              </div>
            )}

            {!isEditing && (
              <div className="grid grid-cols-3 gap-4 mt-3 text-center">
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold text-[#C5B358]">{plan.macros?.protein_grams || 0}g</p>
                  <p className="text-xs text-muted-foreground">Protein</p>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold text-[#C5B358]">{plan.macros?.carbs_grams || 0}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold text-[#C5B358]">{plan.macros?.fat_grams || 0}g</p>
                  <p className="text-xs text-muted-foreground">Fat</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meals */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-foreground">Meals</h2>
            {isEditing && (
              <Button
                onClick={addMeal}
                className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
                type="button" // Important to prevent form submission
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Meal
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {meals?.map((meal, index) => (
              <MealCard
                key={index}
                meal={meal}
                isEditing={isEditing} // Pass isEditing to MealCard
                onUpdate={(updated) => updateMeal(index, updated)}
                onRemove={() => removeMeal(index)}
              />
            ))}
          </div>

          {(!meals || meals.length === 0) && (
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardContent className="p-12 text-center">
                <Plus className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Meals Added</h3>
                <p className="text-muted-foreground mb-4">Start building your meal plan</p>
                {isEditing && (
                  <Button
                    onClick={addMeal}
                    className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
                    type="button" // Important to prevent form submission
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Meal
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Notes */}
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                {...register("notes")}
                placeholder="Add any notes or instructions..."
                rows={4}
                className="bg-input border-border resize-none text-slate-900"
              />
            ) : (
              <p className="text-foreground whitespace-pre-wrap">{plan.notes || "No notes."}</p>
            )}
          </CardContent>
        </Card>
      </form>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Nutrition Plan?"
        description="This nutrition plan will be permanently deleted. This action cannot be undone. Are you sure you want to continue?"
        confirmText="Delete Plan"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
