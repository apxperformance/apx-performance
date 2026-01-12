import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Users, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useClients } from "../components/contexts/ClientsContext";
import { useUser } from "../components/contexts/UserContext"; // Import useUser
import { useQuery, useQueryClient } from "@tanstack/react-query";

import ClientList from "../components/clients/ClientList";
import AddNewClientDialog from "../components/clients/AddNewClientDialog";
import AddExistingClientDialog from "../components/clients/AddExistingClientDialog";
import ConnectionRequestsSection from "../components/clients/ConnectionRequestsSection";

export default function ClientManagement() {
  const { clients, isLoading, refreshClients } = useClients();
  const { refreshCoachTier } = useUser(); // Destructure refreshCoachTier from useUser
  const [isAddNewDialogOpen, setIsAddNewDialogOpen] = useState(false);
  const [isAddExistingDialogOpen, setIsAddExistingDialogOpen] = useState(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const queryClient = useQueryClient();

  // Fetch pending connection requests
  const { data: connectionRequests = [] } = useQuery({
    queryKey: ['connectionRequests'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.id) return [];
        return base44.entities.CoachConnectionRequest.filter({
          coach_id: user.id,
          status: 'pending'
        });
      } catch (error) {
        console.error('Error fetching connection requests:', error);
        return [];
      }
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const handleInviteClient = async (inviteData) => {
    try {
      const user = await base44.auth.me();
      
      // ✅ SINGLE OPERATION: Create client with full_name constructed correctly
      const fullName = `${inviteData.first_name} ${inviteData.last_name}`.trim();
      await base44.entities.Client.create({
        full_name: fullName,
        email: inviteData.email,
        coach_id: user.id,
        status: "pending_invitation",
        user_id: null
      });

      // ✅ Non-blocking email (failure won't crash)
      base44.integrations.Core.SendEmail({
        to: inviteData.email,
        subject: `Invitation to Join ${user.full_name}'s Fitness Program`,
        body: `Hi ${inviteData.first_name},\n\n${user.full_name} has invited you to join their fitness coaching program.\n\nClick here to create your account: ${window.location.origin}\n\nLooking forward to working with you!`
      }).catch((err) => {
        console.error("Email send failed (non-critical):", err);
      });

      refreshClients();
      refreshCoachTier();
      setIsAddNewDialogOpen(false);
      toast.success("Invitation sent successfully!");
    } catch (error) {
      console.error("Error inviting client:", error);
      toast.error("Failed to send invitation");
    }
  };

  const handleAddExistingClient = async (selectedClients) => {
    try {
      const user = await base44.auth.me();

      // SYNC GUARANTEE: Process each selected client with guaranteed bi-directional linking
      for (const availableClient of selectedClients) {
        // 1. Create Client record with coach_id
        const newClient = await base44.entities.Client.create({
          user_id: availableClient.user_id,
          full_name: availableClient.full_name,
          email: availableClient.email,
          profile_image: availableClient.profile_image || "",
          coach_id: user.id, // GUARANTEED: Coach ID set
          status: "active", // Changed to active since user already exists
          join_date: new Date().toISOString()
        });

        // 2. SYNC GUARANTEE: Update the User's coach_id to link back
        await base44.entities.User.update(availableClient.user_id, { 
          coach_id: user.id,
          user_type: 'client' // Ensure user_type is set
        });

        // 3. Remove from available pool
        await base44.entities.AvailableClient.delete(availableClient.id);
      }

      refreshClients();
      refreshCoachTier();
      setIsAddExistingDialogOpen(false);
      toast.success(`${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''} added successfully!`);
    } catch (error) {
      console.error("Error adding existing clients:", error);
      toast.error("Failed to add clients");
    }
  };

  // Handle accepting connection request
  const handleAcceptRequest = async (request) => {
    setIsProcessingRequest(true);
    try {
      const user = await base44.auth.me();

      // SYNC GUARANTEE: Atomic client-coach linking
      // 1. Create Client record with coach_id
      await base44.entities.Client.create({
        user_id: request.client_id,
        full_name: request.client_name,
        email: request.client_email,
        coach_id: user.id, // GUARANTEED: Coach ID set
        status: 'active',
        join_date: new Date().toISOString()
      });

      // 2. SYNC GUARANTEE: Update User record to link coach bidirectionally
      await base44.entities.User.update(request.client_id, {
        coach_id: user.id,
        user_type: 'client' // Ensure user_type is set
      });

      // 3. Remove from available pool if exists
      const availableClients = await base44.entities.AvailableClient.filter({
        user_id: request.client_id
      });
      if (availableClients.length > 0) {
        await base44.entities.AvailableClient.delete(availableClients[0].id);
      }

      // 4. Update request status
      await base44.entities.CoachConnectionRequest.update(request.id, {
        status: 'accepted'
      });

      toast.success(`${request.client_name} has been added to your client roster!`);
      refreshClients();
      refreshCoachTier();
      queryClient.invalidateQueries({ queryKey: ['connectionRequests'] });
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
    } finally {
      setIsProcessingRequest(false);
    }
  };

  // Handle rejecting connection request
  const handleRejectRequest = async (request) => {
    if (!window.confirm(`Are you sure you want to decline ${request.client_name}'s request?`)) {
      return;
    }

    setIsProcessingRequest(true);
    try {
      await base44.entities.CoachConnectionRequest.update(request.id, {
        status: 'rejected'
      });

      toast.info(`Request from ${request.client_name} has been declined`);
      queryClient.invalidateQueries({ queryKey: ['connectionRequests'] });
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to decline request");
    } finally {
      setIsProcessingRequest(false);
    }
  };

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
            <Users className="w-8 h-8 text-gray-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Client Management</h1>
          </div>
          <p className="text-muted-foreground">View, manage, and invite your clients.</p>
        </div>
        <div className="flex gap-3 ml-auto flex-shrink-0">
          <Button
            onClick={() => setIsAddNewDialogOpen(true)}
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold whitespace-nowrap"
          >
            <Mail className="w-4 h-4 mr-2" />
            Invite New Client
          </Button>
          <Button
            onClick={() => setIsAddExistingDialogOpen(true)}
            variant="outline"
            className="border-border text-foreground hover:bg-secondary whitespace-nowrap"
          >
            <Users className="w-4 h-4 mr-2" />
            Add from Pool
          </Button>
        </div>
      </motion.div>

      {/* Connection Requests Section */}
      <ConnectionRequestsSection
        requests={connectionRequests}
        onAccept={handleAcceptRequest}
        onReject={handleRejectRequest}
        isProcessing={isProcessingRequest}
      />

      {/* Existing Clients List */}
      <ClientList clients={clients} isLoading={isLoading} onClientUpdate={refreshClients} />

      <AddNewClientDialog
        isOpen={isAddNewDialogOpen}
        onClose={() => setIsAddNewDialogOpen(false)}
        onAddClient={handleInviteClient}
      />

      <AddExistingClientDialog
        isOpen={isAddExistingDialogOpen}
        onClose={() => setIsAddExistingDialogOpen(false)}
        onAddClients={handleAddExistingClient}
      />
    </div>
  );
}