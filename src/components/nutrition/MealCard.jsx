import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Plus, X } from "lucide-react";
import { toast } from "sonner";

import FoodPickerDialog from "./FoodPickerDialog";

export default function MealCard({ meal, isEditing, onUpdate, onRemove }) {
  const [localMeal, setLocalMeal] = useState(meal);
  const [isFoodPickerOpen, setIsFoodPickerOpen] = useState(false);

  const updateMeal = (field, value) => {
    const updated = { ...localMeal, [field]: value };
    setLocalMeal(updated);
    if (onUpdate) onUpdate(updated);
  };

  const addFood = (foodItem, quantity) => {
    if (!foodItem || quantity <= 0) {
      toast.error("Invalid food item or quantity.");
      return;
    }

    const updated = {
      ...localMeal,
      foods: [
        ...(localMeal.foods || []),
        {
          food_name: foodItem.name,
          quantity: `${quantity} x ${foodItem.serving_size_qty}${foodItem.serving_size_unit}`,
          calories: foodItem.calories * quantity,
          protein: foodItem.protein_grams * quantity,
          carbs: foodItem.carbs_grams * quantity,
          fat: foodItem.fat_grams * quantity,
          fiber: foodItem.fiber_grams * quantity // ✅ Added fiber field
        }
      ]
    };
    setLocalMeal(updated);
    if (onUpdate) onUpdate(updated);
    toast.success(`${foodItem.name} added!`);
  };

  const removeFood = (index) => {
    const updated = {
      ...localMeal,
      foods: localMeal.foods.filter((_, i) => i !== index)
    };
    setLocalMeal(updated);
    if (onUpdate) onUpdate(updated);
  };

  const totalCalories = localMeal.foods?.reduce((sum, food) => sum + (food.calories || 0), 0) || 0;
  const totalProtein = localMeal.foods?.reduce((sum, food) => sum + (food.protein || 0), 0) || 0;
  const totalCarbs = localMeal.foods?.reduce((sum, food) => sum + (food.carbs || 0), 0) || 0;
  const totalFat = localMeal.foods?.reduce((sum, food) => sum + (food.fat || 0), 0) || 0;
  const totalFiber = localMeal.foods?.reduce((sum, food) => sum + (food.fiber || 0), 0) || 0;

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-xl border-border">
        <CardHeader>
          <div className="flex justify-between items-center">
            {isEditing ? (
              <Input
                value={localMeal.meal_name}
                onChange={(e) => updateMeal('meal_name', e.target.value)}
                className="bg-input text-slate-900 px-3 py-2 text-lg font-medium rounded-md flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-border"
              />
            ) : (
              <CardTitle className="text-foreground">{localMeal.meal_name}</CardTitle>
            )}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={localMeal.time}
                    onChange={(e) => updateMeal('time', e.target.value)}
                    className="bg-input text-slate-900 px-3 py-2 text-base rounded-md flex h-10 border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-border w-32"
                  />
                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onRemove}
                      className="text-destructive hover:text-destructive hover:bg-destructive/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{localMeal.time}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-left mt-2">
            <p className="text-[#C5B358] font-medium">{Math.round(totalCalories)} Calories</p>
            {!isEditing && (
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(totalProtein)}g protein · {Math.round(totalCarbs)}g carbs · {Math.round(totalFat)}g fat
                {totalFiber > 0 && ` · ${Math.round(totalFiber)}g fiber`}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing && (
            <div className="mb-4">
              <Button
                onClick={() => setIsFoodPickerOpen(true)}
                size="sm"
                className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Food
              </Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow className="border-b-border hover:bg-transparent">
                <TableHead className="text-foreground">Food</TableHead>
                <TableHead className="text-foreground">Quantity</TableHead>
                <TableHead className="text-foreground text-right">Calories</TableHead>
                <TableHead className="text-foreground text-right">Protein</TableHead>
                {!isEditing && <TableHead className="text-foreground text-right">Fiber</TableHead>}
                {isEditing && <TableHead className="text-foreground w-10"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {localMeal.foods?.map((food, index) => (
                <TableRow key={index} className="border-b-border">
                  <TableCell className="font-medium text-foreground">
                    {food.food_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {food.quantity}
                  </TableCell>
                  <TableCell className="text-foreground text-right">
                    {Math.round(food.calories)}
                  </TableCell>
                  <TableCell className="text-foreground text-right">
                    {Math.round(food.protein)}g
                  </TableCell>
                  {!isEditing && (
                    <TableCell className="text-foreground text-right">
                      {Math.round(food.fiber || 0)}g
                    </TableCell>
                  )}
                  {isEditing && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFood(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/20 p-1 h-auto"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {(!localMeal.foods || localMeal.foods.length === 0) && (
                <TableRow className="border-b-border">
                  <TableCell colSpan={isEditing ? 5 : 5} className="text-center text-muted-foreground py-4">
                    {isEditing ? "Click 'Add Food' to start building this meal." : "No foods listed for this meal."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {!isEditing && localMeal.foods && localMeal.foods.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Protein:</span>
                  <span className="ml-2 text-foreground font-medium">{Math.round(totalProtein)}g</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Carbs:</span>
                  <span className="ml-2 text-foreground font-medium">{Math.round(totalCarbs)}g</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fat:</span>
                  <span className="ml-2 text-foreground font-medium">{Math.round(totalFat)}g</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fiber:</span>
                  <span className="ml-2 text-foreground font-medium">{Math.round(totalFiber)}g</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isEditing && (
        <FoodPickerDialog
          isOpen={isFoodPickerOpen}
          onClose={() => setIsFoodPickerOpen(false)}
          onFoodSelected={addFood}
        />
      )}
    </>
  );
}