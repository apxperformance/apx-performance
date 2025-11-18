import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { MessageSquare, Clock, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TimelineSkeleton = () => (
    <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="pl-8 relative border-l-2 border-gray-700">
                <div className="w-4 h-4 bg-gray-600 rounded-full absolute -left-[9px] top-1 animate-pulse"></div>
                <div className="space-y-3">
                    <div className="h-5 bg-gray-700 rounded animate-pulse w-1/4"></div>
                    <div className="h-24 bg-gray-800 rounded-lg animate-pulse"></div>
                </div>
            </div>
        ))}
    </div>
);

export default function CheckInTimeline({ checkIns, isLoading }) {
  // ✅ Pagination state
  const [displayCount, setDisplayCount] = useState(5);
  const LOAD_MORE_COUNT = 5;

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (checkIns.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <h3 className="text-xl font-semibold text-foreground">No History Yet</h3>
        <p>Your past check-ins will appear here.</p>
      </div>
    );
  }

  // ✅ Slice check-ins based on display count
  const displayedCheckIns = checkIns.slice(0, displayCount);
  const hasMore = displayCount < checkIns.length;
  const remainingCount = checkIns.length - displayCount;

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + LOAD_MORE_COUNT, checkIns.length));
  };

  const handleShowAll = () => {
    setDisplayCount(checkIns.length);
  };

  return (
    <div className="space-y-6">
      {/* ✅ Display count indicator */}
      {checkIns.length > 5 && (
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg text-sm">
          <div className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{displayedCheckIns.length}</span> of{" "}
            <span className="font-semibold text-foreground">{checkIns.length}</span> check-ins
          </div>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowAll}
              className="text-[#C5B358] hover:text-[#C5B358] hover:bg-[#C5B358]/10"
            >
              Show All
            </Button>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-8">
        <AnimatePresence>
          {displayedCheckIns.map((checkIn, index) => {
            // ✅ Check if this is an optimistic (pending) check-in
            const isPending = checkIn.id?.toString().startsWith('temp-');
            
            return (
              <motion.div
                key={checkIn.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`pl-8 relative border-l-2 ${isPending ? 'border-[#C5B358]/50' : 'border-border'}`}
              >
                {/* ✅ Different indicator for pending vs confirmed check-ins */}
                <div className={`w-4 h-4 rounded-full absolute -left-[9px] top-1 ${
                  isPending 
                    ? 'bg-[#C5B358] animate-pulse' 
                    : checkIn.coach_feedback 
                      ? 'bg-yellow-500' 
                      : 'bg-secondary'
                }`}></div>
                
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold text-foreground">
                    {format(new Date(checkIn.created_date), "MMMM d, yyyy")}
                  </p>
                  {/* ✅ Show "Saving..." badge for optimistic updates */}
                  {isPending && (
                    <Badge variant="outline" className="border-[#C5B358] text-[#C5B358] text-xs">
                      <Clock className="w-3 h-3 mr-1 animate-spin" />
                      Saving...
                    </Badge>
                  )}
                </div>
                
                <Card className={`bg-card/50 backdrop-blur-xl border transition-all duration-200 ${
                  isPending 
                    ? 'border-[#C5B358]/30 opacity-90' 
                    : checkIn.coach_feedback 
                      ? 'border-yellow-500/30' 
                      : 'border-border'
                }`}>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                          <p className="text-sm text-muted-foreground">Weight</p>
                          <p className="text-lg font-bold text-foreground">{checkIn.weight} lbs</p>
                      </div>
                      <div className="text-center">
                          <p className="text-sm text-muted-foreground">Energy</p>
                          <p className="text-lg font-bold text-foreground">{checkIn.energy_level}/10</p>
                      </div>
                      <div className="text-center">
                          <p className="text-sm text-muted-foreground">Sleep</p>
                          <p className="text-lg font-bold text-foreground">{checkIn.sleep_hours} hrs</p>
                      </div>
                      <div className="text-center">
                          <p className="text-sm text-muted-foreground">Stress</p>
                          <p className="text-lg font-bold text-foreground">{checkIn.stress_level}/10</p>
                      </div>
                    </div>
                    {checkIn.notes && <p className="text-foreground/80 italic">"{checkIn.notes}"</p>}
                    {checkIn.progress_photos && checkIn.progress_photos.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {checkIn.progress_photos.map((photo, i) => (
                          <a key={i} href={photo} target="_blank" rel="noopener noreferrer">
                            <img src={photo} alt={`Progress ${i + 1}`} className="w-16 h-16 object-cover rounded-md hover:opacity-80 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    )}
                    {checkIn.coach_feedback && (
                      <div className="p-3 bg-yellow-500/10 rounded-lg mt-3">
                        <h4 className="font-semibold text-yellow-400 mb-1">Coach's Feedback</h4>
                        <p className="text-sm text-foreground/80">{checkIn.coach_feedback}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ✅ Load More Button */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 pt-4"
        >
          <Button
            onClick={handleLoadMore}
            variant="outline"
            className="border-[#C5B358] text-[#C5B358] hover:bg-[#C5B358]/10"
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Load More ({Math.min(LOAD_MORE_COUNT, remainingCount)} of {remainingCount} remaining)
          </Button>
          <button
            onClick={handleShowAll}
            className="text-sm text-muted-foreground hover:text-[#C5B358] transition-colors"
          >
            or show all {remainingCount} remaining check-ins
          </button>
        </motion.div>
      )}
    </div>
  );
}