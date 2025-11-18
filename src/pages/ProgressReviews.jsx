
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Search, X, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

import ReviewCheckInDialog from "../components/progress_reviews/ReviewCheckInDialog";
import ScheduleCheckInDialog from "../components/progress_reviews/ScheduleCheckInDialog";
import PendingReviewsSection from "../components/progress_reviews/PendingReviewsSection";
import RecentlyReviewedSection from "../components/progress_reviews/RecentlyReviewedSection";
import ReviewStatsCards from "../components/progress_reviews/ReviewStatsCards";
import BulkReviewDialog from "../components/progress_reviews/BulkReviewDialog";
import PhotoGalleryDialog from "../components/progress_reviews/PhotoGalleryDialog";
import CheckInHistoryDialog from "../components/progress_reviews/CheckInHistoryDialog";

export default function ProgressReviews() {
  const [clients, setClients] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [supplementPlans, setSupplementPlans] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [nutritionPlans, setNutritionPlans] = useState([]);
  const [supplementCompliance, setSupplementCompliance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Bulk actions state
  const [selectedCheckInIds, setSelectedCheckInIds] = useState(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isBulkReviewDialogOpen, setIsBulkReviewDialogOpen] = useState(false);
  
  // Gallery & History state
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyClientId, setHistoryClientId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const [clientData, checkInData, supplementData, workoutData, nutritionData, complianceData] = await Promise.all([
        base44.entities.Client.filter({ coach_id: user.id }),
        base44.entities.CheckIn.filter({ coach_id: user.id }, "-created_date"),
        base44.entities.SupplementPlan.filter({ coach_id: user.id }),
        base44.entities.Workout.filter({ coach_id: user.id }),
        base44.entities.NutritionPlan.filter({ coach_id: user.id }),
        base44.entities.SupplementCompliance.list("-date")
      ]);

      setClients(clientData);
      setCheckIns(checkInData);
      setSupplementPlans(supplementData);
      setWorkouts(workoutData);
      setNutritionPlans(nutritionData);
      setSupplementCompliance(complianceData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleOpenReviewDialog = (checkIn) => {
    setSelectedCheckIn(checkIn);
    setIsReviewDialogOpen(true);
  };

  const handleProvideFeedback = async (checkInId, feedback) => {
    try {
      await base44.entities.CheckIn.update(checkInId, {
        coach_feedback: feedback,
        updated_date: new Date().toISOString()
      });
      loadData();
      setIsReviewDialogOpen(false);
      toast.success("Feedback submitted successfully!");
    } catch (error) {
      console.error("Error providing feedback:", error);
      toast.error("Failed to submit feedback");
    }
  };

  const handleScheduleReview = async (checkIn, scheduleTime) => {
    try {
      const client = clients.find((c) => c.id === checkIn.client_id);
      const user = await base44.auth.me();
      const startTime = new Date(scheduleTime);
      const endTime = new Date(startTime.getTime() + 30 * 60000);

      await base44.entities.CalendarEvent.create({
        title: `Review Check-in for ${client?.full_name}`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        event_type: 'review',
        coach_id: user.id,
        client_id: client.id,
        check_in_id: checkIn.id
      });

      setIsReviewDialogOpen(false);
      toast.success("Review scheduled successfully!");
    } catch (error) {
      console.error("Error scheduling review:", error);
      toast.error("Failed to schedule review");
    }
  };

  const handleScheduleCheckIn = async (clientId, scheduleTime, notes) => {
    try {
      const client = clients.find((c) => c.id === clientId);
      const user = await base44.auth.me();
      const startTime = new Date(scheduleTime);
      const endTime = new Date(startTime.getTime() + 30 * 60000);

      await base44.entities.CalendarEvent.create({
        title: `Check-In: ${client?.full_name}`,
        description: notes || `Scheduled check-in session with ${client?.full_name}`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        event_type: 'check-in',
        coach_id: user.id,
        client_id: clientId
      });

      setIsScheduleDialogOpen(false);
      toast.success("Check-in scheduled successfully!");
    } catch (error) {
      console.error("Error scheduling check-in:", error);
      toast.error("Failed to schedule check-in");
    }
  };

  // Bulk actions
  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    setSelectedCheckInIds(new Set());
  };

  const toggleCheckInSelection = (checkInId) => {
    const newSelection = new Set(selectedCheckInIds);
    if (newSelection.has(checkInId)) {
      newSelection.delete(checkInId);
    } else {
      newSelection.add(checkInId);
    }
    setSelectedCheckInIds(newSelection);
  };

  const selectAllPending = () => {
    const allPendingIds = new Set(pendingCheckIns.map(c => c.id));
    setSelectedCheckInIds(allPendingIds);
  };

  const handleBulkReview = async (feedback) => {
    try {
      const updatePromises = Array.from(selectedCheckInIds).map(checkInId =>
        base44.entities.CheckIn.update(checkInId, {
          coach_feedback: feedback,
          updated_date: new Date().toISOString()
        })
      );

      await Promise.all(updatePromises);
      loadData();
      setSelectedCheckInIds(new Set());
      setIsBulkMode(false);
      setIsBulkReviewDialogOpen(false);
      toast.success(`${selectedCheckInIds.size} check-ins reviewed successfully!`);
    } catch (error) {
      console.error("Error bulk reviewing:", error);
      toast.error("Failed to review check-ins");
    }
  };

  // Photo gallery
  const handleOpenPhotoGallery = (checkIn) => {
    if (checkIn.progress_photos && checkIn.progress_photos.length > 0) {
      setGalleryPhotos(checkIn.progress_photos.map((url, index) => ({
        url,
        date: checkIn.created_date,
        clientName: getClientName(checkIn.client_id),
        index: index + 1,
        total: checkIn.progress_photos.length
      })));
      setIsPhotoGalleryOpen(true);
    }
  };

  // Check-in history
  const handleViewHistory = (clientId) => {
    setHistoryClientId(clientId);
    setIsHistoryDialogOpen(true);
  };

  // Message client
  const handleMessageClient = (clientId) => {
    window.location.href = `${createPageUrl("ClientChat")}?clientId=${clientId}`;
  };

  const pendingCheckIns = checkIns
    .filter((c) => !c.coach_feedback)
    .filter((c) => {
      if (!searchTerm) return true;
      const client = clients.find((cl) => cl.id === c.client_id);
      return client?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());

  const reviewedCheckIns = checkIns
    .filter((c) => c.coach_feedback)
    .sort((a, b) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime());

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.full_name : "Unknown Client";
  };

  const getClientContext = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    const clientWorkouts = workouts.filter((w) => w.client_id === clientId);
    const clientNutrition = nutritionPlans.find((n) => n.client_id === clientId);
    const clientSupplements = supplementPlans.find((s) => s.client_id === clientId);

    return {
      client,
      workouts: clientWorkouts,
      nutritionPlan: clientNutrition,
      supplementPlan: clientSupplements
    };
  };

  const getSupplementComplianceForCheckIn = (checkIn) => {
    if (!checkIn || !checkIn.created_date) return null;
    const checkInDate = new Date(checkIn.created_date).toISOString().split('T')[0];
    return supplementCompliance.find((sc) =>
      sc.client_id === checkIn.client_id &&
      sc.date === checkInDate
    );
  };

  // Enhanced stats calculation
  const reviewsThisWeek = reviewedCheckIns.filter((c) => {
    const reviewDate = new Date(c.updated_date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return reviewDate > weekAgo;
  }).length;

  // Calculate average response time
  const averageResponseTime = (() => {
    const reviewedWithFeedback = reviewedCheckIns.filter(c => c.updated_date && c.created_date);
    if (reviewedWithFeedback.length === 0) return 0;
    
    const totalHours = reviewedWithFeedback.reduce((sum, checkIn) => {
      const created = new Date(checkIn.created_date);
      const reviewed = new Date(checkIn.updated_date);
      const hours = (reviewed - created) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    
    return Math.round(totalHours / reviewedWithFeedback.length);
  })();

  // Clients who haven't checked in recently (30+ days)
  const inactiveClients = clients.filter(client => {
    const clientCheckIns = checkIns.filter(c => c.client_id === client.id);
    if (clientCheckIns.length === 0) return true;
    
    const latestCheckIn = clientCheckIns.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    )[0];
    
    const daysSinceCheckIn = (Date.now() - new Date(latestCheckIn.created_date)) / (1000 * 60 * 60 * 24);
    return daysSinceCheckIn > 30;
  }).length;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <ReviewStatsCards
        pendingCount={pendingCheckIns.length}
        reviewsThisWeek={reviewsThisWeek}
        totalCheckIns={checkIns.length}
        averageResponseTime={averageResponseTime}
        inactiveClients={inactiveClients}
        onScheduleClick={() => setIsScheduleDialogOpen(true)}
      />

      {/* Search & Bulk Actions Bar */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <Input
            placeholder="Search by client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 bg-input border-border focus:border-[#C5B358]"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bulk Actions */}
        <div className="flex gap-2">
          <Button
            variant={isBulkMode ? "default" : "outline"}
            onClick={toggleBulkMode}
            className={isBulkMode ? "bg-[#C5B358] hover:bg-[#A4913C] text-black" : "border-border"}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            {isBulkMode ? "Cancel Bulk" : "Bulk Review"}
          </Button>

          {isBulkMode && (
            <>
              <Button
                variant="outline"
                onClick={selectAllPending}
                disabled={pendingCheckIns.length === 0}
                className="border-border"
              >
                Select All ({pendingCheckIns.length})
              </Button>

              <Button
                onClick={() => setIsBulkReviewDialogOpen(true)}
                disabled={selectedCheckInIds.size === 0}
                className="bg-primary hover:bg-primary/90"
              >
                Review Selected ({selectedCheckInIds.size})
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <PendingReviewsSection
          checkIns={pendingCheckIns}
          clients={clients}
          isLoading={isLoading}
          onReviewClick={handleOpenReviewDialog}
          isBulkMode={isBulkMode}
          selectedIds={selectedCheckInIds}
          onToggleSelection={toggleCheckInSelection}
          onViewHistory={handleViewHistory}
          onOpenPhotoGallery={handleOpenPhotoGallery}
        />

        <RecentlyReviewedSection
          checkIns={reviewedCheckIns.slice(0, 5)}
          clients={clients}
          isLoading={isLoading}
        />
      </div>

      {selectedCheckIn && (
        <ReviewCheckInDialog
          isOpen={isReviewDialogOpen}
          onClose={() => setIsReviewDialogOpen(false)}
          checkIn={selectedCheckIn}
          clientContext={getClientContext(selectedCheckIn.client_id)}
          compliance={getSupplementComplianceForCheckIn(selectedCheckIn)}
          onProvideFeedback={handleProvideFeedback}
          onScheduleReview={handleScheduleReview}
          onOpenPhotoGallery={() => handleOpenPhotoGallery(selectedCheckIn)}
          onViewHistory={() => handleViewHistory(selectedCheckIn.client_id)}
          onMessageClient={() => handleMessageClient(selectedCheckIn.client_id)}
        />
      )}

      <ScheduleCheckInDialog
        isOpen={isScheduleDialogOpen}
        onClose={() => setIsScheduleDialogOpen(false)}
        clients={clients}
        onSchedule={handleScheduleCheckIn}
      />

      <BulkReviewDialog
        isOpen={isBulkReviewDialogOpen}
        onClose={() => setIsBulkReviewDialogOpen(false)}
        selectedCount={selectedCheckInIds.size}
        onSubmit={handleBulkReview}
      />

      <PhotoGalleryDialog
        isOpen={isPhotoGalleryOpen}
        onClose={() => setIsPhotoGalleryOpen(false)}
        photos={galleryPhotos}
      />

      <CheckInHistoryDialog
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
        clientId={historyClientId}
        checkIns={checkIns.filter(c => c.client_id === historyClientId)}
        clientName={historyClientId ? getClientName(historyClientId) : ""}
      />
    </div>
  );
}
