import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Utensils, AlertTriangle, Info, Save } from "lucide-react"; // Added AlertTriangle, Info, Save; removed Calculator
import { toast } from "sonner";
import { useForm } from "react-hook-form"; // Added useForm, Controller

export default function CreateNutritionPlanDialog({ isOpen, onClose, onPlanCreated, isClientSelfManaged = false }) {
  const [user, setUser] = useState(null);
  // Removed isSubmitting local state as per outline, react-hook-form's formState.isSubmitting could be used if needed.

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: "",
      description: "",
      daily_calories: 2000,
      protein_percentage: 30, // Updated default as per outline
      carbs_percentage: 40,   // Updated default as per outline
      fat_percentage: 30,
      meals: [
        { meal_name: "Breakfast", time: "08:00", foods: [] },
        { meal_name: "Lunch", time: "12:00", foods: [] },
        { meal_name: "Dinner", time: "18:00", foods: [] },
      ],
      notes: ""
    }
  });

  // Load user data when component mounts or dialog opens
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to load user data.");
      }
    };

    if (isOpen && !user) { // Fetch user only if dialog is open and user not yet loaded
      fetchUser();
    }
  }, [isOpen, user]); // Depend on isOpen and user to refetch if dialog reopens or user state resets

  // Reset form when dialog closes using react-hook-form's reset
  useEffect(() => {
    if (!isOpen) {
      setValue("name", "");
      setValue("description", "");
      setValue("daily_calories", 2000);
      setValue("protein_percentage", 30);
      setValue("carbs_percentage", 40);
      setValue("fat_percentage", 30);
      setValue("meals", [
        { meal_name: "Breakfast", time: "08:00", foods: [] },
        { meal_name: "Lunch", time: "12:00", foods: [] },
        { meal_name: "Dinner", time: "18:00", foods: [] },
      ]);
      setValue("notes", "");
      // An alternative could be to use form.reset(defaultValues)
    }
  }, [isOpen, setValue]);


  // Watch values for real-time calculation
  const dailyCalories = watch('daily_calories');
  const proteinPercentage = watch('protein_percentage');
  const carbsPercentage = watch('carbs_percentage');
  const fatPercentage = watch('fat_percentage');

  // Calculate macro grams in real-time
  const calculatedMacros = React.useMemo(() => {
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
  const percentageTotal = React.useMemo(() => {
    return (parseFloat(proteinPercentage) || 0) +
           (parseFloat(carbsPercentage) || 0) +
           (parseFloat(fatPercentage) || 0);
  }, [proteinPercentage, carbsPercentage, fatPercentage]);

  // Use a small tolerance for floating point comparison
  const isPercentageValid = Math.abs(percentageTotal - 100) < 0.1;

  const onSubmit = async (data) => {
    if (!user) {
      toast.error("User data not loaded. Please try again.");
      return;
    }

    // Validate percentages
    if (!isPercentageValid) {
      toast.error("Macro percentages must add up to 100% (within a small tolerance).");
      return;
    }

    try {
      const planData = {
        name: data.name,
        description: data.description,
        coach_id: user.id,
        client_id: isClientSelfManaged ? user.id : null,
        daily_calories: parseFloat(data.daily_calories),
        macros: {
          protein_percentage: parseFloat(data.protein_percentage),
          carbs_percentage: parseFloat(data.carbs_percentage),
          fat_percentage: parseFloat(data.fat_percentage),
          protein_grams: calculatedMacros.protein_grams,
          carbs_grams: calculatedMacros.carbs_grams,
          fat_grams: calculatedMacros.fat_grams,
        },
        meals: data.meals,
        notes: data.notes,
        is_template: !isClientSelfManaged
      };

      const newPlan = await base44.entities.NutritionPlan.create(planData);
      toast.success("Nutrition plan created successfully!");
      onPlanCreated(newPlan);
      onClose(); // Close dialog after successful creation
    } catch (error) {
      console.error("Error creating nutrition plan:", error);
      toast.error("Failed to create nutrition plan");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-foreground">
            <Utensils className="w-6 h-6 text-gray-600" />
            Create Nutrition Plan
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name *</Label>
            <Input
              id="name"
              {...register("name", { required: "Plan name is required." })}
              placeholder="e.g., Lean Bulk Phase 1"
              className="bg-input border-border focus:border-gray-600 text-slate-900"
            />
            {errors.name && (
              <span className="text-sm text-[hsl(var(--destructive))]">
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Brief description of the plan's goals..."
              rows={3}
              className="bg-input border-border focus:border-gray-600 resize-none text-slate-900"
            />
          </div>

          {/* Daily Calories */}
          <div className="space-y-2">
            <Label htmlFor="daily_calories" className="text-foreground">Target Daily Calories *</Label>
            <Input
              id="daily_calories"
              type="number"
              step="100" // Added step for better UX
              {...register("daily_calories", {
                required: "Daily calories are required.",
                min: { value: 1000, message: "Calories must be at least 1000." },
                max: { value: 10000, message: "Calories cannot exceed 10000." },
                valueAsNumber: true
              })}
              className="bg-input border-border focus:border-gray-600 text-slate-900"
            />
            {errors.daily_calories && (
              <span className="text-sm text-[hsl(var(--destructive))]">
                {errors.daily_calories.message}
              </span>
            )}
          </div>

          {/* Enhanced Macro Percentages with Real-time Calculations */}
          <div className="space-y-4">
            <Label className="text-foreground mb-3 block">Macro Split *</Label>

            {/* Percentage validation indicator */}
            <div className="mb-4 p-3 rounded-lg border border-border bg-secondary/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Total Percentage:</span>
                <span className={`text-sm font-bold ${
                  isPercentageValid
                    ? 'text-[hsl(var(--success))]'
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Protein */}
              <div className="space-y-2">
                <Label htmlFor="protein_percentage" className="text-foreground">Protein %</Label>
                <Input
                  id="protein_percentage"
                  type="number"
                  step="0.1"
                  {...register("protein_percentage", {
                    required: "Protein % is required.",
                    min: { value: 0, message: "Min 0%" },
                    max: { value: 100, message: "Max 100%" },
                    valueAsNumber: true
                  })}
                  className="bg-input border-border focus:border-blue-500 text-slate-900"
                />
                {errors.protein_percentage && (
                  <span className="text-xs text-[hsl(var(--destructive))]">
                    {errors.protein_percentage.message}
                  </span>
                )}
                {/* Real-time calculated grams */}
                <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                  = <span className="font-semibold text-gray-600">{calculatedMacros.protein_grams}g</span> protein
                </div>
              </div>

              {/* Carbs */}
              <div className="space-y-2">
                <Label htmlFor="carbs_percentage" className="text-foreground">Carbs %</Label>
                <Input
                  id="carbs_percentage"
                  type="number"
                  step="0.1"
                  {...register("carbs_percentage", {
                    required: "Carbs % is required.",
                    min: { value: 0, message: "Min 0%" },
                    max: { value: 100, message: "Max 100%" },
                    valueAsNumber: true
                  })}
                  className="bg-input border-border focus:border-orange-500 text-slate-900"
                />
                {errors.carbs_percentage && (
                  <span className="text-xs text-[hsl(var(--destructive))]">
                    {errors.carbs_percentage.message}
                  </span>
                )}
                {/* Real-time calculated grams */}
                <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                  = <span className="font-semibold text-gray-600">{calculatedMacros.carbs_grams}g</span> carbs
                </div>
              </div>

              {/* Fat */}
              <div className="space-y-2">
                <Label htmlFor="fat_percentage" className="text-foreground">Fat %</Label>
                <Input
                  id="fat_percentage"
                  type="number"
                  step="0.1"
                  {...register("fat_percentage", {
                    required: "Fat % is required.",
                    min: { value: 0, message: "Min 0%" },
                    max: { value: 100, message: "Max 100%" },
                    valueAsNumber: true
                  })}
                  className="bg-input border-border focus:border-purple-500 text-slate-900"
                />
                {errors.fat_percentage && (
                  <span className="text-xs text-[hsl(var(--destructive))]">
                    {errors.fat_percentage.message}
                  </span>
                )}
                {/* Real-time calculated grams */}
                <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                  = <span className="font-semibold text-gray-600">{calculatedMacros.fat_grams}g</span> fat
                </div>
              </div>
            </div>

            {/* Summary of calculated macros */}
            <div className="mt-4 p-3 bg-gray-600/10 border border-gray-600/30 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-600" />
                Daily Macro Targets (auto-calculated)
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-600">{calculatedMacros.protein_grams}g</p>
                  <p className="text-xs text-muted-foreground">Protein</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{calculatedMacros.carbs_grams}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{calculatedMacros.fat_grams}g</p>
                  <p className="text-xs text-muted-foreground">Fat</p>
                </div>
              </div>
            </div>
          </div>
          {/* Notes field */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Any specific instructions or considerations..."
              rows={3}
              className="bg-input border-border focus:border-gray-600 resize-none text-slate-900"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border text-foreground hover:bg-secondary">
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold"
              disabled={isSubmitting || !isPercentageValid || !user || Object.keys(errors).length > 0} // Added form-level validation and user check
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}