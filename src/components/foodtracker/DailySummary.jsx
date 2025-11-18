
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Drumstick, Wheat, Droplet, Leaf } from "lucide-react";
import { motion } from "framer-motion";

const MacroProgress = ({ label, value, goal, icon: Icon, colorClass }) => {
  const percentage = goal > 0 ? (value / goal) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-1.5 text-gray-300">
          <Icon className={`w-4 h-4 ${colorClass}`} />
          <span>{label}</span>
        </div>
        <span className="font-medium text-white">{Math.round(value)} / {goal ? Math.round(goal) : '...'}g</span>
      </div>
      <Progress value={percentage} indicatorClassName={colorClass.replace('text-', 'bg-')} />
    </div>
  );
};

export default function DailySummary({ totals, goals }) {
  const caloriesPercentage = goals?.calories > 0 ? (totals.calories / goals.calories) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Today's Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          {/* Calories */}
          <div className="flex flex-col items-center justify-center p-6 bg-gray-800/50 rounded-lg">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 36 36" transform="rotate(-90)">
                <path
                  className="text-gray-700"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-yellow-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${caloriesPercentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Flame className="w-8 h-8 text-yellow-400 mb-1" />
                <span className="text-3xl font-bold text-white">{Math.round(totals.calories)}</span>
                <span className="text-sm text-gray-400">/ {goals?.calories || '...'} kcal</span>
              </div>
            </div>
          </div>

          {/* Macros */}
          <div className="space-y-5">
            <MacroProgress label="Protein" value={totals.protein} goal={goals?.protein} icon={Drumstick} colorClass="text-blue-400" />
            <MacroProgress label="Carbs" value={totals.carbs} goal={goals?.carbs} icon={Wheat} colorClass="text-orange-400" />
            <MacroProgress label="Fat" value={totals.fat} goal={goals?.fat} icon={Droplet} colorClass="text-purple-400" />
             <div className="flex justify-between items-center text-sm pt-2">
                <div className="flex items-center gap-1.5 text-gray-300">
                    <Leaf className="w-4 h-4 text-green-400" />
                    <span>Fiber</span>
                </div>
                <span className="font-medium text-white">{Math.round(totals.fiber)}g</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
