
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Send, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useUser } from "../components/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { calculateCoachTier, getCoachTierInfo } from "../components/contexts/UserContext";
import CoachTierBadge from "../components/ui/coach-tier-badge";

export default function BrowseCoaches() {
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Redirect if user already has a coach
  useEffect(() => {
    if (user?.coach_id) {
      toast.info("You already have a coach!");
      navigate(createPageUrl("ClientDashboard"));
    }
  }, [user, navigate]);

  // Fetch all coaches with their active client count
  const { data: coaches = [], isLoading } = useQuery({
    queryKey: ['allCoaches'],
    queryFn: async () => {
      const coachUsers = await base44.entities.User.filter({ user_type: 'coach' });
      
      // For each coach, get their active client count and calculate tier
      const coachesWithTiers = await Promise.all(
        coachUsers.map(async (coach) => {
          const clients = await base44.entities.Client.filter({ 
            coach_id: coach.id,
            status: 'active'
          });
          const activeClientCount = clients.length;
          const tier = calculateCoachTier(activeClientCount);
          const tierInfo = getCoachTierInfo(tier);
          
          return {
            ...coach,
            activeClientCount,
            tier,
            tierInfo
          };
        })
      );
      
      // Sort by tier (Elite > Pro > Associate), then by client count
      return coachesWithTiers.sort((a, b) => {
        const tierOrder = { elite: 0, pro: 1, associate: 2 };
        if (tierOrder[a.tier] !== tierOrder[b.tier]) {
          return tierOrder[a.tier] - tierOrder[b.tier];
        }
        return b.activeClientCount - a.activeClientCount;
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user's pending requests
  const { data: myRequests = [] } = useQuery({
    queryKey: ['myCoachRequests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.CoachConnectionRequest.filter({ 
        client_id: user.id,
        status: 'pending'
      });
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  // Send connection request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async ({ coachId, message }) => {
      if (!user) throw new Error("User not found");

      const existing = await base44.entities.CoachConnectionRequest.filter({
        client_id: user.id,
        coach_id: coachId,
        status: 'pending'
      });

      if (existing.length > 0) {
        throw new Error("You already have a pending request to this coach");
      }

      return base44.entities.CoachConnectionRequest.create({
        client_id: user.id,
        coach_id: coachId,
        client_name: user.full_name,
        client_email: user.email,
        coach_name: selectedCoach.full_name,
        message: message || "",
        status: 'pending'
      });
    },
    onSuccess: () => {
      toast.success("Request sent! The coach will review your request.");
      queryClient.invalidateQueries({ queryKey: ['myCoachRequests'] });
      handleDialogClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send request");
    }
  });

  const handleRequestCoach = (coach) => {
    setSelectedCoach(coach);
    setIsDialogOpen(true);
  };

  const handleSendRequest = () => {
    if (!selectedCoach) return;
    sendRequestMutation.mutate({
      coachId: selectedCoach.id,
      message: requestMessage
    });
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedCoach(null);
    setRequestMessage("");
  };

  // Check if user has already requested a specific coach
  const hasRequestedCoach = (coachId) => {
    return myRequests.some(req => req.coach_id === coachId);
  };

  // Filter coaches by search term
  const filteredCoaches = coaches.filter(coach => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      coach.full_name.toLowerCase().includes(searchLower) ||
      coach.bio?.toLowerCase().includes(searchLower) ||
      coach.specializations?.some(s => s.toLowerCase().includes(searchLower))
    );
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C5B358] border-t-transparent rounded-full animate-spin"></div>
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
            <Users className="w-8 h-8 text-[#C5B358]" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Find Your Coach</h1>
          </div>
          <p className="text-muted-foreground">Browse our coaches and request to join their program.</p>
        </div>
      </motion.div>

      {/* Pending Requests Banner */}
      {myRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-[#C5B358]/10 border border-[#C5B358]/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#C5B358] flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  You have {myRequests.length} pending request{myRequests.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {myRequests.map(req => req.coach_name).join(', ')} will review your request soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Input
          placeholder="Search coaches by name, bio, or specialization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 bg-input border-border focus:border-[#C5B358]"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Coach Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur-xl border-border animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-secondary rounded-full mx-auto"></div>
                  <div className="h-6 bg-secondary rounded"></div>
                  <div className="h-20 bg-secondary rounded"></div>
                  <div className="h-10 bg-secondary rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCoaches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoaches.map((coach, index) => {
            const hasPendingRequest = hasRequestedCoach(coach.id);
            
            return (
              <motion.div
                key={coach.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`bg-card/50 backdrop-blur-xl border-border hover:border-${coach.tier === 'elite' ? '[#C5B358]' : coach.tier === 'pro' ? 'blue-500' : 'amber-500'}/30 transition-all duration-300 h-full flex flex-col`}>
                  <CardContent className="p-6 flex flex-col flex-1">
                    {/* Coach Avatar & Name */}
                    <div className="text-center mb-4">
                      <Avatar className={`w-20 h-20 mx-auto mb-3 border-2 border-${coach.tier === 'elite' ? '[#C5B358]' : coach.tier === 'pro' ? 'blue-400' : 'amber-600'}`}>
                        <AvatarImage src={coach.profile_image} alt={coach.full_name} />
                        <AvatarFallback className={`${coach.tierInfo.bgColor} ${coach.tierInfo.color} text-xl font-bold`}>
                          {coach.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-foreground">{coach.full_name}</h3>
                      </div>
                      <CoachTierBadge tier={coach.tier} />
                      <p className="text-xs text-muted-foreground mt-1">
                        {coach.activeClientCount} active client{coach.activeClientCount !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Bio */}
                    <div className="flex-1 mb-4">
                      {coach.bio ? (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {coach.bio}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No bio available
                        </p>
                      )}
                    </div>

                    {/* Specializations */}
                    {coach.specializations && coach.specializations.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">SPECIALIZATIONS</p>
                        <div className="flex flex-wrap gap-1">
                          {coach.specializations.slice(0, 3).map((spec, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {coach.specializations.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{coach.specializations.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    {hasPendingRequest ? (
                      <Button
                        disabled
                        className="w-full bg-secondary text-muted-foreground cursor-not-allowed"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Request Pending
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRequestCoach(coach)}
                        className="w-full bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Request Coach
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="py-16 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Coaches Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Try adjusting your search terms" : "No coaches are currently available"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Send className="w-5 h-5 text-[#C5B358]" />
              Request {selectedCoach?.full_name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send a request to connect with this coach. They will review your request and decide whether to accept you into their program.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Coach Preview */}
            {selectedCoach && (
              <Card className="bg-secondary/30 border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar className="w-12 h-12 border border-[#C5B358]">
                    <AvatarImage src={selectedCoach.profile_image} alt={selectedCoach.full_name} />
                    <AvatarFallback className={`${selectedCoach.tierInfo.bgColor} ${selectedCoach.tierInfo.color} font-bold`}>
                      {selectedCoach.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{selectedCoach.full_name}</p>
                    <CoachTierBadge tier={selectedCoach.tier} showIcon={false} className="text-xs" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Message Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Message (Optional)
              </label>
              <Textarea
                placeholder="Tell the coach about your fitness goals, experience level, and why you'd like to work with them..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
                className="bg-input border-border focus:border-[#C5B358] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                A personalized message can help coaches understand your needs better.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDialogClose}
              disabled={sendRequestMutation.isPending}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendRequest}
              disabled={sendRequestMutation.isPending}
              className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
            >
              {sendRequestMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
