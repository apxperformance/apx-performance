import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { UserCheck, Search, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AssignSupplementPlanDialog({ isOpen, onClose, plan, onAssigned }) {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  // ✅ New search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      const clientData = await base44.entities.Client.filter({ coach_id: user.id });
      setClients(clientData);
    } catch (error) {
      console.error("Error loading clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Filtered and sorted clients
  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.full_name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.full_name.localeCompare(b.full_name);
        case "recent":
          return new Date(b.last_checkin || 0) - new Date(a.last_checkin || 0);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [clients, searchTerm, statusFilter, sortBy]);

  const handleAssign = async () => {
    if (!selectedClient) {
      toast.error("Please select a client");
      return;
    }

    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      
      // Create a new plan assigned to the client (copy from template)
      const assignedPlan = await base44.entities.SupplementPlan.create({
        name: plan.name,
        description: plan.description,
        coach_id: user.id,
        client_id: selectedClient.id,
        is_template: false,
        supplements: plan.supplements || []
      });

      // Update client record with supplement plan ID
      await base44.entities.Client.update(selectedClient.id, {
        supplement_plan_id: assignedPlan.id
      });

      toast.success(`Supplement plan assigned to ${selectedClient.full_name}`);
      onAssigned();
      handleClose();
    } catch (error) {
      console.error("Error assigning supplement plan:", error);
      toast.error("Failed to assign supplement plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedClient(null);
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("name");
    onClose();
  };

  // ✅ Clear filters function
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("name");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all" || sortBy !== "name";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <UserCheck className="w-5 h-5 text-[#C5B358]" />
            Assign Supplement Plan: {plan?.name}
          </DialogTitle>
        </DialogHeader>

        {/* ✅ Search and Filter Controls */}
        <div className="space-y-3 pb-4 border-b border-border">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchTerm("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-input border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending_invitation">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-input border-border">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="recent">Recent Activity</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredClients.length} of {clients.length} clients
          </div>
        </div>

        {/* Client List */}
        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#C5B358] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "No clients match your filters" 
                  : "No clients available"}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedClient?.id === client.id
                      ? "bg-[#C5B358]/20 border-[#C5B358]"
                      : "bg-secondary/50 border-border hover:border-[#C5B358]/50 hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-border">
                      <AvatarImage src={client.profile_image} alt={client.full_name} />
                      <AvatarFallback className="bg-[#C5B358]/20 text-[#C5B358]">
                        {client.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{client.full_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className={
                          client.status === "active"
                            ? "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30"
                            : client.status === "pending_invitation"
                            ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
                            : "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30"
                        }
                      >
                        {client.status === "pending_invitation" ? "Pending" : client.status}
                      </Badge>
                      {client.supplement_plan_id && (
                        <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-500">
                          Has Plan
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-border text-foreground hover:bg-secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedClient || isLoading}
            className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
          >
            {isLoading ? "Assigning..." : "Assign Plan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}