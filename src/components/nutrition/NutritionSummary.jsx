import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function NutritionSummary({ plan, loggedTotals, showComparison = false }) {
  const { daily_calories, macros, meals } = plan || {};

  // Target macros from the plan
  const targetProtein = macros?.protein_grams || 0;
  const targetCarbs = macros?.carbs_grams || 0;
  const targetFat = macros?.fat_grams || 0;

  // Calculate totals from meals if not provided logged data
  const mealTotals = useMemo(() => {
    return meals?.reduce((acc, meal) => {
      meal.foods?.forEach(food => {
        acc.calories += food.calories ?? 0;
        acc.protein += food.protein ?? 0;
        acc.carbs += food.carbs ?? 0;
        acc.fat += food.fat ?? 0;
      });
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }, [meals]);

  // Use logged totals if available, otherwise use meal totals
  const actuals = loggedTotals || mealTotals;

  const getComparisonColor = (actual, target) => {
    if (target === 0) return 'text-muted-foreground';
    const diff = Math.abs(actual - target);
    const percentageDiff = (diff / target) * 100;
    if (percentageDiff <= 5) return 'text-[hsl(var(--success))]';
    if (percentageDiff <= 15) return 'text-[hsl(var(--warning))]';
    return 'text-[hsl(var(--destructive))]';
  };

  const getComparisonIcon = (actual, target) => {
    const diff = actual - target;
    if (Math.abs(diff) / target <= 0.05) return <Minus className="w-3 h-3" />;
    if (diff > 0) return <TrendingUp className="w-3 h-3" />;
    return <TrendingDown className="w-3 h-3" />;
  };

  const getComparisonText = (actual, target) => {
    const diff = Math.round(actual - target);
    if (Math.abs(diff) === 0) return 'On target!';
    if (diff > 0) return `+${diff}g over`;
    return `${Math.abs(diff)}g under`;
  };

  const getCalorieComparisonText = (actual, target) => {
    const diff = Math.round(actual - target);
    if (Math.abs(diff) === 0) return 'Perfect!';
    if (diff > 0) return `+${diff} kcal`;
    return `${Math.abs(diff)} kcal under`;
  };

  const getPercentage = (actual, target) => {
    if (target === 0) return 0;
    return Math.min((actual / target) * 100, 100);
  };

  if (!plan) return null;

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border">
      <CardHeader>
        <CardTitle className="text-foreground">
          {showComparison ? "Today's Nutrition vs Plan" : "Nutrition Summary"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Daily Calories */}
          <div className="flex flex-col items-center justify-center p-4 bg-secondary/50 rounded-lg">
            <Flame className="w-8 h-8 text-[#C5B358] mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Daily Calories</p>
            {showComparison ? (
              <>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round(actuals.calories)} / {daily_calories}
                  </p>
                  <div className={`text-xs font-medium mt-1 flex items-center justify-center gap-1 ${getComparisonColor(actuals.calories, daily_calories)}`}>
                    {getComparisonIcon(actuals.calories, daily_calories)}
                    {getCalorieComparisonText(actuals.calories, daily_calories)}
                  </div>
                </div>
                <Progress 
                  value={getPercentage(actuals.calories, daily_calories)} 
                  className="w-full mt-3 h-2"
                  indicatorClassName={getPercentage(actuals.calories, daily_calories) > 105 ? "bg-[hsl(var(--destructive))]" : "bg-[#C5B358]"}
                />
              </>
            ) : (
              <p className="text-3xl font-bold text-foreground">{daily_calories}</p>
            )}
          </div>

          {/* Macros */}
          <div className="col-span-1 lg:col-span-3 p-4 bg-secondary/50 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              {/* Protein */}
              <div className="text-center space-y-2">
                <p className="text-sm text-blue-400 font-medium">Protein</p>
                {showComparison ? (
                  <>
                    <p className="text-xl font-bold text-foreground">
                      {Math.round(actuals.protein)} / {targetProtein}g
                    </p>
                    <Progress 
                      value={getPercentage(actuals.protein, targetProtein)} 
                      className="h-2"
                      indicatorClassName="bg-blue-500"
                    />
                    <div className={`text-xs font-medium flex items-center justify-center gap-1 ${getComparisonColor(actuals.protein, targetProtein)}`}>
                      {getComparisonIcon(actuals.protein, targetProtein)}
                      {getComparisonText(actuals.protein, targetProtein)}
                    </div>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-foreground">{targetProtein}g</p>
                )}
              </div>

              {/* Carbs */}
              <div className="text-center space-y-2">
                <p className="text-sm text-orange-400 font-medium">Carbs</p>
                {showComparison ? (
                  <>
                    <p className="text-xl font-bold text-foreground">
                      {Math.round(actuals.carbs)} / {targetCarbs}g
                    </p>
                    <Progress 
                      value={getPercentage(actuals.carbs, targetCarbs)} 
                      className="h-2"
                      indicatorClassName="bg-orange-500"
                    />
                    <div className={`text-xs font-medium flex items-center justify-center gap-1 ${getComparisonColor(actuals.carbs, targetCarbs)}`}>
                      {getComparisonIcon(actuals.carbs, targetCarbs)}
                      {getComparisonText(actuals.carbs, targetCarbs)}
                    </div>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-foreground">{targetCarbs}g</p>
                )}
              </div>

              {/* Fat */}
              <div className="text-center space-y-2">
                <p className="text-sm text-purple-400 font-medium">Fat</p>
                {showComparison ? (
                  <>
                    <p className="text-xl font-bold text-foreground">
                      {Math.round(actuals.fat)} / {targetFat}g
                    </p>
                    <Progress 
                      value={getPercentage(actuals.fat, targetFat)} 
                      className="h-2"
                      indicatorClassName="bg-purple-500"
                    />
                    <div className={`text-xs font-medium flex items-center justify-center gap-1 ${getComparisonColor(actuals.fat, targetFat)}`}>
                      {getComparisonIcon(actuals.fat, targetFat)}
                      {getComparisonText(actuals.fat, targetFat)}
                    </div>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-foreground">{targetFat}g</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {showComparison && (
          <div className="mt-4 p-3 bg-card/30 rounded-lg">
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--success))]"></div>
                <span className="text-muted-foreground">Within 5%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--warning))]"></div>
                <span className="text-muted-foreground">Within 15%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--destructive))]"></div>
                <span className="text-muted-foreground">Over 15% off</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}