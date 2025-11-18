import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Users, Edit, Save, X, Trash2, Utensils } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";

import NutritionSummary from "./NutritionSummary";
import MealCard from "./MealCard";
import ConfirmDialog from "../ui/ConfirmDialog";

export default function NutritionPlanDetailView({ plan, clients, onBack, onPlanUpdated, onPlanDeleted, onAssignPlan }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedPlan, setEditedPlan] = useState(plan);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const assignedClient = clients.find((c) => c.id === plan.client_id);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(editedPlan) !== JSON.stringify(plan);
  }, [editedPlan, plan]);

  const handleUpdate = (field, value) => {
    setEditedPlan((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMacroChange = (macro, value) => {
    const numValue = parseFloat(value) || 0;
    setEditedPlan((prev) => ({
      ...prev,
      macros: {
        ...prev.macros,
        [macro]: numValue
      }
    }));
  };

  const calculateMacroGrams = (calories, macros) => {
    return {
      protein_grams: Math.round(calories * macros.protein_percentage / 100 / 4),
      carbs_grams: Math.round(calories * macros.carbs_percentage / 100 / 4),
      fat_grams: Math.round(calories * macros.fat_percentage / 100 / 9)
    };
  };

  const handleSaveChanges = async () => {
    // Validation
    if (!editedPlan.name.trim()) {
      toast.error("Plan name cannot be empty.");
      return;
    }

    if (editedPlan.daily_calories <= 0) {
      toast.error("Daily calories must be greater than 0.");
      return;
    }

    // Validate macro percentages
    const totalPercentage = editedPlan.macros.protein_percentage +
    editedPlan.macros.carbs_percentage +
    editedPlan.macros.fat_percentage;

    if (totalPercentage !== 100) {
      toast.error("Macro percentages must total 100%.");
      return;
    }

    setIsSaving(true);
    try {
      // Recalculate macro grams based on new calories/percentages
      const macroGrams = calculateMacroGrams(editedPlan.daily_calories, editedPlan.macros);

      const updatedPlanData = {
        ...editedPlan,
        macros: {
          ...editedPlan.macros,
          ...macroGrams
        }
      };

      const updatedPlan = await base44.entities.NutritionPlan.update(plan.id, updatedPlanData);
      onPlanUpdated(updatedPlan);
      setIsEditing(false);
      toast.success("Nutrition plan saved successfully!");
    } catch (error) {
      console.error("Error saving nutrition plan:", error);
      toast.error("Failed to save nutrition plan. Please try again.");
    }
    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      setEditedPlan(plan);
      setIsEditing(false);
    }
  };

  const confirmCancelEdit = () => {
    setEditedPlan(plan);
    setIsEditing(false);
    setShowCancelConfirm(false);
  };

  const handleAddMeal = () => {
    setEditedPlan((prev) => ({
      ...prev,
      meals: [
      ...(prev.meals || []),
      {
        meal_name: `Meal ${(prev.meals?.length || 0) + 1}`,
        time: "12:00",
        foods: []
      }]

    }));
  };

  const handleMealUpdate = (index, updatedMeal) => {
    setEditedPlan((prev) => ({
      ...prev,
      meals: prev.meals.map((meal, i) => i === index ? updatedMeal : meal)
    }));
  };

  const handleRemoveMeal = (index) => {
    setEditedPlan((prev) => ({
      ...prev,
      meals: prev.meals.filter((_, i) => i !== index)
    }));
  };

  const handleDeletePlan = async () => {
    setIsDeleting(true);
    try {
      await base44.entities.NutritionPlan.delete(plan.id);
      onPlanDeleted(plan.id);
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

  const currentPlan = isEditing ? editedPlan : plan;
  const totalPercentage = currentPlan.macros?.protein_percentage +
  currentPlan.macros?.carbs_percentage +
  currentPlan.macros?.fat_percentage;
  const macroGrams = calculateMacroGrams(currentPlan.daily_calories, currentPlan.macros || {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="border-border hover:bg-accent">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            {isEditing ?
            <Input
              value={editedPlan.name}
              onChange={(e) => handleUpdate('name', e.target.value)} className="bg-input text-slate-900 mb-2 px-3 py-2 text-2xl font-bold rounded-md flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-border" /> :



            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{currentPlan.name}</h1>
            }
            <div className="flex items-center gap-3 mt-2">
              <Badge className="bg-[#C5B358]/20 text-[#C5B358] border-[#C5B358]/30">
                {currentPlan.daily_calories} calories
              </Badge>
              {assignedClient &&
              <Badge variant="outline" className="border-green-500/30 text-green-400">
                  Assigned to {assignedClient.full_name}
                </Badge>
              }
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {isEditing ?
          <>
              <Button
              variant="outline"
              onClick={handleCancelEdit}
              className="border-border hover:bg-accent">

                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
              onClick={handleSaveChanges}
              disabled={isSaving || totalPercentage !== 100}
              className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">

                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </> :

          <>
              <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="border-border hover:bg-accent">

                <Edit className="w-4 h-4 mr-2" />
                Edit Plan
              </Button>
              {plan.is_template !== false &&
            <Button
              onClick={() => onAssignPlan(plan)}
              className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">

                  <Users className="w-4 h-4 mr-2" />
                  Assign to Client
                </Button>
            }
            </>
          }
        </div>
      </div>

      {/* Description and Delete Button */}
      <div className="flex gap-4 items-start">
        <Card className="flex-1 bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-4">
            {isEditing ?
            <Textarea
              value={editedPlan.description || ""}
              onChange={(e) => handleUpdate('description', e.target.value)}
              placeholder="Plan description..."
              className="bg-input border-border focus:border-[#C5B358] resize-none"
              rows={3} /> :

            currentPlan.description ?
            <p className="text-muted-foreground">{currentPlan.description}</p> :

            <p className="text-muted-foreground italic">No description provided.</p>
            }
          </CardContent>
        </Card>
        {isEditing &&
        <Button
          variant="destructive"
          size="icon"
          onClick={() => setShowDeleteConfirm(true)}
          className="bg-destructive/10 text-destructive hover:bg-destructive/20">

            <Trash2 className="w-4 h-4" />
          </Button>
        }
      </div>

      {/* Calories and Macros Editing */}
      {isEditing &&
      <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor="daily_calories" className="text-foreground mb-2 block">Daily Calories Target</Label>
              <Input
              id="daily_calories"
              type="number"
              min="1"
              value={editedPlan.daily_calories}
              onChange={(e) => handleUpdate('daily_calories', parseInt(e.target.value) || 0)} className="bg-input text-slate-900 px-3 py-2 text-base rounded-md flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-border focus:border-[#C5B358]" />


            </div>

            <div className="space-y-4">
              <Label className="text-foreground">Macro Distribution (%)</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="protein_percentage" className="text-blue-400 text-sm">Protein %</Label>
                  <Input
                  id="protein_percentage"
                  type="number"
                  min="10"
                  max="50"
                  value={editedPlan.macros?.protein_percentage || 0}
                  onChange={(e) => handleMacroChange('protein_percentage', e.target.value)} className="bg-input text-slate-900 px-3 py-2 text-base rounded-md flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-border focus:border-blue-500" />


                  <div className="text-xs text-muted-foreground">
                    {macroGrams.protein_grams}g protein
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs_percentage" className="text-orange-400 text-sm">Carbs %</Label>
                  <Input
                  id="carbs_percentage"
                  type="number"
                  min="10"
                  max="70"
                  value={editedPlan.macros?.carbs_percentage || 0}
                  onChange={(e) => handleMacroChange('carbs_percentage', e.target.value)} className="bg-input text-slate-900 px-3 py-2 text-base rounded-md flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-border focus:border-orange-500" />


                  <div className="text-xs text-muted-foreground">
                    {macroGrams.carbs_grams}g carbs
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat_percentage" className="text-purple-400 text-sm">Fat %</Label>
                  <Input
                  id="fat_percentage"
                  type="number"
                  min="10"
                  max="50"
                  value={editedPlan.macros?.fat_percentage || 0}
                  onChange={(e) => handleMacroChange('fat_percentage', e.target.value)} className="bg-input text-slate-900 px-3 py-2 text-base rounded-md flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-border focus:border-purple-500" />


                  <div className="text-xs text-muted-foreground">
                    {macroGrams.fat_grams}g fat
                  </div>
                </div>
              </div>

              {totalPercentage !== 100 &&
            <div className="p-3 bg-destructive/20 border border-destructive/30 rounded-lg">
                  <p className="text-destructive text-sm">
                    Warning: Macro percentages total {totalPercentage}%. They must add up to 100%.
                  </p>
                </div>
            }
            </div>
          </CardContent>
        </Card>
      }

      {/* Nutrition Summary */}
      <NutritionSummary plan={currentPlan} showMealComparison={true} />

      {/* Meals */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">Daily Meals ({currentPlan.meals?.length || 0})</h2>
          {isEditing &&
          <Button onClick={handleAddMeal} className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Add Meal
            </Button>
          }
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentPlan.meals?.length > 0 ?
          currentPlan.meals.map((meal, index) =>
          <MealCard
            key={index}
            meal={meal}
            isEditing={isEditing}
            onUpdate={(updatedMeal) => handleMealUpdate(index, updatedMeal)}
            onRemove={() => handleRemoveMeal(index)} />

          ) :

          <Card className="col-span-full bg-card/50 backdrop-blur-xl border-border">
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Utensils className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Meals Added</h3>
                  <p>Start building your nutrition plan by adding meals.</p>
                  {isEditing &&
                <Button onClick={handleAddMeal} className="mt-4 bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">
                      Add First Meal
                    </Button>
                }
                </div>
              </CardContent>
            </Card>
          }
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePlan}
        title="Delete Nutrition Plan?"
        description="This nutrition plan will be permanently deleted. This action cannot be undone. Are you sure you want to continue?"
        confirmText="Delete Plan"
        variant="destructive"
        isLoading={isDeleting} />


      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={confirmCancelEdit}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to cancel? All changes will be lost."
        confirmText="Discard Changes"
        variant="warning" />

    </motion.div>);

}