
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Changed: Added useQueryClient
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "../components/contexts/UserContext";

import CheckInForm from "../components/checkin/CheckInForm";
import CheckInTimeline from "../components/checkin/CheckInTimeline";
import EmptyState from "../components/ui/empty-state";
import SkeletonCard from "../components/ui/skeleton-card";

export default function CheckInJournal() {
  const { user, isLoading: userLoading, hasCoach } = useUser();
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient(); // Added: Initialize useQueryClient

  // ✅ Update query to handle self-managed clients
  const { data: checkIns = [], isLoading, refetch } = useQuery({
    queryKey: ['checkIns', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // ✅ For self-managed clients, their coach_id is their own user_id
      const effectiveCoachId = user.coach_id || user.id;
      
      return base44.entities.CheckIn.filter(
        { 
          client_id: user.id,
          coach_id: effectiveCoachId // ✅ Query with effective coach ID
        },
        "-created_date"
      );
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const handleSubmitSuccess = () => { // Changed: Removed newCheckIn parameter as it's not used
    setShowForm(false);
    refetch(); // Refetch check-ins
    
    // ✅ Invalidate client queries to update last check-in timestamp in UI
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    queryClient.invalidateQueries({ queryKey: ['client'] });
  };

  if (userLoading || isLoading) {
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
          icon={BookOpen}
          title="Authentication Required"
          description="Please log in to access your check-in journal"
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
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-[#C5B358]" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Check-In Journal</h1>
          </div>
          <p className="text-muted-foreground">
            {hasCoach 
              ? "Track your progress and share updates with your coach."
              : "Track your personal fitness progress and milestones."}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Check-In
        </Button>
      </motion.div>

      {/* Check-in Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CheckInForm user={user} onSubmitSuccess={handleSubmitSuccess} />
        </motion.div>
      )}

      {/* Check-in Timeline */}
      {checkIns.length > 0 ? (
        <CheckInTimeline checkIns={checkIns} />
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No Check-Ins Yet"
          description={
            hasCoach
              ? "Start tracking your progress by submitting your first check-in. Your coach will be able to review it and provide feedback."
              : "Start documenting your fitness journey. Track your weight, measurements, energy levels, and progress photos."
          }
          action={
            <Button
              onClick={() => setShowForm(true)}
              className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Submit Your First Check-In
            </Button>
          }
        />
      )}
    </div>
  );
}
