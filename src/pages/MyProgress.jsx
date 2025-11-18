
import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  Award, 
  BarChart3 
} from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "../components/contexts/UserContext";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { format, subDays } from 'date-fns';

import EmptyState from "../components/ui/empty-state";
import SkeletonCard from "../components/ui/skeleton-card";

export default function MyProgress() {
  const { user, isLoading: userLoading } = useUser();
  const [selectedPeriod, setSelectedPeriod] = useState("30"); // Default to last 30 days for filtering

  // Fetch check-ins with react-query
  const { data: checkIns = [], isLoading: checkInsLoading } = useQuery({
    queryKey: ['checkIns', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // For self-managed clients, use their own ID as coach_id
      const effectiveCoachId = user.coach_id || user.id;
      
      return base44.entities.CheckIn.filter(
        { 
          client_id: user.id,
          coach_id: effectiveCoachId
        },
        "-created_date",
        50 // Get last 50 check-ins for progress tracking
      );
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch workout logs with react-query
  const { data: workoutLogs = [], isLoading: workoutLogsLoading } = useQuery({
    queryKey: ['workoutLogs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // For self-managed clients, use their own ID as coach_id
      const effectiveCoachId = user.coach_id || user.id;
      
      return base44.entities.WorkoutLog.filter(
        { 
          client_id: user.id,
          coach_id: effectiveCoachId
        },
        "-completed_date",
        50 // Get a larger number to allow for filtering by period if needed
      );
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const latestCheckIn = checkIns.length > 0 ? checkIns[0] : null;
  const firstCheckIn = checkIns.length > 0 ? checkIns[checkIns.length - 1] : null;
  const weightChange = latestCheckIn && firstCheckIn ? latestCheckIn.weight - firstCheckIn.weight : 0;

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!checkIns || checkIns.length === 0) return [];
    
    // Reverse to get chronological order
    return [...checkIns].reverse().map(checkIn => ({
      date: format(new Date(checkIn.created_date), 'MMM d'),
      fullDate: format(new Date(checkIn.created_date), 'MMM d, yyyy'),
      weight: checkIn.weight || 0,
      energy: checkIn.energy_level || 0,
      sleep: checkIn.sleep_hours || 0,
      stress: checkIn.stress_level || 0
    }));
  }, [checkIns]);

  // Calculate weekly averages
  const weeklyAverages = useMemo(() => {
    if (checkIns.length === 0) return [];
    
    const weeks = [];
    const now = new Date();
    
    for (let i = 0; i < 8; i++) {
      const weekEnd = subDays(now, i * 7);
      const weekStart = subDays(weekEnd, 6);
      
      const weekCheckIns = checkIns.filter(ci => {
        const date = new Date(ci.created_date);
        // Ensure date is within the current week's range (inclusive of weekStart, exclusive of weekEnd)
        // For accurate weekly grouping, it's better to compare dates without time.
        // Or, considering `subDays` creates a specific date, let's make sure comparison is consistent.
        // Simplified to check if date falls within the weekStart to weekEnd range.
        return date >= weekStart && date <= weekEnd;
      });
      
      if (weekCheckIns.length > 0) {
        const avgEnergy = weekCheckIns.reduce((sum, ci) => sum + (ci.energy_level || 0), 0) / weekCheckIns.length;
        const avgSleep = weekCheckIns.reduce((sum, ci) => sum + (ci.sleep_hours || 0), 0) / weekCheckIns.length;
        const avgStress = weekCheckIns.reduce((sum, ci) => sum + (ci.stress_level || 0), 0) / weekCheckIns.length;
        
        weeks.unshift({
          week: i === 0 ? 'This Week' : `${i}w ago`,
          energy: Math.round(avgEnergy * 10) / 10,
          sleep: Math.round(avgSleep * 10) / 10,
          stress: Math.round(avgStress * 10) / 10,
          checkIns: weekCheckIns.length
        });
      }
    }
    
    return weeks;
  }, [checkIns]);

  // Filter workout logs based on selected period (e.g., "30" for 30 days)
  const filteredWorkoutLogs = useMemo(() => {
    if (!workoutLogs || workoutLogs.length === 0) return [];

    const periodInDays = parseInt(selectedPeriod, 10);
    if (isNaN(periodInDays) || periodInDays <= 0) {
      // If selectedPeriod is not a valid number or 0, return all fetched logs
      return workoutLogs;
    }

    const cutoffDate = subDays(new Date(), periodInDays);
    return workoutLogs.filter(log => {
      const logDate = new Date(log.completed_date);
      return logDate >= cutoffDate;
    });
  }, [workoutLogs, selectedPeriod]);

  // ✅ Helper to safely get workout name from log
  const getWorkoutName = (log) => {
    // Use cached workout_name from the log (always present)
    return log.workout_name || "Unknown Workout";
  };

  // Calculate workout frequency
  const workoutFrequency = useMemo(() => {
    const frequency = {};
    filteredWorkoutLogs.forEach(log => {
      // ✅ Use cached workout name instead of looking up the workout
      const name = getWorkoutName(log);
      frequency[name] = (frequency[name] || 0) + 1;
    });
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [filteredWorkoutLogs]);

  const isLoading = userLoading || checkInsLoading || workoutLogsLoading;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-8">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 md:p-8">
        <EmptyState
          icon={TrendingUp}
          title="Authentication Required"
          description="Please log in to view your progress"
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
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-[#C5B358]" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">My Progress</h1>
        </div>
        <p className="text-muted-foreground">Track your fitness journey and celebrate your achievements.</p>
      </motion.div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-3 text-[#C5B358]" />
              <div className="text-2xl font-bold text-foreground">{checkIns.length}</div>
              <div className="text-sm text-muted-foreground">Total Check-ins</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-3 text-foreground" />
              <div className="text-2xl font-bold text-foreground">
                {latestCheckIn?.weight || user?.current_weight || 0} lbs
              </div>
              <div className="text-sm text-muted-foreground">Current Weight</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardContent className="p-6 text-center">
              <Award className={`w-8 h-8 mx-auto mb-3 ${weightChange < 0 ? 'text-[hsl(var(--success))]' : weightChange > 0 ? 'text-[hsl(var(--warning))]' : 'text-foreground'}`} />
              <div className={`text-2xl font-bold ${weightChange < 0 ? 'text-[hsl(var(--success))]' : weightChange > 0 ? 'text-[hsl(var(--warning))]' : 'text-foreground'}`}>
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} lbs
              </div>
              <div className="text-sm text-muted-foreground">Weight Change</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-3 text-foreground" />
              <div className="text-2xl font-bold text-foreground">
                {firstCheckIn ? Math.floor((Date.now() - new Date(firstCheckIn.created_date)) / (1000 * 60 * 60 * 24 * 7)) : 0}
              </div>
              <div className="text-sm text-muted-foreground">Weeks Training</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      {chartData.length > 0 ? (
        <>
          {/* Weight Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#C5B358]" />
                  Weight Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C5B358" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#C5B358" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                      label={{ value: 'lbs', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#C5B358" 
                      fillOpacity={1} 
                      fill="url(#colorWeight)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Energy & Sleep Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#C5B358]" />
                  Energy & Recovery Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="energy" 
                      stroke="#C5B358" 
                      name="Energy Level"
                      strokeWidth={2}
                      dot={{ fill: '#C5B358', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sleep" 
                      stroke="hsl(var(--success))" 
                      name="Sleep Hours"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--success))', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="stress" 
                      stroke="hsl(var(--destructive))" 
                      name="Stress Level"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--destructive))', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Weekly Averages */}
          {weeklyAverages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-card/50 backdrop-blur-xl border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#C5B358]" />
                    Weekly Averages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyAverages}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="week" 
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                      />
                      <Legend />
                      <Bar dataKey="energy" fill="#C5B358" name="Avg Energy" />
                      <Bar dataKey="sleep" fill="hsl(var(--success))" name="Avg Sleep" />
                      <Bar dataKey="stress" fill="hsl(var(--destructive))" name="Avg Stress" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      ) : null}

      {/* Progress Timeline */}
      {checkIns.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Progress Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {checkIns.slice(0, 10).map((checkIn, index) => (
                  <div key={checkIn.id} className="flex gap-4 p-4 bg-secondary/50 rounded-lg">
                    <div className="w-12 h-12 bg-[#C5B358]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-[#C5B358]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-foreground">
                          {new Date(checkIn.created_date).toLocaleDateString()}
                        </h4>
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground">{checkIn.weight} lbs</div>
                          <div className="text-sm text-muted-foreground">Energy: {checkIn.energy_level}/10</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Sleep:</span>
                          <span className="ml-2 text-foreground">{checkIn.sleep_hours}h</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stress:</span>
                          <span className="ml-2 text-foreground">{checkIn.stress_level}/10</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Photos:</span>
                          <span className="ml-2 text-foreground">{checkIn.progress_photos?.length || 0}</span>
                        </div>
                      </div>

                      {checkIn.notes && (
                        <p className="text-muted-foreground text-sm italic mb-2">"{checkIn.notes}"</p>
                      )}

                      {checkIn.coach_feedback && (
                        <div className="bg-[#C5B358]/10 border border-[#C5B358]/20 rounded-md p-3">
                          <h5 className="text-[#C5B358] text-sm font-semibold mb-1">Coach Feedback:</h5>
                          <p className="text-muted-foreground text-sm">{checkIn.coach_feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="text-center py-24">
          <Calendar className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-50" />
          <h3 className="text-2xl font-semibold text-foreground mb-3">No Progress Data Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start logging your check-ins to track your fitness journey and see your progress over time.
          </p>
        </div>
      )}
    </div>
  );
}
