
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill, Info, AlertCircle, Download, CheckCircle2, Calendar, TrendingUp, Bell, Award, Plus, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "../components/contexts/UserContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Import useQuery, useMutation, useQueryClient

import ClientSupplementCard from "../components/supplements/ClientSupplementCard";
import SupplementComplianceHistory from "../components/supplements/SupplementComplianceHistory";
import EmptyState from "../components/ui/empty-state";
import CreateSupplementPlanDialog from "../components/supplements/CreateSupplementPlanDialog";
import ClientSupplementPlanDetailView from "../components/supplements/ClientSupplementPlanDetailView";

const DailyReminderCard = ({ hasLoggedToday, onLogNow }) => {
  if (hasLoggedToday) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="bg-gradient-to-r from-[hsl(var(--success))]/10 to-[hsl(var(--success))]/5 border-[hsl(var(--success))]/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[hsl(var(--success))]/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[hsl(var(--success))]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">All Set for Today! 🎉</h3>
                <p className="text-sm text-muted-foreground">You've logged your supplements. Great job staying consistent!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#C5B358]/20 to-[#A4913C]/20 rounded-lg animate-pulse"></div>
      <Card className="bg-gradient-to-r from-[hsl(var(--warning))]/10 to-[hsl(var(--warning))]/5 border-[hsl(var(--warning))]/30 relative">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-[hsl(var(--warning))]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell className="w-6 h-6 text-[hsl(var(--warning))]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Don't Forget Your Supplements!</h3>
              <p className="text-sm text-muted-foreground mb-3">
                You haven't logged your supplements today. Track them below to maintain your streak.
              </p>
              <Button 
                onClick={onLogNow}
                size="sm"
                className="bg-[#C5B358] hover:bg-[#A4913C] text-black"
              >
                <Pill className="w-4 h-4 mr-2" />
                Log Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AdherenceStats = ({ complianceHistory, plan }) => {
  if (!plan || !complianceHistory || complianceHistory.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-border">
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Start logging to see your adherence stats</p>
        </CardContent>
      </Card>
    );
  }

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Calculate weekly adherence
  const weekDays = eachDayOfInterval({ start: weekStart, end: today });
  const weekCompliance = complianceHistory.filter(c => {
    const date = parseISO(c.date);
    return date >= weekStart && date <= today;
  });
  
  const weeklyAdherence = weekDays.length > 0 
    ? Math.round((weekCompliance.length / weekDays.length) * 100) 
    : 0;

  // Calculate monthly adherence
  const monthDays = eachDayOfInterval({ start: monthStart, end: today });
  const monthCompliance = complianceHistory.filter(c => {
    const date = parseISO(c.date);
    return date >= monthStart && date <= today;
  });
  
  const monthlyAdherence = monthDays.length > 0 
    ? Math.round((monthCompliance.length / monthDays.length) * 100) 
    : 0;

  // Calculate current streak
  const sortedCompliance = [...complianceHistory]
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  let currentStreak = 0;
  let checkDate = new Date();
  
  for (let i = 0; i < sortedCompliance.length; i++) {
    const complianceDate = parseISO(sortedCompliance[i].date);
    const daysDiff = differenceInDays(checkDate, complianceDate);
    
    if (daysDiff === currentStreak) {
      currentStreak++;
      checkDate = complianceDate;
    } else {
      break;
    }
  }

  // Calculate average completion rate
  const totalSupplements = plan.supplements?.length || 0;
  const avgCompletion = complianceHistory.length > 0 && totalSupplements > 0
    ? Math.round(
        complianceHistory.reduce((sum, c) => 
          sum + (c.supplements_taken?.length || 0), 0
        ) / (complianceHistory.length * totalSupplements) * 100
      )
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-[#C5B358]/10 to-[#A4913C]/10 border-[#C5B358]/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-[#C5B358]" />
            <Badge className="bg-[#C5B358]/20 text-[#C5B358] border-0">This Week</Badge>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{weeklyAdherence}%</div>
          <p className="text-sm text-muted-foreground">Weekly Adherence</p>
          <Progress value={weeklyAdherence} className="mt-2 h-2" />
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            <Badge className="bg-purple-500/20 text-purple-500 border-0">This Month</Badge>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{monthlyAdherence}%</div>
          <p className="text-sm text-muted-foreground">Monthly Adherence</p>
          <Progress value={monthlyAdherence} className="mt-2 h-2" />
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-[hsl(var(--success))]/10 to-[hsl(var(--success))]/5 border-[hsl(var(--success))]/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-5 h-5 text-[hsl(var(--success))]" />
            <Badge className="bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-0">Streak</Badge>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{currentStreak}</div>
          <p className="text-sm text-muted-foreground">Days in a Row</p>
          <div className="mt-2 flex items-center gap-1">
            {[...Array(Math.min(currentStreak, 7))].map((_, i) => (
              <div key={i} className="w-2 h-6 bg-[hsl(var(--success))] rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            <Badge className="bg-blue-500/20 text-blue-500 border-0">Completion</Badge>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{avgCompletion}%</div>
          <p className="text-sm text-muted-foreground">Avg. Completion</p>
          <Progress value={avgCompletion} className="mt-2 h-2" />
        </CardContent>
      </Card>
    </div>
  );
};

export default function MySupplements() {
  const { user, isLoading: userLoading, hasCoach } = useUser();
  const today = format(new Date(), 'yyyy-MM-dd');
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch the supplement plan
  const { data: plan, isLoading: planLoading, error: planError } = useQuery({
    queryKey: ['supplementPlan', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const planData = await base44.entities.SupplementPlan.filter({ 
        client_id: user.id
      }, "-created_date", 1);
      return planData.length > 0 ? planData[0] : null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Keep plan data fresh for 5 mins
  });

  // Fetch today's logged meals (from outline, not in original client code)
  const { data: loggedMeals = [] } = useQuery({
    queryKey: ['loggedMeals', user?.id, today],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.LoggedMeal.filter({ 
        client_id: user.id,
        date: today
      });
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000,
  });

  // Fetch recent logged meals (for streak tracking) (from outline, not in original client code)
  const { data: recentMeals = [] } = useQuery({
    queryKey: ['recentMeals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Note: The outline suggested .list("-date", 30), but for client-specific data, .filter with client_id is more appropriate.
      return base44.entities.LoggedMeal.filter({ client_id: user.id }, "-date", 30);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch today's compliance separately for better control
  const { data: todaysCompliance, isLoading: complianceLoading } = useQuery({
    queryKey: ['supplementCompliance', user?.id, today],
    queryFn: async () => {
      if (!user || !plan) return null;
      
      const records = await base44.entities.SupplementCompliance.filter({
        client_id: user.id,
        supplement_plan_id: plan.id,
        date: today
      });
      
      // Return the first (and should be only after mutation consolidation) record
      return records.length > 0 ? records[0] : null;
    },
    enabled: !!user && !!plan,
    staleTime: 30 * 1000, // 30 seconds - refresh more frequently
  });

  // Fetch all compliance history
  const { data: complianceHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['supplementComplianceHistory', user?.id],
    queryFn: async () => {
      if (!user || !plan) return [];
      return base44.entities.SupplementCompliance.filter({
        client_id: user.id,
        supplement_plan_id: plan.id
      }, "-date");
    },
    enabled: !!user && !!plan,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation for updating supplement compliance with duplicate prevention
  const updateComplianceMutation = useMutation({
    mutationFn: async ({ supplementName, isTaken }) => {
      if (!user || !plan) throw new Error("User or plan not available");

      // Step 1: Fetch the absolute latest compliance record for today
      const existingRecords = await base44.entities.SupplementCompliance.filter({
        client_id: user.id,
        supplement_plan_id: plan.id,
        date: today
      });

      // Step 2: Handle duplicate detection and consolidation
      if (existingRecords.length > 1) {
        console.warn(`Found ${existingRecords.length} duplicate compliance records for ${today}. Consolidating...`);
        
        // Consolidate all supplements_taken from duplicates
        const allTakenSupplements = new Set();
        existingRecords.forEach(record => {
          (record.supplements_taken || []).forEach(s => allTakenSupplements.add(s));
        });

        // Keep the first record, delete the rest
        const primaryRecord = existingRecords[0];
        const duplicates = existingRecords.slice(1);

        await Promise.all(
          duplicates.map(dup => base44.entities.SupplementCompliance.delete(dup.id))
        );

        console.log(`Deleted ${duplicates.length} duplicate record(s)`);
        
        // Use the consolidated data
        const consolidatedTaken = Array.from(allTakenSupplements);
        
        // Update primary record with consolidated data
        const newTakenSupplements = isTaken
          ? [...new Set([...consolidatedTaken, supplementName])]
          : consolidatedTaken.filter(s => s !== supplementName);

        return await base44.entities.SupplementCompliance.update(primaryRecord.id, {
          supplements_taken: newTakenSupplements
        });
      }

      // Step 3: Normal flow - single or no record
      const existingRecord = existingRecords.length > 0 ? existingRecords[0] : null;
      const currentTaken = existingRecord?.supplements_taken || [];

      const newTakenSupplements = isTaken
        ? [...new Set([...currentTaken, supplementName])]
        : currentTaken.filter(s => s !== supplementName);

      if (existingRecord) {
        // Update existing record
        return await base44.entities.SupplementCompliance.update(existingRecord.id, {
          supplements_taken: newTakenSupplements
        });
      } else {
        // Create new record
        return await base44.entities.SupplementCompliance.create({
          client_id: user.id,
          supplement_plan_id: plan.id,
          date: today,
          supplements_taken: newTakenSupplements
        });
      }
    },
    onMutate: async ({ supplementName, isTaken }) => {
      // Cancel outgoing queries to prevent them from overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['supplementCompliance', user?.id, today] });

      // Snapshot the previous value
      const previousCompliance = queryClient.getQueryData(['supplementCompliance', user?.id, today]);

      // Optimistically update the cache
      queryClient.setQueryData(['supplementCompliance', user?.id, today], (old) => {
        if (!old) {
          return {
            id: `temp-${Date.now()}`, // Temporary ID for new record
            client_id: user.id,
            supplement_plan_id: plan.id,
            date: today,
            supplements_taken: isTaken ? [supplementName] : []
          };
        }

        const currentTaken = old.supplements_taken || [];
        const newTaken = isTaken
          ? [...new Set([...currentTaken, supplementName])]
          : currentTaken.filter(s => s !== supplementName);

        return {
          ...old,
          supplements_taken: newTaken
        };
      });

      return { previousCompliance }; // Return snapshot for potential rollback
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update on error
      console.error("Error updating supplement compliance:", err);
      if (context?.previousCompliance) {
        queryClient.setQueryData(
          ['supplementCompliance', user?.id, today],
          context.previousCompliance
        );
      }
      // Show error toast with retry option
      toast.error("Failed to update supplement status", {
        description: "Your change was not saved. Please try again.",
        duration: 4000,
        action: {
          label: "Retry",
          onClick: () => {
            updateComplianceMutation.mutate(variables);
          }
        }
      });
    },
    onSuccess: (data, variables) => {
      // Show more specific success toast
      toast.success(
        variables.isTaken 
          ? `✓ ${variables.supplementName} marked as taken` 
          : `${variables.supplementName} unmarked`,
        { duration: 2000 }
      );
    },
    onSettled: () => {
      // Invalidate queries to refetch fresh data and ensure consistency
      queryClient.invalidateQueries({ queryKey: ['supplementCompliance', user?.id, today] });
      queryClient.invalidateQueries({ queryKey: ['supplementComplianceHistory', user?.id] });
    },
  });

  const handleSupplementToggle = (supplementName) => {
    // Determine the current state (if supplement is currently taken) based on optimistic data if available
    const currentComplianceData = queryClient.getQueryData(['supplementCompliance', user?.id, today]);
    const currentTaken = currentComplianceData?.supplements_taken || [];
    const isTaken = !currentTaken.includes(supplementName);

    // Call the mutation. Optimistic update handles UI immediately.
    updateComplianceMutation.mutate({ supplementName, isTaken });
  };

  const handlePlanCreated = (newPlan) => {
    queryClient.invalidateQueries({ queryKey: ['supplementPlan', user?.id] }); // Invalidate supplement plan
    setIsCreateDialogOpen(false);
    toast.success("Supplement plan created successfully!");
  };

  const handlePlanUpdated = (updatedPlan) => {
    queryClient.invalidateQueries({ queryKey: ['supplementPlan', user?.id] }); // Invalidate supplement plan
    setIsEditMode(false);
    toast.success("Supplement plan updated successfully!");
  };

  const handlePlanDeleted = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['supplementPlan', user?.id] }),
      queryClient.invalidateQueries({ queryKey: ['supplementCompliance', user?.id, today] }),
      queryClient.invalidateQueries({ queryKey: ['supplementComplianceHistory', user?.id] }),
    ]);
    
    setIsEditMode(false);
    toast.success("Supplement plan deleted successfully.");
  };

  const handleExportPDF = () => {
    window.print();
  };

  const scrollToTracking = () => {
    document.getElementById('daily-tracking')?.scrollIntoView({ behavior: 'smooth' });
  };

  const showFullPageLoader = userLoading || planLoading || complianceLoading || historyLoading;

  // If editing and not hasCoach, show detailed editor
  if (isEditMode && plan && !hasCoach) {
    return (
      <div className="p-6 md:p-8">
        <ClientSupplementPlanDetailView
          plan={plan}
          onBack={() => setIsEditMode(false)}
          onPlanUpdated={handlePlanUpdated}
          onPlanDeleted={handlePlanDeleted}
        />
      </div>
    );
  }

  if (showFullPageLoader) {
    return (
      <div className="p-6 md:p-8 space-y-8 animate-pulse">
        <div className="h-10 bg-secondary rounded w-1/2"></div>
        <div className="h-8 bg-secondary rounded w-3/4"></div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 bg-secondary rounded"></div>
          <div className="h-64 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  if (planError) {
    return (
      <div className="p-6 md:p-8 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Pill className="w-8 h-8 text-[#C5B358]" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">My Supplement Plan</h1>
          </div>
          <p className="text-muted-foreground">Your personalized supplement protocol.</p>
        </motion.div>

        <Card className="bg-[hsl(var(--destructive))]/10 border-[hsl(var(--destructive))]">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-[hsl(var(--destructive))]" />
            <h3 className="text-xl font-semibold text-[hsl(var(--destructive))] mb-2">Error Loading Plan</h3>
            <p className="text-[hsl(var(--destructive))]/80">{planError.message || "Failed to load your supplement plan. Please try refreshing the page."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const takenSupplements = todaysCompliance?.supplements_taken || [];
  const allSupplementsTaken = plan && plan.supplements && plan.supplements.length > 0 && 
    plan.supplements.every(s => takenSupplements.includes(s.name));
  
  const hasLoggedToday = todaysCompliance !== null && takenSupplements.length > 0;

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Pill className="w-8 h-8 text-[#C5B358]" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">My Supplement Plan</h1>
          </div>
          <p className="text-muted-foreground">
            {hasCoach 
              ? "Your personalized supplement protocol from your coach."
              : "Your custom supplement stack for optimal performance."}
          </p>
        </div>
        <div className="flex gap-3">
          {plan && (
            <Button onClick={handleExportPDF} variant="outline" className="border-border text-foreground">
              <Download className="w-4 h-4 mr-2" />
              Export / Print
            </Button>
          )}
          {!hasCoach && plan && (
            <Button
              onClick={() => setIsEditMode(true)}
              variant="outline"
              className="border-border text-foreground hover:bg-secondary"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Plan
            </Button>
          )}
          {!hasCoach && !plan && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          )}
        </div>
      </motion.div>

      {plan ? (
        <>
          {/* Daily Reminder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <DailyReminderCard 
              hasLoggedToday={hasLoggedToday}
              onLogNow={scrollToTracking}
            />
          </motion.div>

          {/* Adherence Stats */}
          {complianceHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-[#C5B358]" />
                Your Progress
              </h2>
              <AdherenceStats 
                complianceHistory={complianceHistory}
                plan={plan}
              />
            </motion.div>
          )}

          {/* Daily Tracking */}
          <motion.div
            id="daily-tracking"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className={`bg-card/50 backdrop-blur-xl ${allSupplementsTaken ? 'border-[hsl(var(--success))]' : 'border-border'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#C5B358]" />
                    Today's Tracking - {format(new Date(), 'MMM d, yyyy')}
                  </div>
                  {allSupplementsTaken && (
                    <div className="flex items-center gap-2 text-[hsl(var(--success))]">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-normal">All done!</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.supplements?.map((supplement, index) => {
                  const isTaken = takenSupplements.includes(supplement.name);
                  return (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${isTaken ? 'bg-[hsl(var(--success))]/10' : 'bg-secondary/50 hover:bg-secondary'}`}
                      onClick={() => handleSupplementToggle(supplement.name)}
                    >
                      <Checkbox 
                        checked={isTaken}
                        onCheckedChange={() => handleSupplementToggle(supplement.name)}
                        className="data-[state=checked]:bg-[hsl(var(--success))] data-[state=checked]:border-[hsl(var(--success))]"
                        disabled={updateComplianceMutation.isPending} // Disable checkbox while updating
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${isTaken ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {supplement.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {supplement.dosage} {supplement.timing && `• ${supplement.timing}`}
                        </div>
                      </div>
                      {isTaken && (
                        <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success))]" />
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs for Plan Details and History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs defaultValue="plan" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="plan">Supplement Plan</TabsTrigger>
                <TabsTrigger value="history">Compliance History</TabsTrigger>
              </TabsList>

              <TabsContent value="plan" className="space-y-6 mt-6">
                <h2 className="text-2xl font-bold text-foreground">{plan.name}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {plan.supplements?.map((supplement, index) => (
                    <ClientSupplementCard key={index} supplement={supplement} />
                  ))}
                </div>

                {plan.description && (
                  <Card className="bg-card/50 backdrop-blur-xl border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Info className="w-5 h-5 text-[#C5B358]" />
                        Coach's Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">{plan.description}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-6 mt-6">
                {complianceHistory.length > 0 ? (
                  <SupplementComplianceHistory 
                    complianceRecords={complianceHistory}
                    supplementPlan={plan}
                  />
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title="No Compliance History Yet"
                    description="Start tracking your supplements daily to see your adherence history and progress over time."
                    callToAction={
                      <Button onClick={scrollToTracking} className="bg-[#C5B358] hover:bg-[#A4913C] text-black">
                        <Pill className="w-4 h-4 mr-2" />
                        Log Today's Supplements
                      </Button>
                    }
                  />
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      ) : (
        <div className="text-center py-24">
          <Pill className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-50" />
          <h3 className="text-2xl font-semibold text-foreground mb-3">No Supplement Plan Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {hasCoach 
              ? "Your coach hasn't assigned a supplement plan to you yet. They may be working on creating the perfect protocol for your goals. Check back soon, or reach out to your coach to discuss your supplement needs!"
              : "Create your personalized supplement plan to track your daily intake and optimize your performance."}
          </p>
          {!hasCoach && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your Plan
            </Button>
          )}
        </div>
      )}

      {/* Create Plan Dialog */}
      <CreateSupplementPlanDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onPlanCreated={handlePlanCreated}
        isClientSelfManaged={!hasCoach}
        clientId={user?.id}
      />

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button, .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
