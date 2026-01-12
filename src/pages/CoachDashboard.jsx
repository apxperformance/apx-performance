import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Dumbbell, Calendar, Crown, Pill, Utensils, MessageSquare, CalendarClock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { useUser } from "../components/contexts/UserContext";
import { useClients } from "../components/contexts/ClientsContext";

import AddNewClientDialog from "../components/clients/AddNewClientDialog";
import AddExistingClientDialog from "../components/clients/AddExistingClientDialog";

export default function CoachDashboard() {
  const { user, coachTierInfo, activeClientCount, refreshCoachTier } = useUser();
  const { clients, isLoading: clientsLoading, refreshClients } = useClients();
  const [isAddNewClientOpen, setIsAddNewClientOpen] = useState(false);
  const [isAddExistingClientOpen, setIsAddExistingClientOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        return base44.entities.Workout.filter({ coach_id: user.id });
      } catch (error) {
        console.error("Workouts fetch error:", error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: nutritionPlans = [] } = useQuery({
    queryKey: ['nutritionPlans', user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        return base44.entities.NutritionPlan.filter({ coach_id: user.id });
      } catch (error) {
        console.error("Nutrition plans fetch error:", error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['calendarEvents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        return base44.entities.CalendarEvent.filter({ coach_id: user.id });
      } catch (error) {
        console.error("Calendar events fetch error:", error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000,
  });

  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['unreadMessages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.ChatMessage.filter({
        coach_id: user.id,
        sender_type: 'client',
        is_read: false
      });
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const { data: supplementPlans = [] } = useQuery({
    queryKey: ['supplementPlans', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.SupplementPlan.filter({ coach_id: user.id });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentCheckIns = [] } = useQuery({
    queryKey: ['recentCheckIns', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.CheckIn.filter({ coach_id: user.id }, "-created_date", 5);
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  // Fixed query for available clients - filter out clients already associated with this coach
  const { data: availableClients = [], isLoading: availableClientsLoading } = useQuery({
    queryKey: ['availableClients', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Fetch all available clients
      const allAvailable = await base44.entities.AvailableClient.list("-date_available", 20);
      
      // Get user IDs of clients already associated with this coach
      const existingClientUserIds = new Set(
        clients
          .map(c => c.user_id)
          .filter(Boolean) // Remove null/undefined values
      );
      
      // Filter out clients that are already in this coach's roster
      const trulyAvailable = allAvailable.filter(
        ac => !existingClientUserIds.has(ac.user_id)
      );
      
      return trulyAvailable;
    },
    enabled: !!user && !clientsLoading, // Wait for clients to load first
    staleTime: 2 * 60 * 1000,
  });

  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === 'active').length,
    pendingInvites: clients.filter(c => c.status === 'pending_invitation').length,
    workoutTemplates: workouts.filter(w => w.is_template).length,
    nutritionPlans: nutritionPlans.length,
    supplementPlans: supplementPlans.length,
    pendingReviews: recentCheckIns.filter(ci => !ci.coach_feedback).length,
    unreadClientMessages: unreadMessages.length,
    todaysEventsCount: 0,
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysEvents = calendarEvents
    .filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate >= today && eventDate < tomorrow;
    })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .map(event => {
      const client = clients.find(c => c.id === event.client_id);
      return {
        ...event,
        clientName: client ? client.full_name : 'Personal Event',
        clientId: event.client_id || null
      };
    });

  stats.todaysEventsCount = todaysEvents.length;

  const recentClients = clients
    .filter(c => c.status === 'active')
    .sort((a, b) => {
      const dateA = new Date(a.join_date || a.created_date);
      const dateB = new Date(b.join_date || b.created_date);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  const handleAddNewClient = async (clientData) => {
    try {
      if (!user) return;

      const invitationToken = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await base44.entities.Client.create({
        full_name: `${clientData.first_name} ${clientData.last_name}`.trim(),
        email: clientData.email,
        phone: clientData.phone || "",
        coach_id: user.id,
        status: "pending_invitation",
        invitation_token: invitationToken
      });

      const inviteLink = `${window.location.origin}${createPageUrl("Welcome")}?invitationToken=${invitationToken}`;

      await base44.integrations.Core.SendEmail({
        to: clientData.email,
        subject: `${user.full_name} has invited you to join Level Up`,
        body: `Hi ${clientData.first_name},\n\n${user.full_name} has invited you to join their coaching program on Level Up.\n\nClick here to get started: ${inviteLink}\n\nLooking forward to working with you!\n\n- ${user.full_name}`
      });

      refreshClients();
      refreshCoachTier();
      setIsAddNewClientOpen(false);
      toast.success("Invitation sent successfully!");
    } catch (error) {
      console.error("Error inviting client:", error);
      toast.error("Failed to send invitation");
    }
  };

  const handleAddExistingClient = async (selectedClients) => {
    try {
      if (!user) return;

      // Process each selected client
      for (const availableClient of selectedClients) {
        // Create client record with pending_link status
        await base44.entities.Client.create({
          user_id: availableClient.user_id,
          full_name: availableClient.full_name,
          email: availableClient.email,
          profile_image: availableClient.profile_image || "",
          coach_id: user.id,
          status: "pending_link",
          join_date: new Date().toISOString()
        });

        // Update the user's coach_id to link them to this coach
        await base44.entities.User.update(availableClient.user_id, { coach_id: user.id });

        // Remove from available pool
        await base44.entities.AvailableClient.delete(availableClient.id);
      }

      refreshClients(); // Refresh the list of clients for the coach
      refreshCoachTier(); // Recalculate tier based on new active clients
      queryClient.invalidateQueries({ queryKey: ['availableClients'] }); // Refresh the available clients list
      setIsAddExistingClientOpen(false);
      toast.success(`${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''} added successfully!`);
    } catch (error) {
      console.error("Error adding existing clients:", error);
      toast.error("Failed to add clients");
    }
  };

  const formatEventTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateEventDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMinutes = Math.round((end - start) / 60000);
    return `${durationMinutes} min`;
  };

  const isLoading = !user || clientsLoading;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8 text-gray-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Coach Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Welcome back, coach. Here's your training empire.</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl("ClientManagement")}>
            <Button className="bg-gray-800 hover:bg-gray-700 text-white font-semibold">
              <Users className="w-4 h-4 mr-2" />
              Manage Clients
            </Button>
          </Link>
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-secondary"
            onClick={() => setIsAddNewClientOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            New Client
          </Button>
        </div>
      </motion.div>

      {/* Coach Tier Progress Card */}
      {coachTierInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`bg-card/50 backdrop-blur-xl border ${coachTierInfo.borderColor}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl ${coachTierInfo.bgColor} flex items-center justify-center`}>
                    <span className="text-3xl">{coachTierInfo.icon}</span>
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold ${coachTierInfo.color}`}>{coachTierInfo.name}</h3>
                    <p className="text-muted-foreground">
                      {activeClientCount} active client{activeClientCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                {coachTierInfo.nextTier && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">
                      Next: {coachTierInfo.nextTier}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${coachTierInfo.bgColor.replace('/20', '')}`}
                          style={{ width: `${(activeClientCount / coachTierInfo.nextThreshold) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {coachTierInfo.nextThreshold - activeClientCount} more
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur-xl border-border animate-pulse">
              <CardContent className="p-6">
                <div className="h-24"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-gray-400/30 transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = createPageUrl("ClientManagement")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 bg-opacity-20">
                    <Users className="w-6 h-6 text-gray-200" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">{stats.activeClients}</div>
                    <div className="text-xs text-muted-foreground">{stats.totalClients - stats.activeClients} inactive</div>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Active Clients</h3>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-gray-400/30 transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = createPageUrl("ClientManagement")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 bg-opacity-20">
                    <UserPlus className="w-6 h-6 text-gray-200" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">{stats.pendingInvites}</div>
                    <div className="text-xs text-muted-foreground">Awaiting registration</div>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Pending Invites</h3>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-gray-400/30 transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = createPageUrl("WorkoutBuilder")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 bg-opacity-20">
                    <Dumbbell className="w-6 h-6 text-gray-200" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">{stats.workoutTemplates}</div>
                    <div className="text-xs text-muted-foreground">Ready to assign</div>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Workout Templates</h3>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-gray-400/30 transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = createPageUrl("NutritionPlanner")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 bg-opacity-20">
                    <Utensils className="w-6 h-6 text-gray-200" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">{stats.nutritionPlans}</div>
                    <div className="text-xs text-muted-foreground">Meal plans created</div>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Nutrition Plans</h3>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-gray-400/30 transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = createPageUrl("SupplementPlanner")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 bg-opacity-20">
                    <Pill className="w-6 h-6 text-gray-200" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">{stats.supplementPlans}</div>
                    <div className="text-xs text-muted-foreground">Protocols created</div>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Supplement Plans</h3>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-gray-400/30 transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = createPageUrl("ProgressReviews")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 bg-opacity-20">
                    <Calendar className="w-6 h-6 text-gray-200" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">{stats.pendingReviews}</div>
                    <div className="text-xs text-muted-foreground">Client check-ins due</div>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Pending Reviews</h3>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-gray-400/30 transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = createPageUrl("CoachingCalendar")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 bg-opacity-20">
                    <CalendarClock className="w-6 h-6 text-gray-200" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">{stats.todaysEventsCount}</div>
                    <div className="text-xs text-muted-foreground">Scheduled sessions</div>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Due Today</h3>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-gray-400/30 transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = createPageUrl("ClientChat")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 bg-opacity-20">
                    <MessageSquare className="w-6 h-6 text-gray-200" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">{stats.unreadClientMessages}</div>
                    <div className="text-xs text-muted-foreground">Unread messages</div>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Client Messages</h3>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                Active Clients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-secondary rounded animate-pulse mb-1"></div>
                        <div className="h-3 bg-secondary rounded animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentClients.length > 0 ? (
                recentClients.map((client) => (
                  <Link
                    key={client.id}
                    to={`${createPageUrl("ClientProfile")}?clientId=${client.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                      <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {client.full_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground hover:text-gray-600 transition-colors">{client.full_name}</div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                      </div>
                      <div className="text-xs text-muted-foreground/80">
                        Joined {new Date(client.join_date || client.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No active clients yet</p>
                  <p className="text-sm">Invite a client to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Available Clients Pool Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-gray-600" />
                  Available Clients
                </CardTitle>
                {availableClients.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddExistingClientOpen(true)}
                    className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                  >
                    View All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading || availableClientsLoading ? ( // Using the combined isLoading for general dashboard loading feel
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-secondary rounded animate-pulse mb-1"></div>
                        <div className="h-3 bg-secondary rounded animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : availableClients.length > 0 ? (
                <>
                  {availableClients.slice(0, 5).map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center shrink-0">
                        {client.profile_image ? (
                          <img src={client.profile_image} alt={client.full_name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <span className="text-white font-semibold text-sm">
                            {client.full_name?.charAt(0).toUpperCase() || "?"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{client.full_name || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground truncate">{client.email}</div>
                        {client.fitness_goals && client.fitness_goals.length > 0 && (
                          <div className="text-xs text-muted-foreground truncate">
                            Goals: {client.fitness_goals.slice(0, 2).join(', ')}
                            {client.fitness_goals.length > 2 && '...'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    onClick={() => setIsAddExistingClientOpen(true)}
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-secondary mt-4"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add from Pool
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No available clients</p>
                  <p className="text-sm">All clients are currently assigned or none are available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-gray-600" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-16 h-10 bg-secondary rounded animate-pulse"></div>
                      <div className="flex-1 h-10 bg-secondary rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : todaysEvents.length > 0 ? (
                todaysEvents.map((event, index) => (
                  <div key={event.id || index} className="flex gap-4 items-start">
                    <div className="w-16 text-right shrink-0">
                      <p className="font-bold text-sm text-foreground">{formatEventTime(event.start_time)}</p>
                      {event.end_time && (
                        <p className="text-xs text-muted-foreground">{calculateEventDuration(event.start_time, event.end_time)}</p>
                      )}
                    </div>
                    <div className="relative flex-1">
                      <div className="absolute top-1.5 left-[-1.35rem] w-3 h-3 bg-gray-600 rounded-full border-2 border-card"></div>
                      <div className="pl-4 border-l-2 border-border">
                        <p className="font-semibold text-foreground">{event.title}</p>
                        {event.clientId ? (
                          <p className="text-sm text-foreground/80">
                            <Link
                              to={`${createPageUrl("ClientProfile")}?clientId=${event.clientId}`}
                              className="hover:text-gray-600 transition-colors"
                            >
                              {event.clientName}
                            </Link>
                          </p>
                        ) : (
                          <p className="text-sm text-foreground/80">{event.clientName}</p>
                        )}
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No appointments scheduled for today.</p>
                  <p className="text-sm">Stay organized and on top of your client sessions.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AddNewClientDialog
        isOpen={isAddNewClientOpen}
        onClose={() => setIsAddNewClientOpen(false)}
        onAddClient={handleAddNewClient}
      />

      <AddExistingClientDialog
        isOpen={isAddExistingClientOpen}
        onClose={() => setIsAddExistingClientOpen(false)}
        onAddClients={handleAddExistingClient}
        availableClients={availableClients}
      />
    </div>
  );
}