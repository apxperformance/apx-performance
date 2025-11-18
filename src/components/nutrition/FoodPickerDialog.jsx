
import { useState, useEffect } from "react";
import { FoodItem } from "@/entities/FoodItem";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus } from "lucide-react";
import { debounce } from "lodash";

export default function FoodPickerDialog({ isOpen, onClose, onFoodSelected }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Extracted search logic into a stable function
  const searchFoods = async (term) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const allFoods = await FoodItem.list();
      const filteredFoods = allFoods.filter(food => 
        food.name.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(filteredFoods);
    } catch (error) {
      console.error("Error searching foods:", error);
      setSearchResults([]);
    }
    setIsLoading(false);
  };

  // Debounce the search function. Note: this `debounce` call will re-create `debouncedSearch` on every render.
  // The `useEffect` below ensures that the effect callback always uses the `debouncedSearch` from the render when `searchTerm` changed.
  const debouncedSearch = debounce(searchFoods, 300);

  useEffect(() => {
    debouncedSearch(searchTerm);
    // Optional cleanup: cancel any pending debounced calls when component unmounts or searchTerm changes.
    // This prevents setting state on an unmounted component.
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm]); // `debouncedSearch` is intentionally omitted here as it re-creates on every render.

  const handleSelectFood = (food) => {
    setSelectedFood(food);
  };

  const handleAddFood = () => {
    if (selectedFood && quantity > 0) {
      onFoodSelected(selectedFood, quantity);
      setSelectedFood(null);
      setQuantity(1);
      setSearchTerm("");
      setSearchResults([]);
      onClose();
    }
  };

  const calculateNutrition = () => {
    if (!selectedFood || quantity <= 0) return null;
    return {
      calories: selectedFood.calories * quantity,
      protein: selectedFood.protein_grams * quantity,
      carbs: selectedFood.carbs_grams * quantity,
      fat: selectedFood.fat_grams * quantity,
      fiber: selectedFood.fiber_grams * quantity
    };
  };

  const nutrition = calculateNutrition();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Search className="w-6 h-6 text-[#C5B358]" />
            Add Food to Meal
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left: Search */}
          <div className="space-y-4">
            <div>
              <Label>Search Food Database</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search for foods..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isLoading && (
                <div className="text-center text-gray-400 py-4">Searching...</div>
              )}
              {searchResults.map((food) => (
                <div
                  key={food.id}
                  onClick={() => handleSelectFood(food)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedFood?.id === food.id 
                      ? 'bg-[#C5B358]/20 border border-[#C5B358]/30' 
                      : 'bg-gray-800/50 hover:bg-gray-800'
                  }`}
                >
                  <div className="font-medium text-white">{food.name}</div>
                  <div className="text-xs text-gray-400">
                    {food.calories} cal per {food.serving_size_qty}{food.serving_size_unit}
                  </div>
                  <div className="text-xs text-gray-500">
                    P: {food.protein_grams}g | C: {food.carbs_grams}g | F: {food.fat_grams}g
                  </div>
                </div>
              ))}
              {searchTerm.length >= 2 && !isLoading && searchResults.length === 0 && (
                <div className="text-center text-gray-400 py-4">No foods found</div>
              )}
            </div>
          </div>

          {/* Right: Selected Food Details */}
          <div className="space-y-4">
            {selectedFood ? (
              <>
                <div>
                  <Label>Selected Food</Label>
                  <div className="mt-1 p-3 bg-gray-800 rounded-lg">
                    <div className="font-medium text-white">{selectedFood.name}</div>
                    <div className="text-sm text-gray-400">
                      Per {selectedFood.serving_size_qty}{selectedFood.serving_size_unit}:
                    </div>
                    <div className="text-xs text-gray-500 grid grid-cols-2 gap-2 mt-1">
                      <span>Calories: {selectedFood.calories}</span>
                      <span>Protein: {selectedFood.protein_grams}g</span>
                      <span>Carbs: {selectedFood.carbs_grams}g</span>
                      <span>Fat: {selectedFood.fat_grams}g</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Quantity (servings)</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    min="0.1"
                    step="0.1"
                    className="bg-gray-800 border-gray-700 mt-1"
                  />
                </div>

                {nutrition && (
                  <div>
                    <Label>Total Nutrition</Label>
                    <div className="mt-1 p-3 bg-gray-800 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-[#C5B358] font-medium">
                          {Math.round(nutrition.calories)} calories
                        </div>
                        <div className="text-blue-400">
                          {Math.round(nutrition.protein)}g protein
                        </div>
                        <div className="text-orange-400">
                          {Math.round(nutrition.carbs)}g carbs
                        </div>
                        <div className="text-purple-400">
                          {Math.round(nutrition.fat)}g fat
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Search and select a food item</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button variant="outline" onClick={onClose} className="border-gray-600 hover:bg-gray-800">
            Cancel
          </Button>
          <Button
            onClick={handleAddFood}
            disabled={!selectedFood || quantity <= 0}
            className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Food
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
