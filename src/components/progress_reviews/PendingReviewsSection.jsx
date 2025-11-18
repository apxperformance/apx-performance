import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, History, Image } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

export default function PendingReviewsSection({ 
  checkIns, 
  clients, 
  isLoading, 
  onReviewClick,
  isBulkMode,
  selectedIds,
  onToggleSelection,
  onViewHistory,
  onOpenPhotoGallery
}) {
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.full_name : "Unknown Client";
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-4">Pending Reviews</h2>
      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-card/50 animate-pulse rounded-lg"></div>)
        ) : checkIns.length > 0 ? (
          <AnimatePresence>
            {checkIns.map(checkIn => (
              <motion.div
                key={checkIn.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card 
                  className={`bg-card/50 backdrop-blur-xl border-border hover:border-[#C5B358]/30 transition-all duration-300 ${!isBulkMode ? 'cursor-pointer' : ''}`}
                  onClick={() => !isBulkMode && onReviewClick(checkIn)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {isBulkMode && (
                        <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(checkIn.id)}
                            onCheckedChange={() => onToggleSelection(checkIn.id)}
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-foreground">{getClientName(checkIn.client_id)}</p>
                            <p className="text-sm text-muted-foreground">
                              Submitted {formatDistanceToNow(new Date(checkIn.created_date), { addSuffix: true })}
                            </p>
                          </div>
                          {!isBulkMode && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                        </div>
                        
                        <div className="flex gap-2 flex-wrap items-center">
                          <Badge className="bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30">
                            Needs Review
                          </Badge>
                          
                          {checkIn.progress_photos && checkIn.progress_photos.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenPhotoGallery(checkIn);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <Image className="w-3 h-3 mr-1" />
                              {checkIn.progress_photos.length} photos
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewHistory(checkIn.client_id);
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            <History className="w-3 h-3 mr-1" />
                            History
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <p className="text-muted-foreground text-center py-8">No pending reviews. Great job!</p>
        )}
      </div>
    </div>
  );
}