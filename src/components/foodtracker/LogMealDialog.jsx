
import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus, X, UtensilsCrossed, Save, Loader2 } from "lucide-react"; // Added Minus, X, Loader2
import { base44 } from "@/api/base44Client";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { format } from "date-fns"; // Added date-fns format

export default function LogMealDialog({ isOpen, onClose, mealType, date, onMealAdded, editingMeal }) {
  const [user, setUser] = useState(null);
  const [foods, setFoods] = useState([]); // All food items from the database
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFoods, setSelectedFoods] = useState([]); // Foods currently being added/edited in the meal
  const [isLoading, setIsLoading] = useState(false); // For submit button loading state

  // Load user and all food items initially
  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        const foodItems = await base44.entities.FoodItem.list("-created_date", 1000); // Increased limit to 1000 for more items
        setFoods(foodItems);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load user or food items.");
      }
    };
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Populate form when editing an existing meal
  useEffect(() => {
    if (editingMeal && isOpen) {
      // Convert meal's foods array to selectedFoods format
      const editFoods = editingMeal.foods.map(food => ({
        food_item_id: food.food_item_id, // This is the ID of the food item in the food database
        name: food.name,
        quantity: food.quantity || 1,
        serving_size_unit: food.serving_size_unit,
        serving_size_qty: food.serving_size_qty,
        calories: food.calories / (food.quantity || 1), // Store per-unit calories
        protein_grams: food.protein_grams / (food.quantity || 1),
        carbs_grams: food.carbs_grams / (food.quantity || 1),
        fat_grams: food.fat_grams / (food.quantity || 1),
        fiber_grams: (food.fiber_grams || 0) / (food.quantity || 1)
      }));
      setSelectedFoods(editFoods);
    } else if (!editingMeal && isOpen) {
      // Reset selectedFoods when opening for a new meal
      setSelectedFoods([]);
    }
    // Also reset searchTerm when dialog opens or closes
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [editingMeal, isOpen]);

  // Debounced function to filter the displayed search results
  const debouncedFilterFoods = useCallback(
    debounce((term) => {
      if (!term.trim()) {
        // If search term is empty, show all foods
        setDisplayedSearchResults(foods);
        return;
      }
      const filtered = foods.filter(food =>
        food.name.toLowerCase().includes(term.toLowerCase()) ||
        (food.category && food.category.toLowerCase().includes(term.toLowerCase()))
      );
      setDisplayedSearchResults(filtered);
    }, 300),
    [foods]
  );

  const handleSearchTermChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedFilterFoods(term);
  };

  // Memoize search results for efficiency
  const [displayedSearchResults, setDisplayedSearchResults] = useState([]);
  useEffect(() => {
    // Initialize displayed search results with all foods when component mounts or foods load
    if (foods.length > 0 && searchTerm === "") {
      setDisplayedSearchResults(foods);
    }
  }, [foods, searchTerm]);


  // Add a food item to the meal
  const addFood = (foodItem) => {
    const existingFoodIndex = selectedFoods.findIndex(f => f.food_item_id === foodItem.id);
    if (existingFoodIndex > -1) {
      const updatedFoods = [...selectedFoods];
      updatedFoods[existingFoodIndex].quantity += 1;
      setSelectedFoods(updatedFoods);
      toast.success(`${foodItem.name} quantity increased.`);
    } else {
      const newFood = {
        food_item_id: foodItem.id, // Use foodItem.id as food_item_id for the selected food
        name: foodItem.name,
        quantity: 1,
        serving_size_unit: foodItem.serving_size_unit,
        serving_size_qty: foodItem.serving_size_qty,
        calories: foodItem.calories || 0,
        protein_grams: foodItem.protein_grams || 0,
        carbs_grams: foodItem.carbs_grams || 0,
        fat_grams: foodItem.fat_grams || 0,
        fiber_grams: foodItem.fiber_grams || 0
      };
      setSelectedFoods([...selectedFoods, newFood]);
      toast.success(`${foodItem.name} added to meal.`);
    }
  };

  // Remove a food item from the meal
  const removeFood = (index) => {
    const updated = selectedFoods.filter((_, i) => i !== index);
    setSelectedFoods(updated);
    toast.error("Food item removed.");
  };

  // Update quantity of a food item
  const updateQuantity = (index, change) => {
    const updatedFoods = [...selectedFoods];
    const currentQuantity = updatedFoods[index].quantity;
    const newQuantity = currentQuantity + change;

    if (newQuantity < 1) {
      toast.error("Quantity cannot be less than 1.");
      return;
    }
    if (newQuantity > 100) { // Arbitrary upper limit for reasonable quantities
      toast.error("Quantity seems too high. Please check your input.");
      return;
    }

    updatedFoods[index].quantity = newQuantity;
    setSelectedFoods(updatedFoods);
  };

  const calculateTotals = useMemo(() => {
    return selectedFoods.reduce((totals, food) => {
      const qty = food.quantity || 0;
      totals.total_calories += (food.calories || 0) * qty;
      totals.total_protein_grams += (food.protein_grams || 0) * qty;
      totals.total_carbs_grams += (food.carbs_grams || 0) * qty;
      totals.total_fat_grams += (food.fat_grams || 0) * qty;
      totals.total_fiber_grams += (food.fiber_grams || 0) * qty;
      return totals;
    }, {
      total_calories: 0,
      total_protein_grams: 0,
      total_carbs_grams: 0,
      total_fat_grams: 0,
      total_fiber_grams: 0
    });
  }, [selectedFoods]);


  const handleSubmit = async () => {
    if (!user) {
      toast.error("User not loaded. Please try again.");
      return;
    }
    if (selectedFoods.length === 0) {
      toast.error("Please add at least one food item to your meal.");
      return;
    }

    // Validation: Check all quantities are positive
    const hasInvalidQuantity = selectedFoods.some(food => !food.quantity || food.quantity <= 0);
    if (hasInvalidQuantity) {
      toast.error("All food quantities must be greater than 0");
      return;
    }

    setIsLoading(true);
    try {
      const totals = calculateTotals; // Use memoized totals

      // Validation: Check if totals are reasonable
      if (totals.total_calories > 5000) {
        toast.error("Total calories seem too high. Please check your quantities.");
        setIsLoading(false);
        return;
      }

      const mealData = {
        client_id: user.id,
        date: format(date, 'yyyy-MM-dd'), // Format date to YYYY-MM-DD
        meal_type: mealType, // mealType is now a prop
        foods: selectedFoods.map(food => ({
          food_item_id: food.food_item_id, // Use food_item_id for API
          name: food.name,
          quantity: food.quantity || 1,
          serving_size_unit: food.serving_size_unit,
          serving_size_qty: food.serving_size_qty,
          calories: Math.round((food.calories || 0) * (food.quantity || 1)),
          protein_grams: Math.round((food.protein_grams || 0) * (food.quantity || 1) * 10) / 10,
          carbs_grams: Math.round((food.carbs_grams || 0) * (food.quantity || 1) * 10) / 10,
          fat_grams: Math.round((food.fat_grams || 0) * (food.quantity || 1) * 10) / 10,
          fiber_grams: Math.round(((food.fiber_grams || 0) * (food.quantity || 1)) * 10) / 10
        })),
        total_calories: Math.round(totals.total_calories),
        total_protein_grams: Math.round(totals.total_protein_grams * 10) / 10,
        total_carbs_grams: Math.round(totals.total_carbs_grams * 10) / 10,
        total_fat_grams: Math.round(totals.total_fat_grams * 10) / 10,
        total_fiber_grams: Math.round(totals.total_fiber_grams * 10) / 10
      };

      // Update or create based on editingMeal
      if (editingMeal) {
        await base44.entities.LoggedMeal.update(editingMeal.id, mealData);
        toast.success("Meal updated successfully!");
      } else {
        await base44.entities.LoggedMeal.create(mealData);
        toast.success("Meal logged successfully!");
      }

      onMealAdded(); // Notify parent of successful action
      onClose();
      setSelectedFoods([]); // Clear selected foods after submission
    } catch (error) {
      console.error("Error saving meal:", error);
      toast.error(editingMeal ? "Failed to update meal" : "Failed to log meal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    setSelectedFoods([]);
    setSearchTerm("");
    setDisplayedSearchResults([]); // Clear search results
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <UtensilsCrossed className="w-6 h-6 text-[#C5B358]" />
            {editingMeal ? `Edit ${mealType}` : `Log ${mealType}`}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editingMeal ? "Adjust the foods and quantities for your meal." : "Search for foods and add them to your meal."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Search Food Items */}
          <div className="flex flex-col space-y-4 pr-0 md:pr-6 md:border-r border-border max-h-[calc(90vh-250px)]">
            <Label htmlFor="search-food" className="font-semibold text-foreground">1. Find a Food</Label>
            <div className="relative">
              <Input
                id="search-food"
                placeholder="Search food database..."
                value={searchTerm}
                onChange={handleSearchTermChange}
                className="pl-10 bg-input border-border"
                disabled={isLoading}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {displayedSearchResults.length === 0 && searchTerm.length > 0 && (
                <p className="text-muted-foreground text-sm">No foods found for "{searchTerm}"</p>
              )}
              {displayedSearchResults.length === 0 && searchTerm.length === 0 && foods.length > 0 && (
                <p className="text-muted-foreground text-sm">Start typing to search for foods.</p>
              )}
              {foods.length === 0 && <p className="text-muted-foreground text-sm">Loading foods...</p>}

              {displayedSearchResults.map((food) => (
                <div key={food.id} className="flex items-center justify-between p-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(food.calories || 0)} cal | {food.serving_size_qty || 1}{food.serving_size_unit || "unit"}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => addFood(food)} type="button" disabled={isLoading}>
                    <Plus className="w-5 h-5 text-[#C5B358]" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Meal Builder */}
          <div className="flex flex-col space-y-4 max-h-[calc(90vh-250px)]">
            <Label htmlFor="selected-foods" className="font-semibold text-foreground">2. Build Your Meal ({mealType})</Label>
            <div className="flex-1 overflow-y-auto space-y-2">
              {selectedFoods.length === 0 ? (
                <p className="text-muted-foreground text-center pt-10 text-sm">Add foods from the left to build your meal.</p>
              ) : (
                selectedFoods.map((food, idx) => (
                  <div key={food.food_item_id + "-" + idx} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{food.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(food.calories * (food.quantity || 1))} cal
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 border-border text-foreground"
                        onClick={() => updateQuantity(idx, -1)}
                        disabled={isLoading}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium text-foreground">{food.quantity || 1}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 border-border text-foreground"
                        onClick={() => updateQuantity(idx, 1)}
                        disabled={isLoading}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => removeFood(idx)}
                        disabled={isLoading}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {selectedFoods.length > 0 && (
              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between font-bold text-[#C5B358]">
                  <span>Total Calories:</span>
                  <span>{Math.round(calculateTotals.total_calories)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground text-xs">
                  <div className="flex justify-between">
                    <span>Protein:</span>
                    <span>{Math.round(calculateTotals.total_protein_grams * 10) / 10}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carbs:</span>
                    <span>{Math.round(calculateTotals.total_carbs_grams * 10) / 10}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fat:</span>
                    <span>{Math.round(calculateTotals.total_fat_grams * 10) / 10}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fiber:</span>
                    <span>{Math.round(calculateTotals.total_fiber_grams * 10) / 10}g</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleDialogClose}
            className="border-border text-foreground hover:bg-secondary"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || selectedFoods.length === 0}
            className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {editingMeal ? "Updating..." : "Logging..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editingMeal ? "Update Meal" : "Log Meal"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
