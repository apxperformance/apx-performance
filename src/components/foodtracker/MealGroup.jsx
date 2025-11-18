
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Trash2, Plus, Edit2, Coffee, Salad, Soup, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Changed from react-hot-toast to sonner
import { base44 } from "@/api/base44Client"; // Added new import for base44
import LogMealDialog from "./LogMealDialog"; // Adjusted import path for LogMealDialog

// Define meal icons and background colors based on meal type
const mealIcons = {
  Breakfast: { icon: <Coffee className="w-5 h-5" />, bg: "bg-amber-500/20" },
  Lunch: { icon: <Salad className="w-5 h-5" />, bg: "bg-lime-500/20" },
  Dinner: { icon: <Soup className="w-5 h-5" />, bg: "bg-sky-500/20" },
  Snacks: { icon: <Apple className="w-5 h-5" />, bg: "bg-purple-500/20" },
};

export default function MealGroup({ mealType, meals = [], date, onMealAdded, onMealDeleted }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);

  // Find the specific meal entry for this mealType within the provided meals array
  const mealForType = meals.find(m => m.meal_type === mealType);
  
  // Extract foods from the found meal (if any), otherwise an empty array
  const allFoods = mealForType ? (mealForType.foods || []).map(food => ({
    ...food,
    mealId: mealForType.id,
    mealTime: mealForType.created_date
  })) : [];

  // Calculate totals for display
  const totalCalories = allFoods.reduce((sum, food) => sum + (food.calories || 0), 0);
  const totalProtein = allFoods.reduce((sum, food) => sum + (food.protein_grams || 0), 0);

  // Handle deletion of an entire meal entry
  const handleDelete = async (mealId) => {
    if (!window.confirm("Are you sure you want to delete this meal? This action cannot be undone.")) {
      return;
    }

    try {
      await base44.entities.LoggedMeal.delete(mealId); // Using the imported base44
      toast.success("Meal deleted successfully");
      onMealDeleted(); // Callback to notify parent component of deletion
    } catch (error) {
      console.error("Error deleting meal:", error);
      toast.error("Failed to delete meal");
    }
  };

  // Handle initiating edit mode for a meal
  const handleEdit = (meal) => {
    setEditingMeal(meal);
    setIsDialogOpen(true);
  };

  // Close the meal logging dialog and reset editing state
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingMeal(null);
  };

  // Handle a meal being saved (added or updated)
  const handleMealSaved = () => {
    onMealAdded(); // Callback to notify parent component of addition/update
    handleDialogClose();
  };

  // If there's no icon defined for the mealType, use a default Utensils icon
  const currentMealIcon = mealIcons[mealType]?.icon || <Utensils className="w-5 h-5" />;
  const currentMealBg = mealIcons[mealType]?.bg || "bg-gray-500/20";


  return (
    <>
      <Card className="bg-card/50 backdrop-blur-xl border-border">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentMealBg}`}>
                {currentMealIcon}
              </div>
              <div>
                <CardTitle className="text-foreground">{mealType}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {Math.round(totalCalories)} cal • {Math.round(totalProtein)}g protein
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Edit button - only show if a meal entry exists for this type */}
              {mealForType && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(mealForType)}
                  className="text-muted-foreground hover:text-[#C5B358] hover:bg-[#C5B358]/10"
                  title={`Edit ${mealType}`}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              {/* Add button - always available */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="text-[#C5B358] hover:bg-[#C5B358]/10"
                title={`Add foods to ${mealType}`}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Display meal content only if a meal entry exists for this type */}
        {mealForType && (
          <CardContent>
            <div className="space-y-2">
              {allFoods.map((food, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-secondary/30 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {food.quantity} {food.serving_size_unit || ''} • {Math.round(food.calories || 0)} cal
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>P: {Math.round(food.protein_grams || 0)}g</p>
                    <p>C: {Math.round(food.carbs_grams || 0)}g</p>
                    <p>F: {Math.round(food.fat_grams || 0)}g</p>
                  </div>
                </div>
              ))}
              
              {/* Delete button for the entire meal entry */}
              <div className="flex justify-end pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(mealForType.id)}
                  className="text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10"
                  title={`Delete ${mealType} meal`}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete Meal
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Meal logging dialog for adding new or editing existing meals */}
      <LogMealDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        mealType={mealType}
        date={date}
        onMealAdded={handleMealSaved}
        editingMeal={editingMeal} // Pass the meal object if in edit mode
      />
    </>
  );
}
